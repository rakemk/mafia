-- Create game_rooms table
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players INTEGER DEFAULT 8 CHECK (max_players >= 2 AND max_players <= 16),
  current_players INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_start_at TIMESTAMP WITH TIME ZONE,
  game_end_at TIMESTAMP WITH TIME ZONE
);

-- Create game_players table
CREATE TABLE IF NOT EXISTS public.game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  avatar_character VARCHAR(50),
  role VARCHAR(50),
  is_alive BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_states table
CREATE TABLE IF NOT EXISTS public.game_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL UNIQUE REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  phase VARCHAR(50) DEFAULT 'day' CHECK (phase IN ('day', 'night', 'voting', 'ended')),
  day_number INTEGER DEFAULT 1,
  current_vote_target UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  eliminated_players JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_host_id ON public.game_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON public.game_rooms(code);
CREATE INDEX IF NOT EXISTS idx_game_players_room_id ON public.game_players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON public.game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_game_states_room_id ON public.game_states(room_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;

-- Allow users to read all game rooms
CREATE POLICY "Allow public read access to game_rooms" 
  ON public.game_rooms FOR SELECT 
  USING (true);

-- Allow users to create game rooms
CREATE POLICY "Allow users to create game_rooms"
  ON public.game_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Allow host to update their room
CREATE POLICY "Allow host to update game_rooms"
  ON public.game_rooms FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Allow host to delete their room
CREATE POLICY "Allow host to delete game_rooms"
  ON public.game_rooms FOR DELETE
  USING (auth.uid() = host_id);

-- Game players policies
CREATE POLICY "Allow public read access to game_players"
  ON public.game_players FOR SELECT
  USING (true);

CREATE POLICY "Allow users to join rooms"
  ON public.game_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to leave rooms"
  ON public.game_players FOR DELETE
  USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Allow public read access to chat_messages"
  ON public.chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Allow users to send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Game states policies
CREATE POLICY "Allow public read access to game_states"
  ON public.game_states FOR SELECT
  USING (true);

CREATE POLICY "Allow host to update game_states"
  ON public.game_states FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.game_rooms 
    WHERE id = game_states.room_id AND host_id = auth.uid()
  ));
