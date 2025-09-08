# 📊 Monitoring & Alerts Setup Guide

## 🎯 Complete Monitoring for Bus Ticketing System

### 🌐 **Your Live System:**
- **URL**: `https://bus-ticketing-production.up.railway.app`
- **Health Check**: `https://bus-ticketing-production.up.railway.app/ok`
- **Database Check**: `https://bus-ticketing-production.up.railway.app/db-ping`

---

## 🚂 **Railway Built-in Monitoring**

### 1.1 Real-time Logs
1. **Go to Railway Dashboard**
2. **Click your project**: `bus-ticketing-production`
3. **Click "Deployments" tab**
4. **Click "View Logs"** for real-time monitoring

### 1.2 Metrics Dashboard
1. **Go to "Metrics" tab**
2. **Monitor**:
   - CPU usage
   - Memory usage
   - Network traffic
   - Response times

### 1.3 Health Checks
Railway automatically monitors:
- **Health endpoint**: `/ok`
- **Database endpoint**: `/db-ping`
- **Automatic restarts** on failure

---

## 🔔 **External Monitoring Setup**

### 2.1 UptimeRobot (Free)

#### **Setup UptimeRobot:**
1. **Sign up** at [uptimerobot.com](https://uptimerobot.com)
2. **Add Monitor**:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Bus Ticketing Health`
   - **URL**: `https://bus-ticketing-production.up.railway.app/ok`
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Add your email/SMS

3. **Add Database Monitor**:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Bus Ticketing Database`
   - **URL**: `https://bus-ticketing-production.up.railway.app/db-ping`
   - **Monitoring Interval**: 5 minutes

#### **Alert Settings:**
- **Email alerts** for downtime
- **SMS alerts** for critical issues
- **Webhook notifications** (optional)

### 2.2 Pingdom (Advanced)

#### **Setup Pingdom:**
1. **Sign up** at [pingdom.com](https://pingdom.com)
2. **Create Check**:
   - **Check Type**: HTTP
   - **Hostname**: `bus-ticketing-production.up.railway.app`
   - **Path**: `/ok`
   - **Check Interval**: 1 minute
   - **Alert Threshold**: 2 consecutive failures

---

## 📱 **USSD-Specific Monitoring**

### 3.1 USSD Endpoint Monitoring

#### **Customer USSD Monitor:**
```bash
# Test customer endpoint
curl -X POST https://bus-ticketing-production.up.railway.app/ussd \
  -d "sessionId=monitor&serviceCode=*123#&phoneNumber=0000000000&text="
```

**Expected Response**: `CON Welcome to Bus Ticketing...`

#### **Operator USSD Monitor:**
```bash
# Test operator endpoint
curl -X POST https://bus-ticketing-production.up.railway.app/ussd-ops \
  -d "sessionId=monitor&text=1234"
```

**Expected Response**: `CON Operator Menu...`

### 3.2 Automated USSD Testing

#### **Create Monitoring Script:**
```bash
#!/bin/bash
# ussd-monitor.sh

# Test customer USSD
CUSTOMER_RESPONSE=$(curl -s -X POST https://bus-ticketing-production.up.railway.app/ussd \
  -d "sessionId=monitor&serviceCode=*123#&phoneNumber=0000000000&text=")

if [[ $CUSTOMER_RESPONSE == *"Welcome to Bus Ticketing"* ]]; then
    echo "✅ Customer USSD: OK"
else
    echo "❌ Customer USSD: FAILED"
    # Send alert
fi

# Test operator USSD
OPERATOR_RESPONSE=$(curl -s -X POST https://bus-ticketing-production.up.railway.app/ussd-ops \
  -d "sessionId=monitor&text=1234")

if [[ $OPERATOR_RESPONSE == *"Operator Menu"* ]]; then
    echo "✅ Operator USSD: OK"
else
    echo "❌ Operator USSD: FAILED"
    # Send alert
fi
```

---

## 📊 **Performance Monitoring**

### 4.1 Response Time Monitoring

#### **Key Metrics to Track:**
- **Health check response time**: Should be < 1 second
- **Database check response time**: Should be < 2 seconds
- **USSD response time**: Should be < 3 seconds
- **Booking creation time**: Should be < 5 seconds

#### **Monitoring Commands:**
```bash
# Test response times
time curl -s https://bus-ticketing-production.up.railway.app/ok
time curl -s https://bus-ticketing-production.up.railway.app/db-ping
```

### 4.2 Database Performance

#### **Monitor Database Health:**
```bash
# Test database connectivity
curl -s https://bus-ticketing-production.up.railway.app/db-ping | jq '.ok'
```

**Expected Response**: `1` (success)

---

## 🚨 **Alert Configuration**

### 5.1 Critical Alerts

#### **Immediate Alerts (SMS + Email):**
- **System down** (health check fails)
- **Database unavailable** (db-ping fails)
- **USSD endpoints not responding**
- **High error rate** (> 5% errors)

#### **Warning Alerts (Email only):**
- **High response time** (> 5 seconds)
- **High CPU usage** (> 80%)
- **High memory usage** (> 80%)
- **Frequent restarts**

### 5.2 Alert Channels

#### **Email Alerts:**
- **Primary**: Your business email
- **Secondary**: Technical team email
- **Escalation**: Management email

#### **SMS Alerts:**
- **Critical issues only**
- **24/7 on-call number**
- **Rate limited** (max 1 SMS per hour)

#### **Slack/Discord Alerts:**
- **Team notifications**
- **Real-time updates**
- **Integration with Railway webhooks**

---

## 📈 **Analytics & Reporting**

### 6.1 Usage Analytics

#### **Track Key Metrics:**
- **Daily active users**
- **Booking success rate**
- **Operator login frequency**
- **Error rates by endpoint**
- **Peak usage times**

#### **Railway Analytics:**
1. **Go to Railway Dashboard**
2. **Click "Metrics" tab**
3. **View**:
   - Request volume
   - Response times
   - Error rates
   - Resource usage

### 6.2 Business Metrics

#### **Daily Reports:**
- **Total bookings created**
- **Total revenue** (if payment integration)
- **Operator activity**
- **System uptime**
- **Error summary**

#### **Weekly Reports:**
- **Usage trends**
- **Performance summary**
- **Capacity planning**
- **Cost analysis**

---

## 🔧 **Maintenance & Updates**

### 7.1 Regular Maintenance

#### **Daily Tasks:**
- **Check system health**
- **Review error logs**
- **Monitor performance metrics**
- **Verify USSD functionality**

#### **Weekly Tasks:**
- **Review usage analytics**
- **Check database performance**
- **Update monitoring thresholds**
- **Review alert effectiveness**

#### **Monthly Tasks:**
- **Security updates**
- **Performance optimization**
- **Capacity planning**
- **Backup verification**

### 7.2 Update Procedures

#### **Safe Deployment:**
1. **Test in staging** (if available)
2. **Deploy during low-traffic hours**
3. **Monitor closely** after deployment
4. **Have rollback plan** ready

#### **Emergency Procedures:**
1. **Immediate response** to critical alerts
2. **Escalation procedures**
3. **Communication plan**
4. **Recovery procedures**

---

## 🎯 **Monitoring Checklist**

### 8.1 Setup Checklist
- [ ] ✅ Railway monitoring enabled
- [ ] ✅ UptimeRobot configured
- [ ] ✅ USSD endpoints monitored
- [ ] ✅ Database health monitored
- [ ] ✅ Alert channels configured
- [ ] ✅ Response time monitoring
- [ ] ✅ Error rate tracking
- [ ] ✅ Performance baselines set

### 8.2 Testing Checklist
- [ ] ✅ Health check alerts work
- [ ] ✅ Database alerts work
- [ ] ✅ USSD endpoint alerts work
- [ ] ✅ Email notifications work
- [ ] ✅ SMS notifications work
- [ ] ✅ Alert escalation works
- [ ] ✅ Recovery procedures tested

---

## 🚀 **Advanced Monitoring (Optional)**

### 9.1 Application Performance Monitoring (APM)

#### **New Relic (Free Tier):**
1. **Sign up** at [newrelic.com](https://newrelic.com)
2. **Install Node.js agent**
3. **Monitor**:
   - Application performance
   - Database queries
   - Error tracking
   - User experience

#### **DataDog (Paid):**
1. **Sign up** at [datadoghq.com](https://datadoghq.com)
2. **Configure monitoring**
3. **Advanced analytics**
4. **Custom dashboards**

### 9.2 Log Aggregation

#### **LogDNA (Free Tier):**
1. **Sign up** at [logdna.com](https://logdna.com)
2. **Configure log collection**
3. **Search and analyze logs**
4. **Set up log-based alerts**

---

## 🎉 **Monitoring Success!**

With proper monitoring in place, you'll have:
- ✅ **24/7 system visibility**
- ✅ **Proactive issue detection**
- ✅ **Fast incident response**
- ✅ **Performance optimization**
- ✅ **Business insights**
- ✅ **Customer satisfaction**

---

**📊 Your Bus Ticketing System is now fully monitored and ready for production!**

