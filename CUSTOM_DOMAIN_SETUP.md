# 🌐 Custom Domain Setup Guide

## 🎯 Professional Domain for Bus Ticketing System

### 🚀 **Current Railway URL:**
`https://bus-ticketing-production.up.railway.app`

### 🎯 **Target Custom Domain:**
`https://bus-ticketing.yourcompany.com` (or your preferred domain)

---

## 📋 **Step 1: Choose Your Domain**

### 1.1 Domain Options

#### **Professional Options:**
- `bus-ticketing.yourcompany.com`
- `tickets.yourcompany.com`
- `book.yourcompany.com`
- `ussd.yourcompany.com`

#### **Branded Options:**
- `juba-bus.com`
- `southsudan-bus.com`
- `unity-transport.com`
- `bus-ssd.com`

### 1.2 Domain Registration

#### **Popular Domain Registrars:**
- **Namecheap**: [namecheap.com](https://namecheap.com)
- **GoDaddy**: [godaddy.com](https://godaddy.com)
- **Google Domains**: [domains.google](https://domains.google)
- **Cloudflare**: [cloudflare.com](https://cloudflare.com)

#### **Domain Requirements:**
- **TLD**: `.com`, `.org`, `.net` (recommended)
- **Length**: Short and memorable
- **Characters**: Letters, numbers, hyphens only
- **Availability**: Check domain availability

---

## 🔧 **Step 2: Configure Railway Custom Domain**

### 2.1 Add Domain in Railway

1. **Go to Railway Dashboard**
2. **Click your project**: `bus-ticketing-production`
3. **Go to "Settings" tab**
4. **Click "Domains" section**
5. **Click "Add Domain"**

### 2.2 Domain Configuration

#### **Enter Domain Details:**
- **Domain**: `yourdomain.com`
- **Subdomain**: `bus-ticketing` (optional)
- **Full Domain**: `bus-ticketing.yourdomain.com`

#### **Railway will provide:**
- **CNAME record** to add to your DNS
- **SSL certificate** (automatically provisioned)
- **Domain verification** instructions

---

## 🌐 **Step 3: Configure DNS Records**

### 3.1 DNS Configuration

#### **Add CNAME Record:**
```
Type: CNAME
Name: bus-ticketing (or @ for root domain)
Value: bus-ticketing-production.up.railway.app
TTL: 300 (5 minutes)
```

#### **Alternative A Record:**
```
Type: A
Name: bus-ticketing
Value: [Railway IP Address]
TTL: 300
```

### 3.2 DNS Provider Setup

#### **Cloudflare (Recommended):**
1. **Add domain** to Cloudflare
2. **Update nameservers** at domain registrar
3. **Add CNAME record**:
   - **Name**: `bus-ticketing`
   - **Target**: `bus-ticketing-production.up.railway.app`
   - **Proxy status**: Proxied (orange cloud)

#### **Other DNS Providers:**
1. **Go to DNS management**
2. **Add CNAME record**
3. **Point to Railway domain**
4. **Set TTL to 300 seconds**

---

## 🔒 **Step 4: SSL Certificate Setup**

### 4.1 Automatic SSL

#### **Railway SSL:**
- **Automatic provisioning** via Let's Encrypt
- **Auto-renewal** every 90 days
- **HTTPS redirect** enabled
- **HSTS headers** included

#### **Verification:**
```bash
# Test SSL certificate
curl -I https://bus-ticketing.yourdomain.com/ok
```

**Expected Response**: `HTTP/2 200` with valid SSL

### 4.2 Custom SSL (Optional)

#### **Cloudflare SSL:**
1. **Enable SSL/TLS** in Cloudflare
2. **Set encryption mode** to "Full (strict)"
3. **Enable HSTS**
4. **Enable Always Use HTTPS**

---

## 🧪 **Step 5: Test Your Custom Domain**

### 5.1 Basic Testing

#### **Health Check:**
```bash
curl https://bus-ticketing.yourdomain.com/ok
```

**Expected Response**: `OK`

#### **Database Check:**
```bash
curl https://bus-ticketing.yourdomain.com/db-ping
```

**Expected Response**: `{"ok":1}`

### 5.2 USSD Testing

#### **Customer USSD:**
```bash
curl -X POST https://bus-ticketing.yourdomain.com/ussd \
  -d "sessionId=test&serviceCode=*123#&phoneNumber=1234567890&text="
```

#### **Operator USSD:**
```bash
curl -X POST https://bus-ticketing.yourdomain.com/ussd-ops \
  -d "sessionId=op&text=1234"
```

---

## 🔄 **Step 6: Update Africa's Talking Configuration**

### 6.1 Update Callback URLs

#### **Customer USSD:**
- **Old URL**: `https://bus-ticketing-production.up.railway.app/ussd`
- **New URL**: `https://bus-ticketing.yourdomain.com/ussd`

#### **Operator USSD:**
- **Old URL**: `https://bus-ticketing-production.up.railway.app/ussd-ops`
- **New URL**: `https://bus-ticketing.yourdomain.com/ussd-ops`

### 6.2 Africa's Talking Dashboard

1. **Go to USSD applications**
2. **Edit each application**
3. **Update callback URLs**
4. **Save changes**
5. **Test with new URLs**

---

## 📊 **Step 7: Performance Optimization**

### 7.1 CDN Configuration

#### **Cloudflare CDN:**
1. **Enable Cloudflare** for your domain
2. **Configure caching rules**:
   - **Static assets**: Cache for 1 year
   - **API endpoints**: Cache for 5 minutes
   - **Health checks**: No cache

#### **Caching Rules:**
```
# Health check - no cache
bus-ticketing.yourdomain.com/ok -> No Cache

# USSD endpoints - no cache
bus-ticketing.yourdomain.com/ussd* -> No Cache
bus-ticketing.yourdomain.com/ussd-ops* -> No Cache

# Static assets - long cache
bus-ticketing.yourdomain.com/static/* -> Cache 1 year
```

### 7.2 Performance Monitoring

#### **Test Performance:**
```bash
# Test response time
time curl -s https://bus-ticketing.yourdomain.com/ok

# Test from different locations
curl -s https://bus-ticketing.yourdomain.com/ok \
  -H "CF-IPCountry: US"
```

---

## 🔧 **Step 8: Advanced Configuration**

### 8.1 Subdomain Setup

#### **Multiple Subdomains:**
- **Customer**: `bus-ticketing.yourdomain.com`
- **Operator**: `ops.yourdomain.com`
- **Admin**: `admin.yourdomain.com`
- **API**: `api.yourdomain.com`

#### **DNS Configuration:**
```
Type: CNAME
Name: ops
Value: bus-ticketing-production.up.railway.app

Type: CNAME
Name: admin
Value: bus-ticketing-production.up.railway.app

Type: CNAME
Name: api
Value: bus-ticketing-production.up.railway.app
```

### 8.2 Load Balancing

#### **Multiple Railway Deployments:**
1. **Create multiple Railway projects**
2. **Deploy same code** to each
3. **Use DNS round-robin**
4. **Configure health checks**

---

## 🚨 **Troubleshooting**

### Common Issues:

#### **1. Domain Not Resolving**
- **Check**: DNS propagation (can take 24-48 hours)
- **Check**: CNAME record is correct
- **Check**: TTL is set to 300 seconds

#### **2. SSL Certificate Issues**
- **Check**: Domain is verified in Railway
- **Check**: DNS is pointing to Railway
- **Check**: No conflicting SSL certificates

#### **3. USSD Not Working**
- **Check**: Africa's Talking URLs are updated
- **Check**: Custom domain is working
- **Check**: Railway deployment is running

#### **4. Performance Issues**
- **Check**: CDN configuration
- **Check**: Caching rules
- **Check**: Railway resource limits

---

## 📋 **Domain Setup Checklist**

### 9.1 Pre-Setup
- [ ] ✅ Domain registered
- [ ] ✅ DNS provider chosen
- [ ] ✅ Railway project ready
- [ ] ✅ SSL certificate plan

### 9.2 Setup Process
- [ ] ✅ Domain added to Railway
- [ ] ✅ DNS records configured
- [ ] ✅ SSL certificate provisioned
- [ ] ✅ Domain verified

### 9.3 Testing
- [ ] ✅ Health check works
- [ ] ✅ Database check works
- [ ] ✅ USSD endpoints work
- [ ] ✅ SSL certificate valid

### 9.4 Go Live
- [ ] ✅ Africa's Talking updated
- [ ] ✅ Monitoring updated
- [ ] ✅ Documentation updated
- [ ] ✅ Team notified

---

## 🎯 **Benefits of Custom Domain**

### 9.1 Professional Appearance
- **Branded URLs** for your business
- **Trust and credibility** with customers
- **Easy to remember** domain names
- **Professional email addresses**

### 9.2 SEO Benefits
- **Better search rankings**
- **Brand recognition**
- **Social media sharing**
- **Marketing campaigns**

### 9.3 Technical Benefits
- **CDN integration**
- **Custom SSL certificates**
- **Advanced DNS features**
- **Load balancing options**

---

## 🚀 **Go Live with Custom Domain**

### 10.1 Launch Plan
1. **Test thoroughly** with custom domain
2. **Update all configurations**
3. **Notify stakeholders**
4. **Monitor closely** after launch
5. **Have rollback plan** ready

### 10.2 Communication
- **Internal team** notification
- **Customer communication**
- **Operator training**
- **Support team briefing**

---

## 🎉 **Custom Domain Success!**

With your custom domain configured:
- ✅ **Professional appearance**
- ✅ **Branded URLs**
- ✅ **SSL security**
- ✅ **CDN performance**
- ✅ **Easy to remember**
- ✅ **Marketing ready**

---

**🌐 Your Bus Ticketing System now has a professional custom domain!**

