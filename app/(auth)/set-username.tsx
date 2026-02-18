import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { profiles } from '@/src/integrations/supabase/queries';

const AVATARS = [
  { id: 'char1', label: 'Warrior', image: require('@/assets/images/char1.svg') },
  { id: 'char2', label: 'Mage', image: require('@/assets/images/char2.svg') },
  { id: 'char3', label: 'Rogue', image: require('@/assets/images/char3.svg') },
  { id: 'char4', label: 'Knight', image: require('@/assets/images/char4.svg') },
];

export default function SetUsernameScreen() {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [selectedAvatar, setSelectedAvatar] = useState('char1');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  const handleSetUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      Alert.alert('Error', 'Username must be between 3 and 20 characters');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      Alert.alert('Error', 'Please enter a valid age (13-100)');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await profiles.updateProfile(userId, {
        username: username.trim(),
        name: name.trim(),
        age: ageNum,
        gender,
        avatar_character: selectedAvatar,
      });

      if (error) throw error;

      router.replace('/(game)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Profile</Text>
          <Text style={styles.subtitle}>
            Set up your identity for the game
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="👤 Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
            maxLength={20}
          />
        </View>

        <Text style={styles.counter}>
          {username.length}/20 characters
        </Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="📝 Full Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            editable={!loading}
            maxLength={50}
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="🎂 Age"
            placeholderTextColor="#666"
            value={age}
            onChangeText={setAge}
            editable={!loading}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderOptions}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'male' && styles.genderButtonActive,
              ]}
              onPress={() => setGender('male')}
              disabled={loading}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'male' && styles.genderButtonTextActive,
              ]}>
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'female' && styles.genderButtonActive,
              ]}
              onPress={() => setGender('female')}
              disabled={loading}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'female' && styles.genderButtonTextActive,
              ]}>
                Female
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'other' && styles.genderButtonActive,
              ]}
              onPress={() => setGender('other')}
              disabled={loading}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'other' && styles.genderButtonTextActive,
              ]}>
                Other
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'prefer_not_to_say' && styles.genderButtonActive,
              ]}
              onPress={() => setGender('prefer_not_to_say')}
              disabled={loading}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'prefer_not_to_say' && styles.genderButtonTextActive,
              ]}>
                Prefer not to say
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Select Your Avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarCard,
                  selectedAvatar === avatar.id && styles.avatarCardSelected,
                ]}
                onPress={() => setSelectedAvatar(avatar.id)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Image
                  source={avatar.image}
                  style={styles.avatarImage}
                />
                <Text style={styles.avatarLabel}>{avatar.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSetUsername}
          disabled={loading || !username.trim() || !name.trim() || !age}
        >
          {loading ? (
            <ActivityIndicator color="#1a1a2e" />
          ) : (
            <Text style={styles.buttonText}>Create Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  content: {
    width: '100%',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ff00',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 16,
  },
  counter: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#00ff00',
    marginBottom: 12,
    fontWeight: '600',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ff00',
    backgroundColor: '#0f0f1e',
  },
  genderButtonActive: {
    backgroundColor: '#00ff00',
  },
  genderButtonText: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#1a1a2e',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarCard: {
    width: '48%',
    backgroundColor: '#0f0f1e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00ff00',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCardSelected: {
    borderColor: '#ffff00',
    backgroundColor: '#1a2a1e',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
    borderRadius: 8,
  },
  avatarLabel: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#00ff00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
