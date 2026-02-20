import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/src/integrations/supabase/queries';

export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.startsWith('91')) {
      return '+' + cleaned;
    } else if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    return '+' + cleaned;
  };

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    if (formattedPhone.length < 12) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await auth.signInWithPhone(formattedPhone);
      
      if (error) {
        throw error;
      }

      setOtpSent(true);
      startCountdown();
      Alert.alert(
        'OTP Sent',
        `A 6-digit code has been sent to ${formattedPhone}\n\nPlease check your SMS.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Send OTP Error:', error);
      
      // Check if it's a configuration error
      if (
        error.message?.includes('SMS') || 
        error.message?.includes('phone') || 
        error.message?.includes('Unsupported phone provider') ||
        error.name === 'AuthApiError'
      ) {
        Alert.alert(
          '📱 Phone Login Not Configured',
          'Phone authentication needs to be set up in Supabase Dashboard:\n\n' +
          '1. Go to: supabase.com/dashboard\n' +
          '2. Select your project\n' +
          '3. Authentication → Providers\n' +
          '4. Enable "Phone" provider\n' +
          '5. Configure SMS provider:\n' +
          '   • Twilio (recommended)\n' +
          '   • MessageBird\n' +
          '   • Vonage\n\n' +
          'See PHONE_AUTH_SETUP.md for detailed guide.\n\n' +
          'Use email login for now.',
          [
            { text: 'Use Email Login', onPress: () => router.back() },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    setLoading(true);

    try {
      const { data, error } = await auth.verifyOtp(formattedPhone, otp);
      
      if (error) {
        throw error;
      }

      if (data.session) {
        Alert.alert('Success', 'Login successful!');
        router.replace('/(game)/home');
      }
    } catch (error: any) {
      console.error('Verify OTP Error:', error);
      Alert.alert('Error', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setOtp('');
    await handleSendOtp();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>📱 Phone Login</Text>
        <Text style={styles.subtitle}>
          {otpSent ? 'Enter OTP' : 'Login with Phone Number'}
        </Text>
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            ℹ️ If this is your first time, phone auth must be enabled in Supabase Dashboard first.
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        {!otpSent ? (
          <>
            <Text style={styles.label}>Enter your phone number</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={13}
                editable={!loading}
              />
            </View>
            
            <Text style={styles.helperText}>
              🇮🇳 We'll send a 6-digit OTP to your number
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>
              OTP sent to {formatPhoneNumber(phone)}
            </Text>
            
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="000000"
                placeholderTextColor="#666"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify & Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              {countdown > 0 ? (
                <Text style={styles.resendText}>
                  Resend OTP in {countdown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                setOtpSent(false);
                setOtp('');
                setCountdown(0);
              }}
              style={styles.changeNumberButton}
            >
              <Text style={styles.changeNumberText}>Change Phone Number</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.back()}
        >
          <Text style={styles.linkText}>← Back to Email Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  infoBanner: {
    marginTop: 16,
    backgroundColor: '#1a3a4a',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00ffff',
  },
  infoText: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 18,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 12,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  otpInput: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00ffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: '600',
  },
  changeNumberButton: {
    marginBottom: 24,
  },
  changeNumberText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  linkButton: {
    padding: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#00ffff',
    fontSize: 16,
  },
});
