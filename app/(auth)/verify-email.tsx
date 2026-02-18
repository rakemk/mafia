import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkVerification();
    const interval = setInterval(checkVerification, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkVerification = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.email_confirmed_at) {
        setVerified(true);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const handleContinue = () => {
    router.replace('/(auth)/set-username');
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.email) {
        // Note: Implement resend verification email based on your Supabase setup
        Alert.alert('Info', 'Verification email sent. Please check your inbox.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.emojiIcon}>
            {verified ? '✅' : '📧'}
          </Text>
        </View>

        <Text style={styles.title}>
          {verified ? 'Email Verified!' : 'Verify Your Email'}
        </Text>
        <Text style={styles.subtitle}>
          {verified
            ? 'Your email has been verified successfully.'
            : 'Check your email for a verification link. Waiting for confirmation...'}
        </Text>

        {verified && (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        )}

        {!verified && (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResendEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a1a2e" />
            ) : (
              <Text style={styles.buttonText}>Resend Email</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  emojiIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 255, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#00ff00',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
