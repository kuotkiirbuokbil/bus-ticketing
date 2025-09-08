# 📱 USSD Codes Reference

## 🎯 **Your Live USSD Codes**

### **📱 Customer USSD Code**
- **Code**: `*123#`
- **Purpose**: Customer bus ticketing
- **Features**: View buses, book tickets, check bookings, cancel bookings

### **👨‍💼 Operator USSD Code**
- **Code**: `*456#`
- **Purpose**: Bus operator management
- **Features**: View buses, verify bookings, mark boarded, add walk-ins

---

## 🚀 **Quick Start Guide**

### **For Customers:**
1. **Dial**: `*123#`
2. **Select option**:
   - `1` - View Bus Schedules
   - `2` - Book Ticket
   - `3` - Check Booking
   - `4` - Cancel Booking

### **For Operators:**
1. **Dial**: `*456#`
2. **Enter PIN**:
   - `1234` - Uganda Express
   - `5678` - Central Coaches
   - `9999` - Nile Bus
3. **Select option**:
   - `1` - Today's buses
   - `2` - Verify booking
   - `3` - Mark boarded
   - `4` - Seats left
   - `5` - Add walk-in (cash)

---

## 🔧 **Technical Details**

### **Callback URLs:**
- **Customer**: `https://bus-ticketing-production.up.railway.app/ussd`
- **Operator**: `https://bus-ticketing-production.up.railway.app/ussd-ops`

### **Request Format:**
- **Method**: POST
- **Content-Type**: application/x-www-form-urlencoded
- **Session Timeout**: 300 seconds (customers), 600 seconds (operators)

---

## 📊 **System Status**

### **Live System:**
- **URL**: `https://bus-ticketing-production.up.railway.app`
- **Status**: ✅ Operational
- **Database**: ✅ Connected
- **Health Check**: ✅ Passing

### **Test Commands:**
```bash
# Test customer USSD
curl -X POST https://bus-ticketing-production.up.railway.app/ussd \
  -d "sessionId=test&serviceCode=*123#&phoneNumber=1234567890&text="

# Test operator USSD
curl -X POST https://bus-ticketing-production.up.railway.app/ussd-ops \
  -d "sessionId=op&text=1234"
```

---

## 🎯 **Ready for Production!**

Your USSD codes are now configured and ready for real customers:
- ✅ **Customer Code**: `*123#` - Live and tested
- ✅ **Operator Code**: `*456#` - Live and tested
- ✅ **System**: Fully operational
- ✅ **Documentation**: Updated

**🚀 Your Bus Ticketing USSD System is ready for real customers!**

