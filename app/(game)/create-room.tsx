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
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { rooms } from '@/src/integrations/supabase/queries';

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CreateRoomScreen() {
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('20');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    const maxPlayersNum = parseInt(maxPlayers) || 8;
    if (maxPlayersNum < 3 || maxPlayersNum > 20) {
      Alert.alert('Error', 'Max players must be between 3 and 20');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user.id) throw new Error('User not authenticated');

      const code = generateRoomCode();
      const { data, error } = await rooms.createRoom(
        session.user.id,
        roomName.trim(),
        code,
        maxPlayersNum
      );

      if (error) throw error;

      if (data?.id) {
        router.replace(`/(game)/${data.id}`);
      }
    } catch (error: any) {
      console.error('Create Room Error:', error);
      let message = error.message || 'Failed to create room';
      
      // Better error message for missing database tables
      if (message.includes('game_rooms') || message.includes('schema cache') || message.includes('PGRST205')) {
        Alert.alert(
          'Database Setup Required',
          'The game database is not set up yet.\n\n' +
          '✅ Fix: Run the FULL_SETUP.sql file in your Supabase SQL Editor.\n\n' +
          'See DATABASE_FIX_NOW.md for step-by-step instructions.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Game Room</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.label}>Room Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter room name"
              placeholderTextColor="#666"
              value={roomName}
              onChangeText={setRoomName}
              editable={!loading}
              maxLength={30}
            />
            <Text style={styles.counter}>
              {roomName.length}/30 characters
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Max Players</Text>
            <View style={styles.playerOptionsContainer}>
              <View style={styles.playerOptionsRow}>
                {['6', '8', '10', '12', '15'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.playerButton,
                      maxPlayers === num && styles.playerButtonActive,
                    ]}
                    onPress={() => setMaxPlayers(num)}
                  >
                    <Text
                      style={[
                        styles.playerButtonText,
                        maxPlayers === num &&
                        styles.playerButtonTextActive,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.playerButtonLarge,
                  maxPlayers === '20' && styles.playerButtonActive,
                ]}
                onPress={() => setMaxPlayers('20')}
              >
                <Text
                  style={[
                    styles.playerButtonTextLarge,
                    maxPlayers === '20' && styles.playerButtonTextActive,
                  ]}
                >
                  20
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Game Info</Text>
            <Text style={styles.infoText}>
              • Players will join with unique codes
            </Text>
            <Text style={styles.infoText}>
              • Game starts when players are ready
            </Text>
            <Text style={styles.infoText}>
              • Chat available during and after game
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateRoom}
          disabled={loading || !roomName.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#1a1a2e" />
          ) : (
            <Text style={styles.buttonText}>➕ Create Room</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#00ff00',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff00',
    textShadowColor: 'rgba(0, 255, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginTop: 24,
  },
  label: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  input: {
    backgroundColor: '#0f0f1e',
    borderWidth: 1,
    borderColor: '#00ff00',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  counter: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    textAlign: 'right',
  },
  playerOptionsContainer: {
    gap: 12,
  },
  playerOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  playerButton: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
  },
  playerButtonLarge: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    marginTop: 4,
  },
  playerButtonActive: {
    backgroundColor: '#1a2a1e',
    borderColor: '#00ff00',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  playerButtonText: {
    color: '#888',
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerButtonTextLarge: {
    color: '#888',
    fontSize: 32,
    fontWeight: 'bold',
  },
  playerButtonTextActive: {
    color: '#00ff00',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#0f0f1e',
    borderWidth: 1,
    borderColor: '#00ff00',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  infoTitle: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 255, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  infoText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#00ff00',
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
    shadowOpacity: 0,
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
