// Load environment variables
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const winston = require('winston');
const mysql = require('mysql2/promise');

const app = express();

// ----------------- Security & Middleware -----------------
app.use(helmet());
app.use(xss());
app.use(express.urlencoded({ extended: true })); // Africa's Talking sends form-encoded
app.use(express.json());

// ----------------- Rate limiting -----------------
app.set('trust proxy', 1);
app.use('/ussd', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/ussd-ops', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ----------------- Logger -----------------
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// ----------------- Database -----------------
let db;
(async () => {
  try {
    db = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 10,
    });
    await db.query('SELECT 1');
    console.log('[DB] Connected');
  } catch (e) {
    console.error('[DB] Connection error:', e.message);
    process.exit(1);
  }
})();

// ----------------- Health checks -----------------
app.get('/ok', (_req, res) => res.send('OK'));
app.get('/db-ping', async (_req, res) => {
  try { await db.query('SELECT 1'); res.json({ ok: 1 }); }
  catch (e) { res.status(500).json({ ok: 0, err: e.message }); }
});

// ----------------- Session handling -----------------
const sessions = new Map();
const getSession = (sessionId) => {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { step: 0, data: {}, lastActive: Date.now() });
  }
  const s = sessions.get(sessionId);
  s.lastActive = Date.now();
  return s;
};

// ----------------- Helpers -----------------
const mainMenu = 'CON Welcome to Bus Ticketing\n1. View Bus Schedules\n2. Book Ticket\n3. Check Booking\n4. Cancel Booking';
const endWith = (msg) => `END ${msg}`;

const loadBusList = async () => {
  const [rows] = await db.query(
    `SELECT id, route, operator, departure_time, available_seats, price
     FROM buses WHERE available_seats > 0 ORDER BY departure_time ASC`
  );
  return rows;
};

const formatBusList = (buses) => {
  if (!buses.length) return 'CON No buses available right now.\n0. Back';
  let out = 'CON Available Buses:\n';
  buses.forEach((b, i) => {
    const dt = new Date(b.departure_time).toLocaleString('en-GB');
    out += `${i + 1}. ${b.route} | ${dt} | ${b.available_seats} seats | ${b.price} SSP\n`;
  });
  out += '0. Back';
  return out;
};

// ----------------- USSD (customer) -----------------
app.post('/ussd', async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  try {
    const session = getSession(sessionId);
    const parts = (text || '').split('*').filter(Boolean);
    const last = parts[parts.length - 1] || '';

    // Restart or empty input
    if (last === '0' || text === '') {
      session.step = 0;
      session.data = {};
      res.set('Content-Type', 'text/plain');
      return res.send(mainMenu);
    }

    // Ensure user exists
    const [u] = await db.query('SELECT id FROM users WHERE phone_number = ?', [phoneNumber]);
    if (!u.length) {
      await db.query('INSERT INTO users (phone_number) VALUES (?)', [phoneNumber]);
    }

    // Option 1: View buses
    if (text === '1') {
      const buses = await loadBusList();
      session.step = 1;
      session.data.busList = buses;
      res.set('Content-Type', 'text/plain');
      return res.send(formatBusList(buses));
    }

    // Option 2: Start booking
    if (text === '2') {
      const buses = await loadBusList();
      session.step = 2;
      session.data.busList = buses;
      res.set('Content-Type', 'text/plain');
      return res.send('CON Enter Bus Number (e.g., 1):\n0. Back');
    }

    // Step 2 → pick bus
    if (session.step === 2 && parts.length === 2) {
      const idx = parseInt(last, 10) - 1;
      const picked = session.data.busList?.[idx];
      if (!picked) return res.send(endWith('Invalid selection.'));
      session.step = 3;
      session.data.busId = picked.id;
      res.set('Content-Type', 'text/plain');
      return res.send(`CON Enter Seat Number (1-${picked.available_seats}):\n0. Back`);
    }

    // Step 3 → pick seat, create booking
    if (session.step === 3 && parts.length === 3) {
      const seat = parseInt(last, 10);
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const [[bus]] = await conn.query(
          'SELECT available_seats, total_seats, price FROM buses WHERE id=? FOR UPDATE',
          [session.data.busId]
        );
        if (!bus || seat < 1 || seat > bus.total_seats) {
          await conn.rollback(); conn.release();
          return res.send(endWith('Invalid seat number.'));
        }

        const [[taken]] = await conn.query(
          'SELECT 1 FROM bookings WHERE bus_id=? AND seat_number=? AND status!="cancelled" LIMIT 1',
          [session.data.busId, seat]
        );
        if (taken) {
          await conn.rollback(); conn.release();
          return res.send(endWith('Seat already booked.'));
        }

        if (bus.available_seats <= 0) {
          await conn.rollback(); conn.release();
          return res.send(endWith('No seats available.'));
        }

        const bookingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const [ins] = await conn.query(
          `INSERT INTO bookings (user_id, bus_id, seat_number, booking_code, status)
           VALUES ((SELECT id FROM users WHERE phone_number=?), ?, ?, ?, 'pending')`,
          [phoneNumber, session.data.busId, seat, bookingCode]
        );

        await conn.query(
          'UPDATE buses SET available_seats = available_seats - 1 WHERE id=?',
          [session.data.busId]
        );

        await conn.commit();
        conn.release();

        session.step = 4;
        session.data.bookingId = ins.insertId;
        session.data.bookingCode = bookingCode;

        res.set('Content-Type', 'text/plain');
        return res.send(`CON Booking created! Code: ${bookingCode}\nProceed to payment:\n1. Sandbox Pay\n2. Pay at Agent\n0. Back`);

      } catch (err) {
        await conn.rollback();
        conn.release();
        return res.send(endWith('Booking failed. Try again.'));
      }
    }

    // Step 4 → payment
    if (session.step === 4 && parts.length === 4) {
      if (last === '1') {
        const [[{ price }]] = await db.query('SELECT price FROM buses WHERE id=?', [session.data.busId]);
        await db.query(
          'INSERT INTO transactions (booking_id, amount, payment_method, status) VALUES (?,?,?,?)',
          [session.data.bookingId, price, 'Sandbox', 'completed']
        );
        await db.query('UPDATE bookings SET status="confirmed" WHERE id=?', [session.data.bookingId]);
        return res.send(endWith(`Payment confirmed. Your booking code: ${session.data.bookingCode}`));
      }
      if (last === '2') {
        return res.send(endWith(`Visit an agent with your code: ${session.data.bookingCode}`));
      }
    }

    // Option 3: Check booking
    if (text === '3') {
      return res.send('CON Enter booking code:\n0. Back');
    }
    if (parts[0] === '3' && parts.length === 2) {
      const code = parts[1].trim().toUpperCase();
      const [rows] = await db.query(
        `SELECT b.booking_code, b.status, b.seat_number, bu.route, bu.departure_time
         FROM bookings b JOIN buses bu ON bu.id = b.bus_id
         WHERE b.booking_code = ? LIMIT 1`, [code]
      );
      if (!rows.length) return res.send(endWith('Booking not found.'));
      const r = rows[0];
      const dt = new Date(r.departure_time).toLocaleString('en-GB');
      return res.send(`END Code: ${r.booking_code}\nRoute: ${r.route}\nSeat: ${r.seat_number}\nWhen: ${dt}\nStatus: ${r.status}`);
    }

    // Option 4: Cancel booking
    if (text === '4') {
      return res.send('CON Enter booking code to cancel:\n0. Back');
    }
    if (parts[0] === '4' && parts.length === 2) {
      const code = parts[1].trim().toUpperCase();
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        const [[bk]] = await conn.query('SELECT id, bus_id, status FROM bookings WHERE booking_code=? FOR UPDATE', [code]);
        if (!bk) { await conn.rollback(); conn.release(); return res.send(endWith('Booking not found.')); }
        if (bk.status === 'cancelled') { await conn.rollback(); conn.release(); return res.send(endWith('Already cancelled.')); }
        await conn.query('UPDATE bookings SET status="cancelled" WHERE id=?', [bk.id]);
        await conn.query('UPDATE buses SET available_seats = available_seats + 1 WHERE id=?', [bk.bus_id]);
        await conn.commit(); conn.release();
        return res.send(endWith('Booking cancelled.'));
      } catch (e) {
        await conn.rollback(); conn.release();
        return res.send(endWith('Cancel failed.'));
      }
    }

    // Fallback → main menu
    res.set('Content-Type', 'text/plain');
    return res.send(mainMenu);

  } catch (err) {
    res.set('Content-Type', 'text/plain');
    return res.send(endWith('Error. Try again later.'));
  }
});

// ----------------- Start server -----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




// =====================
// OPERATOR USSD (/ussd-ops)
// =====================

const opSess = global.__OP_SESS_MAP__ || new Map();
global.__OP_SESS_MAP__ = opSess;

const opsGet = (sid) => {
  if (!opSess.has(sid)) {
    opSess.set(sid, { step: 0, data: {}, last: Date.now(), opId: null, opName: null });
  }
  const s = opSess.get(sid);
  s.last = Date.now();
  return s;
};

const opsReply = (res, body) => { res.set('Content-Type', 'text/plain'); res.send(body); };

const opsMenu = `CON Operator Menu
1. Today’s buses
2. Verify booking
3. Mark boarded
4. Seats left
5. Add walk-in (cash)
0. Logout`;

async function opsLoadTodayBuses(opId) {
  const [rows] = await db.query(
    `SELECT id, route, operator, departure_time, total_seats, available_seats
     FROM buses
     WHERE operator_id=? 
       AND departure_time >= NOW()
       AND departure_time < NOW() + INTERVAL 7 DAY
     ORDER BY departure_time ASC`, [opId]
  );
  return rows;
}


app.post('/ussd-ops', async (req, res) => {
  const { sessionId, text } = req.body;
  const s = opsGet(sessionId);
  const parts = (text || '').split('*').filter(Boolean);
  const last = parts[parts.length - 1] || '';

  try {
    if (text === '' || last === '0') {
      s.step = 0; s.data = {}; s.opId = null; s.opName = null;
      return opsReply(res, 'CON Enter operator PIN:');
    }

    // Secure login
    if (!s.opId) {
      const pin = last.trim();
      const [ops] = await db.query('SELECT id, name FROM operators WHERE ussd_pin=? LIMIT 1', [pin]);
      if (!ops.length) {
        s.step = 0;
        return opsReply(res, 'CON Invalid PIN. Try again:\n0. Back');
      }
      s.opId = ops[0].id;
      s.opName = ops[0].name;
      s.step = 1;
      return opsReply(res, opsMenu);
    }

    // Main menu
    // Main menu
if (s.step === 1) {
  // 1) Today's buses (list)
  if (last === '1') {
    const buses = await opsLoadTodayBuses(s.opId);
    if (!buses.length) return opsReply(res, 'END No buses today.');
    let out = 'END Today’s buses:\n';
    buses.forEach((b, i) => {
      const dt = new Date(b.departure_time).toISOString().replace('T',' ').slice(0,16);
      out += `${i + 1}. ${b.route} | ${dt} | ${b.available_seats}/${b.total_seats}\n`;
    });
    return opsReply(res, out.trim());
  }

  // 2) Verify booking
  if (last === '2') {
    s.step = 20;
    return opsReply(res, 'CON Enter booking code to verify:\n0. Back');
  }

  // 3) Mark boarded
  if (last === '3') {
    s.step = 30;
    return opsReply(res, 'CON Enter booking code to mark boarded:\n0. Back');
  }

  // 4) Seats left (quick list)
  if (last === '4') {
    const buses = await opsLoadTodayBuses(s.opId);
    if (!buses.length) return opsReply(res, 'END No buses today.');
    let out = 'END Seats left today:\n';
    buses.forEach((b, i) => {
      out += `${i + 1}. ${b.route}: ${b.available_seats} left\n`;
    });
    return opsReply(res, out.trim());
  }

  // 5) Add walk-in (existing)
  if (last === '5') {
    const buses = await opsLoadTodayBuses(s.opId);
    if (!buses.length) return opsReply(res, 'CON No buses today.\n0. Back');
    s.data.busList = buses;
    s.step = 5;
    let out = 'CON Choose bus for walk-in:\n';
    buses.forEach((b, i) => {
      const dt = new Date(b.departure_time).toISOString().replace('T', ' ').substring(0, 16);
      out += `${i + 1}. ${b.route} | ${dt} | left ${b.available_seats}\n`;
    });
    out += '0. Back';
    return opsReply(res, out);
  }

  // default: show menu again
  return opsReply(res, opsMenu);
}


// Step 20: Verify booking by code
if (s.step === 20 && parts.length >= 2) {
  const code = last.trim().toUpperCase();
  const [rows] = await db.query(
    `SELECT b.booking_code, b.status, b.seat_number, bu.route, bu.departure_time
     FROM bookings b JOIN buses bu ON bu.id=b.bus_id
     WHERE b.booking_code=? LIMIT 1`, [code]
  );
  if (!rows.length) return opsReply(res, 'END Booking not found.');
  const r = rows[0];
  const dt = new Date(r.departure_time).toISOString().replace('T',' ').slice(0,16);
  return opsReply(res, `END Code ${r.booking_code}\n${r.route} @ ${dt}\nSeat ${r.seat_number}\nStatus ${r.status.toUpperCase()}`);
}

// Step 30: Mark boarded by code (only if confirmed)
if (s.step === 30 && parts.length >= 2) {
  const code = last.trim().toUpperCase();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[bk]] = await conn.query(
      `SELECT id, status, boarded FROM bookings WHERE booking_code=? FOR UPDATE`, [code]
    );
    if (!bk) { await conn.rollback(); conn.release(); return opsReply(res, 'END Booking not found.'); }
    if (bk.status !== 'confirmed') { await conn.rollback(); conn.release(); return opsReply(res, 'END Not confirmed yet.'); }
    if (bk.boarded === 1) { await conn.rollback(); conn.release(); return opsReply(res, 'END Already marked boarded.'); }
    await conn.query(`UPDATE bookings SET boarded=1 WHERE id=?`, [bk.id]);
    await conn.commit(); conn.release();
    return opsReply(res, 'END Marked as boarded ✅');
  } catch (e) {
    await conn.rollback(); conn.release();
    return opsReply(res, 'END Error marking boarded.');
  }
}



    // Walk-in pick bus
    if (s.step === 5 && parts.length >= 2) {
      const idx = parseInt(last, 10) - 1;
      const picked = s.data.busList?.[idx];
      if (!picked) return opsReply(res, 'END Invalid selection.');

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const [[busInfo]] = await conn.query(
          'SELECT total_seats, available_seats FROM buses WHERE id=? FOR UPDATE',
          [picked.id]
        );
        if (!busInfo || busInfo.available_seats <= 0) {
          await conn.rollback(); conn.release();
          return opsReply(res, 'END No seats left.');
        }

        const [[{ maxSeat }]] = await conn.query(
          'SELECT MAX(seat_number) AS maxSeat FROM bookings WHERE bus_id=?',
          [picked.id]
        );
        const nextSeat = (maxSeat || 0) + 1;
        if (nextSeat > busInfo.total_seats) {
          await conn.rollback(); conn.release();
          return opsReply(res, 'END No seats left.');
        }

        const walkCode = ('WALK' + Math.random().toString(36).substring(2, 6)).toUpperCase();

        await conn.query(
          `INSERT INTO bookings (user_id, bus_id, seat_number, booking_code, status)
           VALUES (NULL, ?, ?, ?, 'confirmed')`,
          [picked.id, nextSeat, walkCode]
        );
        await conn.query('UPDATE buses SET available_seats = available_seats - 1 WHERE id=?', [picked.id]);

        await conn.commit();
        conn.release();
        return opsReply(res, `END Walk-in added. Seat ${nextSeat}. Code ${walkCode} ✅`);
      } catch (err) {
        await conn.rollback();
        conn.release();
        return opsReply(res, 'END Error adding walk-in.');
      }
    }

    return opsReply(res, 'END Unsupported option.');
  } catch (e) {
    return opsReply(res, 'END Error. Try again.');
  }
});
