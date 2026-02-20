# 📱 Quick Phone Auth Setup - Fix "Unsupported phone provider" Error

## ⚠️ Current Issue
Your Supabase project doesn't have phone authentication enabled yet. This is a 5-minute fix!

---

## ✅ Step-by-Step Fix (5 Minutes)

### Step 1: Open Supabase Dashboard
1. Go to: **https://supabase.com/dashboard/project/ohjweanlhqjdtfxgehrs**
2. Or go to https://supabase.com/dashboard and select your project

### Step 2: Enable Phone Provider
1. Click **"Authentication"** in the left sidebar
2. Click **"Providers"** tab at the top
3. Scroll down to find **"Phone"**
4. Click the toggle to turn it **ON** (it should turn green)
5. Click **"Save"** button

✅ This alone will remove the "Unsupported phone provider" error!

### Step 3: Configure SMS Provider (Required for Production)

For **testing only**, you can skip to Step 4. For **production**, choose an SMS provider:

#### Option A: Twilio (Easiest - $15 Free Credit)
1. Sign up at: https://www.twilio.com/try-twilio
2. Go to Console Dashboard → Get Your Trial Number
3. Copy these 3 values:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)
   - **Phone Number** (format: +1234567890)

4. Back in Supabase:
   - Still in Authentication → Providers → Phone
   - In "SMS Provider" dropdown, select **"Twilio"**
   - Paste:
     - Twilio Account SID
     - Twilio Auth Token
     - Twilio Sender (your Twilio phone number)
   - Click **"Save"**

#### Option B: Skip for Now (Use Test Numbers)

### Step 4: Add Test Phone Numbers (FREE Testing)
1. In Supabase: **Authentication → Settings**
2. Scroll to **"Phone Auth"** section
3. Find **"Test phone numbers"**
4. Add test numbers:
   ```
   Phone: +911234567890
   OTP: 123456
   ```
   Click "Add"
   
   ```
   Phone: +919876543210
   OTP: 654321
   ```
   Click "Add"

5. Click **"Save"**

✅ These numbers will work instantly without sending real SMS!

---

## 🧪 Test It Now

After completing Steps 1-4:

1. Open your app
2. Click "📱 Login with Phone (OTP)"
3. Enter: **+911234567890**
4. Click "Send OTP"
5. Enter OTP: **123456**
6. Click "Verify & Login"
7. ✅ You should be logged in!

---

## 🚨 Still Getting Errors?

### Error: "Unsupported phone provider"
- ✅ **Fix:** Complete Step 2 above (Enable Phone provider)
- Make sure you clicked **"Save"** after enabling

### Error: "Invalid phone number"
- ✅ **Fix:** Include country code (e.g., +91 for India, +1 for US)
- Format: +911234567890 (no spaces or dashes)

### Error: "SMS sending failed"
- ✅ **Fix:** Use test phone numbers (Step 4) for now
- Or complete Step 3 to configure Twilio

### No SMS received
- ✅ **Fix:** Use test numbers (+911234567890 → OTP: 123456)
- These work immediately without real SMS!

---

## 💰 SMS Provider Comparison

| Provider | Free Credit | Cost per SMS | Signup Time |
|----------|-------------|--------------|-------------|
| **Twilio** | $15 | $0.0075 | 2 min |
| MessageBird | 20 SMS | $0.0065 | 3 min |
| Vonage | €2 | $0.0070 | 3 min |
| **Test Numbers** | ∞ FREE | $0.00 | 30 sec |

👉 **Use test numbers for development!**

---

## ✅ Checklist

- [ ] Step 1: Opened Supabase Dashboard
- [ ] Step 2: Enabled Phone provider (toggle ON + Save)
- [ ] Step 3: Added SMS provider OR skipped for now
- [ ] Step 4: Added test phone numbers
- [ ] Step 5: Tested login with +911234567890 / OTP: 123456
- [ ] ✅ Phone login working!

---

## 📞 Need Help?

1. **Check Supabase logs:**
   - Dashboard → Authentication → Logs
   - Look for phone auth attempts

2. **Verify configuration:**
   - Authentication → Providers → Phone (should be ON)
   - Authentication → Settings → Phone Auth

3. **Common mistakes:**
   - Forgot to click "Save" after enabling
   - Didn't add test phone numbers
   - Phone number format wrong (needs +country code)

---

**Complete Steps 1-4 and phone login will work! 🎉**
