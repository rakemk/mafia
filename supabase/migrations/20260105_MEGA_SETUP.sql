-- MEGA SETUP SCRIPT
-- Run this ENTIRE script in Supabase SQL Editor to fix missing profiles, game rooms, and login issues.

-- ==========================================
-- 1. RESET / CLEANUP (Drop old tables to start fresh)
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.game_states;
DROP TABLE IF EXISTS public.game_players;
DROP TABLE IF EXISTS public.game_rooms;
-- Only drop profiles if you want to lose all user data. If so, uncomment next line:
-- DROP TABLE IF EXISTS public.profiles; 

-- ==========================================
-- 2. SETUP PROFILES (Fixed "public.profile" error)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  name TEXT,
  age INTEGER,
  gender TEXT,
  avatar_character TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view anyone's profile (needed for avatars in game)
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ==========================================
-- 3. AUTO-CREATE PROFILE ON SIGNUP (Fixes Google Login)
-- ==========================================
-- This ensures that when Google Login creates a user, a profile row is made automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, avatar_character)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'name', 'User_' || substr(new.id::text, 1, 6)),
    'char1' -- default avatar
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 4. SETUP GAME TABLES (Fixes "game_rooms" error)
-- ==========================================
CREATE TABLE public.game_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    host_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'waiting',
    max_players INTEGER DEFAULT 8,
    current_players INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.game_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    username VARCHAR(50),
    avatar_character VARCHAR(50),
    is_alive BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Toggle RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- PERMISSIVE POLICIES (Fixes weird permission errors)
CREATE POLICY "Enable all access to game_rooms" ON public.game_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access to game_players" ON public.game_players FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 5. FINAL PERMISSIONS GRANT
-- ==========================================
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_rooms TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_players TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload config';
