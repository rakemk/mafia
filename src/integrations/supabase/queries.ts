import { supabase } from './client';

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  avatar_character?: string;
};

export type GameRoom = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: 'waiting' | 'playing' | 'finished';
  max_players: number;
  current_players?: number;
  created_at: string;
  updated_at?: string;
  game_start_at?: string;
  game_end_at?: string;
  phase?: 'day' | 'night';
  round_number?: number;
};

export type GamePlayer = {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar_character?: string;
  role?: string;
  is_alive: boolean;
  joined_at: string;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
};

// Authentication functions
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signInWithOAuth: async (provider: 'google' | 'apple') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'neon-mafia-nights://auth/callback', // Deep link schema
      },
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session, error };
  },

  // Phone authentication with OTP
  signInWithPhone: async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { data, error };
  },

  verifyOtp: async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { data, error };
  },

  signUpWithPhone: async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { data, error };
  },
};

// User profile functions
export const profiles = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: {
    username?: string;
    name?: string;
    age?: number;
    gender?: string;
    avatar_character?: string;
  }) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },
};

// Game room functions
export const rooms = {
  getRooms: async () => {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getRoom: async (roomId: string) => {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    return { data, error };
  },

  getRoomByCode: async (code: string) => {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'waiting')
      .single();
    return { data, error };
  },

  createRoom: async (
    hostId: string,
    name: string,
    code: string,
    maxPlayers: number = 8
  ) => {
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        host_id: hostId,
        name,
        code,
        max_players: maxPlayers,
        status: 'waiting',
      })
      .select()
      .single();
    return { data, error };
  },

  updateRoomStatus: async (roomId: string, status: string) => {
    const { data, error } = await supabase
      .from('game_rooms')
      .update({ status })
      .eq('id', roomId)
      .select()
      .single();
    return { data, error };
  },

  deleteRoom: async (roomId: string) => {
    const { error } = await supabase
      .from('game_rooms')
      .delete()
      .eq('id', roomId);
    return { error };
  },
};

// Player functions
export const players = {
  getPlayers: async (roomId: string) => {
    const { data, error } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });
    return { data, error };
  },

  joinRoom: async (roomId: string, userId: string, username: string) => {
    const { data, error } = await supabase
      .from('game_players')
      .insert({
        room_id: roomId,
        user_id: userId,
        username,
        is_alive: true,
      })
      .select()
      .single();
    return { data, error };
  },

  leaveRoom: async (roomId: string, userId: string) => {
    const { error } = await supabase
      .from('game_players')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
    return { error };
  },

  updatePlayer: async (
    roomId: string,
    userId: string,
    updates: { role?: string; is_alive?: boolean }
  ) => {
    const { data, error } = await supabase
      .from('game_players')
      .update(updates)
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },
};

// Chat functions
export const chat = {
  getMessages: async (roomId: string, limit: number = 50) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: data?.reverse() || [], error };
  },

  sendMessage: async (
    roomId: string,
    userId: string,
    username: string,
    message: string
  ) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        username,
        message,
      })
      .select()
      .single();
    return { data, error };
  },
};
