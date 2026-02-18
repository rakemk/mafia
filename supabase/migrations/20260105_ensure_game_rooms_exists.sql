-- Ensure game_rooms table exists; idempotent guard for missing table in environments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_rooms'
  ) THEN
    CREATE TABLE public.game_rooms (
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
  END IF;
END $$;

-- Keep supporting structures in sync
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON public.game_rooms(code);

ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

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
