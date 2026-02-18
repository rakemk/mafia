-- Force PostgREST to reload the schema cache
-- This is often necessary when a new table is created but the API doesn't see it yet
NOTIFY pgrst, 'reload config';

-- Verify the table is visible
SELECT count(*) as room_count FROM public.game_rooms;
