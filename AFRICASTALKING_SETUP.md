# 📱 Africa's Talking USSD Integration Guide

## 🎯 Complete Setup for Bus Ticketing System

### 🚀 **Your Live Endpoints:**
- **Customer USSD**: `https://bus-ticketing-production.up.railway.app/ussd`
- **Operator USSD**: `https://bus-ticketing-production.up.railway.app/ussd-ops`

---

## 📋 **Step 1: Create Africa's Talking Account**

### 1.1 Sign Up
1. Go to [africastalking.com](https://africastalking.com)
2. Click **"Sign Up"**
3. Fill in your details:
   - **Name**: Your company name
   - **Email**: Your business email
   - **Phone**: Your contact number
   - **Country**: Select your country
   - **Use Case**: Select "USSD Services"

### 1.2 Account Verification
1. **Email Verification**: Check your email and click verification link
2. **Phone Verification**: Enter the SMS code sent to your phone
3. **Business Verification**: Upload business documents (if required)

---

## 🔧 **Step 2: Create USSD Application**

### 2.1 Access USSD Dashboard
1. **Login** to your Africa's Talking account
2. Go to **"USSD"** in the left sidebar
3. Click **"Create Application"**

### 2.2 Application Configuration
Fill in the application details:

| Field | Value | Description |
|-------|-------|-------------|
| **Application Name** | `Bus Ticketing System` | Your app name |
| **Short Code** | `*123#` | Customer USSD code |
| **Callback URL** | `https://bus-ticketing-production.up.railway.app/ussd` | Customer endpoint |
| **Operator Callback URL** | `https://bus-ticketing-production.up.railway.app/ussd-ops` | Operator endpoint |
| **HTTP Method** | `POST` | Request method |
| **Content Type** | `application/x-www-form-urlencoded` | Data format |

### 2.3 Advanced Settings
- **Session Timeout**: `300` seconds (5 minutes)
- **Max Session Length**: `10` (maximum menu levels)
- **Enable Session Management**: `Yes`

---

## 🎛️ **Step 3: Configure Operator Application**

### 3.1 Create Operator App
1. **Create another USSD application** for operators
2. **Application Name**: `Bus Ticketing Operators`
3. **Short Code**: `*456#` (operator USSD code)
4. **Callback URL**: `https://bus-ticketing-production.up.railway.app/ussd-ops`
5. **HTTP Method**: `POST`
6. **Content Type**: `application/x-www-form-urlencoded`

### 3.2 Operator Settings
- **Session Timeout**: `600` seconds (10 minutes)
- **Max Session Length**: `15`
- **Enable Session Management**: `Yes`

---

## 🧪 **Step 4: Test Your Integration**

### 4.1 Test Customer USSD
1. **Dial your USSD code**: `*123#`
2. **Expected Flow**:
   ```
   Welcome to Bus Ticketing
   1. View Bus Schedules
   2. Book Ticket
   3. Check Booking
   4. Cancel Booking
   ```

### 4.2 Test Operator USSD
1. **Dial operator code**: `*456#`
2. **Enter PIN**: `1234` (Uganda Express)
3. **Expected Menu**:
   ```
   Operator Menu
   1. Today's buses
   2. Verify booking
   3. Mark boarded
   4. Seats left
   5. Add walk-in (cash)
   0. Logout
   ```

---

## 🔍 **Step 5: Monitor and Debug**

### 5.1 Africa's Talking Dashboard
1. **Go to USSD Dashboard**
2. **View Application Logs**
3. **Monitor Session Data**
4. **Check Callback Responses**

### 5.2 Railway Logs
1. **Go to Railway Dashboard**
2. **Click on your project**
3. **View "Deployments" tab**
4. **Click "View Logs"**

### 5.3 Test Commands
```bash
# Test customer endpoint
curl -X POST https://bus-ticketing-production.up.railway.app/ussd \
  -d "sessionId=test&serviceCode=*123#&phoneNumber=1234567890&text="

# Test operator endpoint
curl -X POST https://bus-ticketing-production.up.railway.app/ussd-ops \
  -d "sessionId=op&text=1234"
```

---

## 🎯 **Step 6: Go Live Checklist**

### 6.1 Pre-Launch Testing
- [ ] ✅ Customer USSD flow tested
- [ ] ✅ Operator USSD flow tested
- [ ] ✅ Booking creation works
- [ ] ✅ Payment processing works
- [ ] ✅ Booking verification works
- [ ] ✅ Operator login works
- [ ] ✅ All error scenarios tested

### 6.2 Production Setup
- [ ] ✅ Africa's Talking account verified
- [ ] ✅ USSD applications created
- [ ] ✅ Callback URLs configured
- [ ] ✅ Railway deployment stable
- [ ] ✅ Database working
- [ ] ✅ Health checks passing

### 6.3 Operator Training
- [ ] ✅ Train Uganda Express operators (PIN: 1234)
- [ ] ✅ Train Central Coaches operators (PIN: 5678)
- [ ] ✅ Train Nile Bus operators (PIN: 9999)
- [ ] ✅ Create operator manual
- [ ] ✅ Set up support procedures

---

## 🚨 **Troubleshooting**

### Common Issues:

#### **1. USSD Not Responding**
- **Check**: Callback URL is correct
- **Check**: Railway deployment is running
- **Check**: Health endpoint responds

#### **2. Session Timeout**
- **Solution**: Increase session timeout in Africa's Talking
- **Solution**: Optimize response times

#### **3. Invalid Response Format**
- **Check**: Response starts with `CON` or `END`
- **Check**: No special characters in response
- **Check**: Response length is under limit

#### **4. Database Errors**
- **Check**: Railway logs for database issues
- **Check**: Database path is correct
- **Check**: SQLite permissions

---

## 📞 **Support Contacts**

### Africa's Talking Support
- **Email**: support@africastalking.com
- **Phone**: +254 20 524 2066
- **Documentation**: [help.africastalking.com](https://help.africastalking.com)

### Railway Support
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: [discord.gg/railway](https://discord.gg/railway)

---

## 🎉 **Success!**

Once configured, your customers can:
1. **Dial `*123#`** to access bus ticketing
2. **View available buses** and schedules
3. **Book tickets** with seat selection
4. **Make payments** via sandbox
5. **Check booking status** anytime
6. **Cancel bookings** if needed

Your operators can:
1. **Dial `*456#`** to access operator menu
2. **Login with their PIN**
3. **View today's buses**
4. **Verify customer bookings**
5. **Mark passengers as boarded**
6. **Add walk-in passengers**

---

**🚀 Your Bus Ticketing USSD System is now live and ready for real customers!**
