import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { rooms, auth, profiles, players } from '@/src/integrations/supabase/queries';

export default function HomeScreen() {
  const [gameRooms, setGameRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user.id) {
        const { data: profileData } = await profiles.getProfile(session.user.id);
        setUserProfile(profileData);
      }
      
      // Diagnostic check for database connection and table existence
      try {
        const { data: diagData, error: diagError } = await supabase.rpc('check_game_setup');
        // We log it but only alert if it's a hard "error" status returned by our specific RPC
        if (diagData && diagData.status === 'error') {
          Alert.alert('Database Connection Error', 
            'The app is connected to Supabase, but the "game_rooms" table was not found.\n\nPlease ensuring migration "20260105_ensure_game_rooms_exists.sql" was run.');
        }
      } catch (e) {
        // Ignore RPC errors if function doesn't exist yet
      }

      await fetchRooms();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await rooms.getRooms();
      if (error) throw error;
      
      // Fetch player counts for each room
      const roomsWithCounts = await Promise.all(
        (data || []).map(async (room) => {
          const { data: playerData } = await players.getPlayers(room.id);
          return {
            ...room,
            current_players: playerData?.length || 0,
          };
        })
      );
      
      setGameRooms(roomsWithCounts || []);
    } catch (error: any) {
      console.error('Failed to load rooms:', error);
      if (error.message && error.message.includes('game_rooms')) {
        Alert.alert('System Error', 'Game tables are missing. Please run database setup.');
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  };

  const handleJoinRoom = (roomId: string) => {
    router.push(`/(game)/${roomId}`);
  };

  const handleJoinByCode = async () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    setJoiningCode(true);
    try {
      const { data, error } = await rooms.getRoomByCode(roomCode.trim());
      
      if (error || !data) {
        Alert.alert('Error', 'Room not found or no longer available');
        return;
      }

      setShowJoinModal(false);
      setRoomCode('');
      router.push(`/(game)/${data.id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setJoiningCode(false);
    }
  };

  const handleCreateRoom = () => {
    router.push('/(game)/create-room');
  };

  const handleEditAvatar = () => {
    setShowProfileModal(false);
    router.push('/(auth)/set-username'); 
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            const { error } = await auth.signOut();
            if (error) throw error;
            router.replace('/(auth)/login');
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const getAvatarSource = (avatarId: string | undefined) => {
    const avatarMap: { [key: string]: any } = {
      char1: require('@/assets/images/char1.svg'),
      char2: require('@/assets/images/char2.svg'),
      char3: require('@/assets/images/char3.svg'),
      char4: require('@/assets/images/char4.svg'),
    };
    return avatarMap[avatarId || 'char1'] || avatarMap.char1;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>🎭 Mafia Nights</Text>
        <ActivityIndicator size="large" color="#00ff00" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        {/* Left: Profile Information as requested */}
        <TouchableOpacity 
          style={styles.profileSection}
          onPress={() => setShowProfileModal(true)}
        >
          {userProfile?.avatar_character && (
            <Image 
              source={getAvatarSource(userProfile.avatar_character)}
              style={styles.profileAvatarSmall}
            />
          )}
          <View style={styles.profileInfoSmall}>
            <Text style={styles.profileNameSmall} numberOfLines={1}>
              {userProfile?.name || 'Player'}
            </Text>
            <View style={styles.profileDetailsSmall}>
               <Text style={{color:'#aaa', fontSize: 10}}>
                 {userProfile?.age ? `${userProfile.age}y` : ''} 
                 {userProfile?.gender ? ` • ${userProfile.gender.charAt(0).toUpperCase()}` : ''}
               </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right: Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>🎭 Mafia</Text>
          <Text style={styles.subtitle}>Nights</Text>
        </View>
      </View>

      {/* Rooms List */}
      <FlatList
        data={gameRooms}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rooms available</Text>
            <Text style={styles.emptySubtext}>Create one or join by code</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.roomItem}
            onPress={() => handleJoinRoom(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.roomContent}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomName}>{item.name}</Text>
                <View style={styles.roomBadge}>
                  <Text style={styles.roomCode}>{item.code}</Text>
                </View>
              </View>
              <Text style={styles.roomStatus}>
                {item.status === 'waiting' ? '⏳ Waiting for players' : '🎮 Game in progress'}
              </Text>
              <View style={styles.roomStats}>
                <Text style={styles.roomPlayers}>
                  👥 {item.current_players || 0}/{item.max_players}
                </Text>
              </View>
            </View>
            <Text style={styles.joinArrow}>→</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#00ff00']}
            progressBackgroundColor="#1a1a2e"
          />
        }
        scrollEnabled={gameRooms.length > 3}
      />

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.createButton]}
          onPress={handleCreateRoom}
        >
          <Text style={styles.actionButtonText}>🎮 Create Room</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.joinButton]}
          onPress={() => setShowJoinModal(true)}
        >
          <Text style={styles.actionButtonText}>🔑 Join by Code</Text>
        </TouchableOpacity>
      </View>

      {/* Join by Code Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Room by Code</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter room code (e.g., ABC123)"
              placeholderTextColor="#666"
              value={roomCode}
              onChangeText={setRoomCode}
              autoCapitalize="characters"
              maxLength={10}
              editable={!joiningCode}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowJoinModal(false);
                  setRoomCode('');
                }}
                disabled={joiningCode}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalJoinButton]}
                onPress={handleJoinByCode}
                disabled={joiningCode || !roomCode.trim()}
              >
                {joiningCode ? (
                  <ActivityIndicator color="#1a1a2e" />
                ) : (
                  <Text style={styles.modalButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
      >
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContent}>
            <TouchableOpacity 
              style={styles.profileCloseButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.profileCloseText}>✕</Text>
            </TouchableOpacity>

            {userProfile?.avatar_character && (
              <Image 
                source={getAvatarSource(userProfile.avatar_character)}
                style={styles.profileLargeAvatar}
              />
            )}

            <Text style={styles.profileModalName}>{userProfile?.name}</Text>
            <Text style={styles.profileModalUsername}>@{userProfile?.username}</Text>

            <View style={styles.profileDetails}>
              <View style={styles.profileDetail}>
                <Text style={styles.profileDetailLabel}>Age</Text>
                <Text style={styles.profileDetailValue}>{userProfile?.age}</Text>
              </View>
              <View style={styles.profileDetail}>
                <Text style={styles.profileDetailLabel}>Gender</Text>
                <Text style={styles.profileDetailValue}>
                  {userProfile?.gender === 'prefer_not_to_say' ? 'N/A' : userProfile?.gender}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={handleEditAvatar}
            >
              <Text style={styles.editProfileText}>✎ Change Avatar & Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signOutButtonModal}
              onPress={() => {
                setShowProfileModal(false);
                handleSignOut();
              }}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff00',
    textShadowColor: 'rgba(0, 255, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  /* Top Bar Styles */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#00ff00',
    backgroundColor: '#0f0f1e', // Added background for better contrast
  },
  /* Profile Section (Left Side) */
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ff00',
    maxWidth: '65%', // Limit width so title still fits
  },
  profileAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  profileInfoSmall: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  profileNameSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  profileDetailsSmall: {
    fontSize: 10,
    color: '#aaa',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  /* Title Section (Right Side) */
  titleSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20, // Slightly smaller to fit
    fontWeight: 'bold',
    color: '#00ff00',
    textShadowColor: 'rgba(0, 255, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },

  /* List Styles */
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
  },
  roomItem: {
    flexDirection: 'row',
    backgroundColor: '#0f0f1e',
    borderWidth: 1,
    borderColor: '#00ff00',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomContent: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  roomBadge: {
    backgroundColor: '#1a2a1e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roomCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  roomStatus: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 6,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomPlayers: {
    fontSize: 12,
    color: '#00ff00',
  },
  joinArrow: {
    fontSize: 20,
    color: '#00ff00',
    marginLeft: 12,
  },

  /* Bottom Actions */
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: '#00ff00',
  },
  joinButton: {
    backgroundColor: '#0f0f1e',
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#0f0f1e',
    borderWidth: 1,
    borderColor: '#00ff00',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#0f0f1e',
    borderWidth: 1,
    borderColor: '#666',
  },
  modalJoinButton: {
    backgroundColor: '#00ff00',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* Profile Modal Styles */
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center', // Centered for better focus
    padding: 20,
  },
  profileModalContent: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  profileCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f0f1e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileCloseText: {
    fontSize: 18,
    color: '#666',
  },
  profileLargeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  profileModalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff00',
    textAlign: 'center',
    marginBottom: 4,
  },
  profileModalUsername: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  profileDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  profileDetail: {
    flex: 1,
    backgroundColor: '#0f0f1e',
    borderWidth: 1,
    borderColor: '#00ff00',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  profileDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff00',
    textTransform: 'capitalize',
  },
  editProfileButton: {
    backgroundColor: '#0f0f1e',
    borderWidth: 1,
    borderColor: '#00ff00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  signOutButtonModal: {
    backgroundColor: '#cc0000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});
