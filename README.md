# 🚌 Bus Ticketing USSD System

A complete USSD-based bus ticketing system built with Node.js and SQLite.

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start the server
./start.sh
# OR
node server.js
```

The server will start on `http://localhost:3000`

### 🚂 Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy)

**One-click deployment to Railway** - See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

## 📚 **Complete Setup Guides**

### 🚀 **Production Setup**
- **[Africa's Talking Integration](./AFRICASTALKING_SETUP.md)** - Connect to USSD provider
- **[Custom Domain Setup](./CUSTOM_DOMAIN_SETUP.md)** - Professional domain configuration
- **[Monitoring & Alerts](./MONITORING_SETUP.md)** - 24/7 system monitoring
- **[Operator Management](./OPERATOR_MANAGEMENT.md)** - Train and manage operators

### 📋 **Deployment Status**
- **[Deployment Summary](./DEPLOYMENT_SUMMARY.md)** - Project organization overview
- **[Deployment Status](./DEPLOYMENT_STATUS.md)** - Current deployment status

## 📱 USSD Endpoints

### Customer Interface (`/ussd`)
- **View Bus Schedules** - See available buses and routes
- **Book Ticket** - Complete booking process with seat selection
- **Check Booking** - Verify booking status with booking code
- **Cancel Booking** - Cancel existing bookings

### Operator Interface (`/ussd-ops`)
- **Today's Buses** - View buses for the day
- **Verify Booking** - Check customer booking details
- **Mark Boarded** - Mark passengers as boarded
- **Seats Left** - Quick view of available seats
- **Add Walk-in** - Add cash passengers

## 🔑 Operator PINs

| Operator | PIN |
|----------|-----|
| Juba Express | 1234 |
| Unity Transport | 5678 |
| South Sudan Bus | 9999 |

## 🧪 Testing

### Test Customer Flow
```bash
# Start session
curl -X POST https://bus-ticketing-production.up.railway.app/ussd \
  -d "sessionId=test&serviceCode=*123#&phoneNumber=1234567890&text="

# View buses
curl -X POST https://bus-ticketing-production.up.railway.app/ussd \
  -d "sessionId=test&serviceCode=*123#&phoneNumber=1234567890&text=1"

# Book ticket (select bus 1, seat 5)
curl -X POST https://bus-ticketing-production.up.railway.app/ussd \
  -d "sessionId=test&serviceCode=*123#&phoneNumber=1234567890&text=2*1*5*1"
```

### Test Operator Flow
```bash
# Login as operator
curl -X POST https://bus-ticketing-production.up.railway.app/ussd-ops \
  -d "sessionId=op&text=1234"

# View today's buses
curl -X POST https://bus-ticketing-production.up.railway.app/ussd-ops \
  -d "sessionId=op&text=1234*1"

# Verify booking
curl -X POST https://bus-ticketing-production.up.railway.app/ussd-ops \
  -d "sessionId=op&text=1234*2*BOOKING_CODE"
```

## 🗄️ Database

The system uses SQLite with the following tables:
- `users` - Customer phone numbers
- `operators` - Bus operators with USSD PINs
- `buses` - Bus routes, schedules, and availability
- `bookings` - Customer bookings and seat assignments
- `transactions` - Payment records

## 📊 Sample Data

The system comes pre-loaded with:
- 3 bus operators
- 4 sample bus routes (Juba to Wau, Malakal, Rumbek, Yei)
- Various departure times and pricing

## 🔧 Health Checks

- `GET /ok` - Basic server health
- `GET /db-ping` - Database connectivity

## 🛡️ Security Features

- Rate limiting on USSD endpoints
- XSS protection
- Helmet security headers
- Input sanitization
- Session management

## 📝 Logs

- Error logs: `error.log`
- Combined logs: `combined.log`
- Console output in development mode

## 🎯 Features

✅ Complete USSD customer interface  
✅ Operator management interface  
✅ Real-time seat availability  
✅ Booking confirmation system  
✅ Payment processing (sandbox)  
✅ Booking verification  
✅ Cancellation system  
✅ Walk-in passenger support  
✅ SQLite database (no external dependencies)  
✅ Comprehensive logging  
✅ Security middleware  
✅ Rate limiting  
