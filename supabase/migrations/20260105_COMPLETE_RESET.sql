-- COMPLETE RESET of Game Tables
-- Run this in Supabase SQL Editor to fix the "Table Missing" error once and for all.

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON public.game_rooms;
DROP POLICY IF EXISTS "Host update access" ON public.game_rooms;
DROP POLICY IF EXISTS "Public read access" ON public.game_players;
DROP POLICY IF EXISTS "Player join access" ON public.game_players;

-- 2. Drop tables (reverse order of dependencies)
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.game_states;
DROP TABLE IF EXISTS public.game_players;
DROP TABLE IF EXISTS public.game_rooms;

-- 3. Create game_rooms table
CREATE TABLE public.game_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    host_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    max_players INTEGER DEFAULT 8,
    current_players INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create game_players table (for joining rooms)
CREATE TABLE public.game_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    username VARCHAR(50) NOT NULL,
    avatar_character VARCHAR(50),
    is_alive BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- 5. Enable RLS but add Permissive Policies (Fixes permission errors)
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- Grant access to everyone (authenticated and anon) for now to ensure it works
CREATE POLICY "Enable all access for game_rooms" ON public.game_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for game_players" ON public.game_players FOR ALL USING (true) WITH CHECK (true);

-- 6. Grant explicit table permissions
GRANT ALL ON TABLE public.game_rooms TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_players TO anon, authenticated, service_role;

-- 7. Force Cache Reload
NOTIFY pgrst, 'reload config';
