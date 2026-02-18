-- ============================================
-- COMPLETE DATABASE SETUP FOR MAFIA GAME
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Step 1: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  username VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  age INTEGER,
  gender VARCHAR(50),
  avatar_character VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create game_rooms table
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players INTEGER DEFAULT 8 CHECK (max_players >= 2 AND max_players <= 20),
  current_players INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_start_at TIMESTAMP WITH TIME ZONE,
  game_end_at TIMESTAMP WITH TIME ZONE
);

-- Step 3: Create game_players table
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

-- Step 4: Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create game_states table
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

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON public.game_rooms(code);
CREATE INDEX IF NOT EXISTS idx_game_players_room ON public.game_players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user ON public.game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Step 9: Create RLS Policies for game_rooms
DROP POLICY IF EXISTS "Anyone can view waiting rooms" ON public.game_rooms;
CREATE POLICY "Anyone can view waiting rooms"
  ON public.game_rooms FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.game_rooms;
CREATE POLICY "Authenticated users can create rooms"
  ON public.game_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Host can update own room" ON public.game_rooms;
CREATE POLICY "Host can update own room"
  ON public.game_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Host can delete own room" ON public.game_rooms;
CREATE POLICY "Host can delete own room"
  ON public.game_rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

-- Step 10: Create RLS Policies for game_players
DROP POLICY IF EXISTS "Anyone can view players" ON public.game_players;
CREATE POLICY "Anyone can view players"
  ON public.game_players FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can join rooms" ON public.game_players;
CREATE POLICY "Users can join rooms"
  ON public.game_players FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave rooms" ON public.game_players;
CREATE POLICY "Users can leave rooms"
  ON public.game_players FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 11: Create RLS Policies for chat_messages
DROP POLICY IF EXISTS "Anyone can view messages" ON public.chat_messages;
CREATE POLICY "Anyone can view messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Step 12: Create RLS Policies for game_states
DROP POLICY IF EXISTS "Anyone can view game states" ON public.game_states;
CREATE POLICY "Anyone can view game states"
  ON public.game_states FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Room host can manage game state" ON public.game_states;
CREATE POLICY "Room host can manage game state"
  ON public.game_states FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.game_rooms
      WHERE game_rooms.id = room_id
      AND game_rooms.host_id = auth.uid()
    )
  );

-- Step 13: Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 14: Create trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 15: Create function to update player count
CREATE OR REPLACE FUNCTION public.update_room_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.game_rooms
    SET current_players = (
      SELECT COUNT(*) FROM public.game_players WHERE room_id = NEW.room_id
    )
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.game_rooms
    SET current_players = (
      SELECT COUNT(*) FROM public.game_players WHERE room_id = OLD.room_id
    )
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 16: Create trigger for updating player count
DROP TRIGGER IF EXISTS on_player_join_leave ON public.game_players;
CREATE TRIGGER on_player_join_leave
  AFTER INSERT OR DELETE ON public.game_players
  FOR EACH ROW EXECUTE FUNCTION public.update_room_player_count();

-- ============================================
-- SETUP COMPLETE!
-- Your database is now ready to use
-- ============================================
