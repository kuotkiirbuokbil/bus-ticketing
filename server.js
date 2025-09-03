// Load environment variables
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const winston = require('winston');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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
const dbPath = path.join(__dirname, process.env.DATABASE_PATH || 'bus_ticketing.db');
let db;

// Initialize database and create tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[DB] Connection error:', err.message);
        reject(err);
        return;
      }
      console.log('[DB] Connected to SQLite database');
      
      // Create tables
      const createTables = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Operators table
        CREATE TABLE IF NOT EXISTS operators (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          ussd_pin TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Buses table
        CREATE TABLE IF NOT EXISTS buses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          route TEXT NOT NULL,
          operator TEXT NOT NULL,
          operator_id INTEGER,
          departure_time DATETIME NOT NULL,
          total_seats INTEGER NOT NULL DEFAULT 50,
          available_seats INTEGER NOT NULL DEFAULT 50,
          price DECIMAL(10,2) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (operator_id) REFERENCES operators (id)
        );

        -- Bookings table
        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          bus_id INTEGER NOT NULL,
          seat_number INTEGER NOT NULL,
          booking_code TEXT UNIQUE NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          boarded INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (bus_id) REFERENCES buses (id)
        );

        -- Transactions table
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          booking_id INTEGER NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          payment_method TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (booking_id) REFERENCES bookings (id)
        );
      `;

      db.exec(createTables, (err) => {
        if (err) {
          console.error('[DB] Error creating tables:', err.message);
          reject(err);
          return;
        }
        console.log('[DB] Tables created successfully');
        
        // Insert sample data
        insertSampleData().then(resolve).catch(reject);
      });
    });
  });
};

// Insert sample data
const insertSampleData = () => {
  return new Promise((resolve, reject) => {
    // Insert sample operators
    const operators = [
      { name: 'Juba Express', pin: '1234' },
      { name: 'Unity Transport', pin: '5678' },
      { name: 'South Sudan Bus', pin: '9999' }
    ];

    const insertOperators = `INSERT OR IGNORE INTO operators (name, ussd_pin) VALUES (?, ?)`;
    let completed = 0;
    
    operators.forEach(op => {
      db.run(insertOperators, [op.name, op.pin], (err) => {
        if (err) {
          console.error('Error inserting operator:', err);
          reject(err);
          return;
        }
        completed++;
        if (completed === operators.length) {
          insertSampleBuses().then(resolve).catch(reject);
        }
      });
    });
  });
};

// Insert sample buses
const insertSampleBuses = () => {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const buses = [
      { route: 'Juba - Wau', operator: 'Juba Express', operator_id: 1, departure_time: tomorrow.toISOString(), total_seats: 50, available_seats: 45, price: 150.00 },
      { route: 'Juba - Malakal', operator: 'Unity Transport', operator_id: 2, departure_time: tomorrow.toISOString(), total_seats: 50, available_seats: 50, price: 200.00 },
      { route: 'Juba - Rumbek', operator: 'South Sudan Bus', operator_id: 3, departure_time: dayAfter.toISOString(), total_seats: 50, available_seats: 48, price: 120.00 },
      { route: 'Juba - Yei', operator: 'Juba Express', operator_id: 1, departure_time: dayAfter.toISOString(), total_seats: 50, available_seats: 50, price: 80.00 }
    ];

    const insertBuses = `INSERT OR IGNORE INTO buses (route, operator, operator_id, departure_time, total_seats, available_seats, price) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    let completed = 0;
    
    buses.forEach(bus => {
      db.run(insertBuses, [bus.route, bus.operator, bus.operator_id, bus.departure_time, bus.total_seats, bus.available_seats, bus.price], (err) => {
        if (err) {
          console.error('Error inserting bus:', err);
          reject(err);
          return;
        }
        completed++;
        if (completed === buses.length) {
          console.log('[DB] Sample data inserted successfully');
          resolve();
        }
      });
    });
  });
};

// Database query helper
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve([rows]);
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
      });
    }
  });
};

// Initialize database
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// ----------------- Health checks -----------------
app.get('/ok', (_req, res) => res.send('OK'));
app.get('/db-ping', async (_req, res) => {
  try { 
    await dbQuery('SELECT 1'); 
    res.json({ ok: 1 }); 
  }
  catch (e) { 
    res.status(500).json({ ok: 0, err: e.message }); 
  }
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
  const [rows] = await dbQuery(
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
    const [u] = await dbQuery('SELECT id FROM users WHERE phone_number = ?', [phoneNumber]);
    if (!u.length) {
      await dbQuery('INSERT INTO users (phone_number) VALUES (?)', [phoneNumber]);
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
      
      try {
        // Get bus info
        const [[bus]] = await dbQuery(
          'SELECT available_seats, total_seats, price FROM buses WHERE id=?',
          [session.data.busId]
        );
        
        if (!bus || seat < 1 || seat > bus.total_seats) {
          return res.send(endWith('Invalid seat number.'));
        }

        // Check if seat is taken
        const [[taken]] = await dbQuery(
          'SELECT 1 FROM bookings WHERE bus_id=? AND seat_number=? AND status!="cancelled" LIMIT 1',
          [session.data.busId, seat]
        );
        
        if (taken) {
          return res.send(endWith('Seat already booked.'));
        }

        if (bus.available_seats <= 0) {
          return res.send(endWith('No seats available.'));
        }

        const bookingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Create booking
        const [ins] = await dbQuery(
          `INSERT INTO bookings (user_id, bus_id, seat_number, booking_code, status)
           VALUES ((SELECT id FROM users WHERE phone_number=?), ?, ?, ?, 'pending')`,
          [phoneNumber, session.data.busId, seat, bookingCode]
        );

        // Update available seats
        await dbQuery(
          'UPDATE buses SET available_seats = available_seats - 1 WHERE id=?',
          [session.data.busId]
        );

        session.step = 4;
        session.data.bookingId = ins.insertId;
        session.data.bookingCode = bookingCode;

        res.set('Content-Type', 'text/plain');
        return res.send(`CON Booking created! Code: ${bookingCode}\nProceed to payment:\n1. Sandbox Pay\n2. Pay at Agent\n0. Back`);

      } catch (err) {
        console.error('Booking error:', err);
        return res.send(endWith('Booking failed. Try again.'));
      }
    }

    // Step 4 → payment
    if (session.step === 4 && parts.length === 4) {
      if (last === '1') {
        const [[{ price }]] = await dbQuery('SELECT price FROM buses WHERE id=?', [session.data.busId]);
        await dbQuery(
          'INSERT INTO transactions (booking_id, amount, payment_method, status) VALUES (?,?,?,?)',
          [session.data.bookingId, price, 'Sandbox', 'completed']
        );
        await dbQuery('UPDATE bookings SET status="confirmed" WHERE id=?', [session.data.bookingId]);
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
      const [rows] = await dbQuery(
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
      try {
        const [[bk]] = await dbQuery('SELECT id, bus_id, status FROM bookings WHERE booking_code=?', [code]);
        if (!bk) return res.send(endWith('Booking not found.'));
        if (bk.status === 'cancelled') return res.send(endWith('Already cancelled.'));
        
        await dbQuery('UPDATE bookings SET status="cancelled" WHERE id=?', [bk.id]);
        await dbQuery('UPDATE buses SET available_seats = available_seats + 1 WHERE id=?', [bk.bus_id]);
        return res.send(endWith('Booking cancelled.'));
      } catch (e) {
        return res.send(endWith('Cancel failed.'));
      }
    }

    // Fallback → main menu
    res.set('Content-Type', 'text/plain');
    return res.send(mainMenu);

  } catch (err) {
    console.error('USSD Error:', err);
    res.set('Content-Type', 'text/plain');
    return res.send(endWith('Error. Try again later.'));
  }
});

// ----------------- Start server -----------------
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚌 Bus Ticketing Server running on ${HOST}:${PORT}`);
  console.log(`📱 USSD Endpoint: http://${HOST}:${PORT}/ussd`);
  console.log(`👨‍💼 Operator Endpoint: http://${HOST}:${PORT}/ussd-ops`);
  console.log(`💚 Health Check: http://${HOST}:${PORT}/ok`);
});

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
1. Today's buses
2. Verify booking
3. Mark boarded
4. Seats left
5. Add walk-in (cash)
0. Logout`;

async function opsLoadTodayBuses(opId) {
  const [rows] = await dbQuery(
    `SELECT id, route, operator, departure_time, total_seats, available_seats
     FROM buses
     WHERE operator_id=? 
       AND departure_time >= datetime('now')
       AND departure_time < datetime('now', '+7 days')
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
      const [ops] = await dbQuery('SELECT id, name FROM operators WHERE ussd_pin=? LIMIT 1', [pin]);
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
    if (s.step === 1) {
      // 1) Today's buses (list)
      if (last === '1') {
        const buses = await opsLoadTodayBuses(s.opId);
        if (!buses.length) return opsReply(res, 'END No buses today.');
        let out = 'END Today\'s buses:\n';
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
      const [rows] = await dbQuery(
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
      try {
        const [[bk]] = await dbQuery(
          `SELECT id, status, boarded FROM bookings WHERE booking_code=?`, [code]
        );
        if (!bk) return opsReply(res, 'END Booking not found.');
        if (bk.status !== 'confirmed') return opsReply(res, 'END Not confirmed yet.');
        if (bk.boarded === 1) return opsReply(res, 'END Already marked boarded.');
        
        await dbQuery(`UPDATE bookings SET boarded=1 WHERE id=?`, [bk.id]);
        return opsReply(res, 'END Marked as boarded ✅');
      } catch (e) {
        return opsReply(res, 'END Error marking boarded.');
      }
    }

    // Walk-in pick bus
    if (s.step === 5 && parts.length >= 2) {
      const idx = parseInt(last, 10) - 1;
      const picked = s.data.busList?.[idx];
      if (!picked) return opsReply(res, 'END Invalid selection.');

      try {
        const [[busInfo]] = await dbQuery(
          'SELECT total_seats, available_seats FROM buses WHERE id=?',
          [picked.id]
        );
        
        if (!busInfo || busInfo.available_seats <= 0) {
          return opsReply(res, 'END No seats left.');
        }

        const [[{ maxSeat }]] = await dbQuery(
          'SELECT MAX(seat_number) AS maxSeat FROM bookings WHERE bus_id=?',
          [picked.id]
        );
        
        const nextSeat = (maxSeat || 0) + 1;
        if (nextSeat > busInfo.total_seats) {
          return opsReply(res, 'END No seats left.');
        }

        const walkCode = ('WALK' + Math.random().toString(36).substring(2, 6)).toUpperCase();

        await dbQuery(
          `INSERT INTO bookings (user_id, bus_id, seat_number, booking_code, status)
           VALUES (NULL, ?, ?, ?, 'confirmed')`,
          [picked.id, nextSeat, walkCode]
        );
        await dbQuery('UPDATE buses SET available_seats = available_seats - 1 WHERE id=?', [picked.id]);

        return opsReply(res, `END Walk-in added. Seat ${nextSeat}. Code ${walkCode} ✅`);
      } catch (err) {
        return opsReply(res, 'END Error adding walk-in.');
      }
    }

    return opsReply(res, 'END Unsupported option.');
  } catch (e) {
    console.error('Operator USSD Error:', e);
    return opsReply(res, 'END Error. Try again.');
  }
});
