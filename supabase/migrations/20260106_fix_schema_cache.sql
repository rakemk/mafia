-- Force PostgREST to reload the schema cache (Critical for PGRST205 error)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Add role column if it doesn't exist (needed for the UI)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_players' AND column_name = 'role') THEN
        ALTER TABLE public.game_players ADD COLUMN role VARCHAR(20) DEFAULT 'citizen';
    END IF;
END $$;

-- Add game state columns to game_rooms if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_rooms' AND column_name = 'phase') THEN
        ALTER TABLE public.game_rooms ADD COLUMN phase VARCHAR(20) DEFAULT 'day';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_rooms' AND column_name = 'round_number') THEN
        ALTER TABLE public.game_rooms ADD COLUMN round_number INTEGER DEFAULT 1;
    END IF;
END $$;

-- Just to be safe, re-grant permissions which sometimes get lost
GRANT ALL ON TABLE public.game_rooms TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_players TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
