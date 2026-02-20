# 📱 Phone Authentication Setup Guide

## Overview
Your app now supports Phone/SMS authentication with OTP! Users can login using their mobile number instead of email.

## ✅ What's Been Added

1. **Phone Login Screen** - [`app/(auth)/phone-login.tsx`](app/(auth)/phone-login.tsx)
   - Send OTP to phone number
   - Verify 6-digit OTP
   - Resend OTP functionality
   - 60-second cooldown timer

2. **Auth Functions** - [`src/integrations/supabase/queries.ts`](src/integrations/supabase/queries.ts)
   - `auth.signInWithPhone(phone)` - Send OTP
   - `auth.verifyOtp(phone, token)` - Verify OTP
   - `auth.signUpWithPhone(phone)` - Sign up with phone

3. **Updated Login Screen** - [`app/(auth)/login.tsx`](app/(auth)/login.tsx)
   - New "📱 Login with Phone (OTP)" button

---

## 🚀 Quick Setup (Required)

### Step 1: Enable Phone Authentication in Supabase

1. **Go to your Supabase Dashboard:**
   - https://supabase.com/dashboard/project/ohjweanlhqjdtfxgehrs

2. **Navigate to Authentication → Providers:**
   - Click `Authentication` in the sidebar
   - Go to `Providers` tab
   - Find `Phone` in the list

3. **Enable Phone Provider:**
   - Toggle ON the Phone provider
   - Click `Save`

### Step 2: Configure SMS Provider

Supabase supports multiple SMS providers. Choose one:

#### Option A: Twilio (Recommended)
1. **Sign up at:** https://www.twilio.com
2. **Get credentials:**
   - Account SID
   - Auth Token
   - Twilio Phone Number

3. **Configure in Supabase:**
   - Go to `Authentication` → `Providers` → `Phone`
   - Select `Twilio` as SMS provider
   - Enter:
     - **Account SID**: Your Twilio Account SID
     - **Auth Token**: Your Twilio Auth Token
     - **Sender**: Your Twilio phone number (format: +1234567890)
   - Click `Save`

#### Option B: MessageBird
1. **Sign up at:** https://www.messagebird.com
2. **Get API Key**
3. **Configure in Supabase:**
   - Select `MessageBird` as SMS provider
   - Enter API Key and Sender name
   - Click `Save`

#### Option C: Vonage (Nexmo)
1. **Sign up at:** https://www.vonage.com
2. **Get API credentials**
3. **Configure in Supabase:**
   - Select `Vonage` as SMS provider
   - Enter API Key and Secret
   - Click `Save`

---

## 🧪 Testing Phone Auth

### Test Numbers (Development)

For testing without sending real SMS, Supabase supports test phone numbers:

1. **Go to:** `Authentication` → `Settings` → `Phone Auth` → `Test phone numbers`
2. **Add test numbers:**
   ```
   +911234567890 → OTP: 123456
   +919876543210 → OTP: 654321
   ```

3. **These numbers will always work** with the specified OTP, without sending actual SMS.

### Testing Flow

1. **Open your app**
2. **Click "📱 Login with Phone (OTP)"**
3. **Enter phone number:** (Include country code, e.g., +911234567890)
4. **Enter OTP:** Check your SMS or use test OTP
5. **Login successful!**

---

## 📋 Features Included

### OTP Login Screen
- ✅ Phone number input with country code (+91 for India)
- ✅ Automatic formatting
- ✅ Send OTP button
- ✅ 6-digit OTP input
- ✅ Verify & Login
- ✅ Resend OTP (with 60s cooldown)
- ✅ Change phone number
- ✅ Back to email login option

### Security Features
- ✅ Phone number validation
- ✅ OTP expiration (default: 60 seconds)
- ✅ Rate limiting on OTP sends
- ✅ Session management

---

## 🔧 Customization

### Change Country Code
Edit [`phone-login.tsx`](app/(auth)/phone-login.tsx):

```typescript
// Current: India (+91)
if (cleaned.length === 10) {
  return '+91' + cleaned;
}

// Change to US (+1)
if (cleaned.length === 10) {
  return '+1' + cleaned;
}
```

### Adjust OTP Cooldown
```typescript
// Current: 60 seconds
const startCountdown = () => {
  setCountdown(60); // Change this value
  // ...
};
```

### Change OTP Length
```typescript
// Current: 6 digits
<TextInput
  maxLength={6} // Change to 4, 6, or 8
  // ...
/>
```

---

## 🐛 Troubleshooting

### Error: "Phone authentication needs to be configured"
- ✅ **Solution:** Complete Step 1 & 2 above (Enable Phone provider + Configure SMS provider)

### OTP not received
- Check SMS provider configuration
- Verify phone number is correct (include country code)
- Check SMS provider balance/credits
- Use test phone numbers for development

### Invalid OTP error
- OTP expires after 60 seconds (default)
- Try resending OTP
- Verify you're entering the correct code

### Rate limiting errors
- Too many OTP requests
- Wait 60 seconds before trying again
- Check Supabase rate limits in dashboard

---

## 💰 Cost Considerations

### SMS Provider Costs (Approximate)
- **Twilio:** ~$0.0075 per SMS (US)
- **MessageBird:** ~$0.0065 per SMS (US)
- **Vonage:** ~$0.0070 per SMS (US)

### Free Tier Options
Most providers offer free trial credits:
- Twilio: $15 free credit
- MessageBird: 20 free SMS
- Vonage: €2 free credit

### Test Numbers = FREE
Use test numbers during development to avoid SMS costs!

---

## 🔐 Security Best Practices

1. **Rate Limiting:** Implemented (60s cooldown)
2. **OTP Expiration:** Configured in Supabase
3. **Session Management:** Handled by Supabase Auth
4. **Phone Verification:** Always verify phone ownership via OTP
5. **Test in Production:** Use real phone numbers only in production

---

## 📱 User Experience Flow

```
1. User clicks "📱 Login with Phone (OTP)"
   ↓
2. Enters phone number → Clicks "Send OTP"
   ↓
3. Receives SMS with 6-digit code
   ↓
4. Enters OTP → Clicks "Verify & Login"
   ↓
5. Redirected to home screen (game lobby)
```

---

## 🎯 Next Steps

1. ✅ Complete Supabase setup (Steps 1-2)
2. ✅ Add test phone numbers for development
3. ✅ Test the flow in your app
4. ✅ Configure rate limits in Supabase dashboard
5. ✅ Monitor SMS usage and costs

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs: `Authentication` → `Logs`
2. Verify SMS provider configuration
3. Test with test phone numbers first
4. Check SMS provider dashboard for delivery status

---

**You're all set! 🎉 Users can now login with their phone numbers using OTP!**
