import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { rooms, players, chat as chatQueries } from '@/src/integrations/supabase/queries';
import { ChatMessage } from '@/src/components/ChatMessage';

// Constants for role colors
const ROLE_COLORS: Record<string, string> = {
  mafia: '#ff0000',
  doctor: '#00ff00',
  police: '#0088ff',
  citizen: '#888888',
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const isTablet = SCREEN_WIDTH >= 768;

interface GameRoom {
  id: string;
  code: string;
  name: string;
  status: string;
  max_players: number;
  host_id: string;
  phase?: 'day' | 'night';
  round_number?: number;
}

interface Player {
  id: string;
  user_id: string;
  username: string;
  role?: string;
  is_alive: boolean;
  avatar_character?: string;
}

interface Message {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

interface Point {
  x: number;
  y: number;
}

export default function GameRoomScreen() {
  const { roomId } = useLocalSearchParams();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const [boardLayout, setBoardLayout] = useState({ width: 0, height: 0 });

  useEffect(() => {
    initialize();

    // Subscribe to changes (simplified polling for now, replace with realtime later if needed)
    const interval = setInterval(fetchUpdate, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const initialize = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (!roomId || typeof roomId !== 'string') {
        throw new Error('Invalid room ID');
      }

      await fetchUpdate();

      // Join room if needed logic (simplified)
      // Check if we need to join... (omitted to focus on UI, assume joined or handled by previous logic)

    } catch (error: any) {
      console.error('Init error:', error);
      // Don't alert on network glitches during poll
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdate = async () => {
    if (!roomId) return;
    try {
      // Fetch room
      const { data: roomData } = await rooms.getRoom(roomId as string);
      if (roomData) setRoom(roomData as any); // Cast for new fields

      // Fetch players
      const { data: playersData } = await players.getPlayers(roomId as string);
      if (playersData) setPlayerList(playersData);

      // Fetch messages
      const { data: messagesData } = await chatQueries.getMessages(roomId as string);
      if (messagesData) setMessages(messagesData);
    } catch (e) {
      console.log("Polling error", e);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !room) return;

    setSending(true);
    try {
      const { error } = await chatQueries.sendMessage(
        room.id,
        user.id,
        user.user_metadata?.username || user.email,
        newMessage.trim()
      );

      if (error) throw error;
      setNewMessage('');
      fetchUpdate(); // Immediate refresh
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSending(false);
    }
  };

  // -- Layout Calculations --
  const getPlayerPosition = (index: number, total: number): Point => {
    if (boardLayout.width === 0) return { x: 0, y: 0 };

    const centerX = boardLayout.width / 2;
    const centerY = boardLayout.height / 2;
    // Radius: define a safe margin
    const radius = Math.min(centerX, centerY) * 0.75;

    // Start from -90deg (top)
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    );
  }

  const phase = room?.phase || 'night'; // Default to night as per screenshot
  const round = room?.round_number || 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Room Info */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.roomName}>{room?.name || 'Game Room'}</Text>
          <Text style={styles.roomCode}>Code: {room?.code}</Text>
        </View>
      </View>

      <View style={[styles.mainContainer, isTablet && styles.mainContainerTablet]}>

        {/* Left/Center: Game Board */}
        <View
          style={[styles.gameBoard, isTablet && styles.gameBoardTablet]}
          onLayout={(e) => setBoardLayout(e.nativeEvent.layout)}
        >
          {/* Center Info */}
          <View style={styles.centerInfo}>
            <Text style={styles.phaseIcon}>{phase === 'night' ? '🌙' : '☀️'}</Text>
            <Text style={styles.phaseText}>{phase.toUpperCase()}</Text>
            <Text style={styles.roundText}>Round {round}</Text>
          </View>

          {/* Players in Circle */}
          {playerList.map((player, index) => {
            const pos = getPlayerPosition(index, playerList.length);
            const roleColor = ROLE_COLORS[player.role?.toLowerCase() || 'citizen'] || '#888';

            // If board layout not ready, hide or center (pos 0,0)
            if (boardLayout.width === 0) return null;

            return (
              <View
                key={player.id}
                style={[
                  styles.playerSeat,
                  {
                    left: pos.x - 40, // subtract half width (80/2)
                    top: pos.y - 50,  // subtract half height (100/2)
                    shadowColor: roleColor,
                    borderColor: roleColor,
                  }
                ]}
              >
                {/* Avatar Circle with Initials */}
                <View style={[styles.avatarCircle, { borderColor: roleColor }]}>
                  <Text style={styles.avatarText}>{getInitials(player.username)}</Text>
                </View>

                {/* Name and Role */}
                <Text style={styles.playerName} numberOfLines={1}>{player.username}</Text>
                <View style={styles.roleBadge}>
                  <Text style={[styles.roleText, { color: roleColor }]}>
                    {player.role === 'mafia' ? '👺 ' : player.role === 'police' ? '👮 ' : player.role === 'doctor' ? '🩺 ' : ''}
                    {player.role?.toLowerCase()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Right: Chat Sidebar */}
        <View style={[styles.sidebar, isTablet && styles.sidebarTablet]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>💬 Chat</Text>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessage
                username={item.username}
                message={item.message}
                timestamp={new Date(item.created_at).toLocaleTimeString()}
              />
            )}
            contentContainerStyle={styles.messagesList}
            style={styles.chatList}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              value={newMessage}
              onChangeText={setNewMessage}
              onSubmitEditing={handleSendMessage}
              editable={!sending}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={sending}
            >
              <Text style={styles.sendIcon}>{sending ? '...' : '➤'}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Dark navy/black
  },
  centerLoading: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 2,
    borderBottomColor: '#00ff00',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  roomName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomCode: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column', // Stack vertically on mobile
  },
  mainContainerTablet: {
    flexDirection: 'row', // Side-by-side on tablets
  },
  gameBoard: {
    flex: 1,
    minHeight: 300, // Minimum height on mobile
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  gameBoardTablet: {
    flex: 2, // Takes more space on tablets
  },
  sidebar: {
    height: 250, // Fixed height on mobile
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarTablet: {
    height: 'auto',
    width: 320, // Fixed width on tablets
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
  },
  // Center Phase Info
  centerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  phaseText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  roundText: {
    color: '#94a3b8', // Slate-400
    fontSize: 16,
  },

  // Player Seat (Circular Items)
  playerSeat: {
    position: 'absolute',
    width: isTablet ? 90 : 70,
    height: isTablet ? 110 : 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 2,
    // Glow effect (simplified for RN)
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
    padding: 6,
  },
  avatarCircle: {
    width: isTablet ? 44 : 36,
    height: isTablet ? 44 : 36,
    borderRadius: isTablet ? 22 : 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#0f172a',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: isTablet ? 14 : 12,
  },
  playerName: {
    color: '#fff',
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: isTablet ? 10 : 8,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Sidebar specific
  sidebarHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0f172a',
  },
  sidebarTitle: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 255, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  chatList: {
    flex: 1,
  },
  messagesList: {
    padding: 12,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#334155',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#06b6d4', // Cyan
    padding: 8,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
