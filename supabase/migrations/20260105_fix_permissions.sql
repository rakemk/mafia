-- Grants specific permissions to Supabase roles
-- Often required if the project was set up with "Secure Defaults" or if permissions were lost

-- 1. Grant usage on the schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant access to the tables
GRANT ALL ON TABLE public.game_rooms TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_players TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.chat_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_states TO anon, authenticated, service_role;

-- 3. Ensure sequences (for IDs) are accessible if you use serials (UUIDs usually don't need this, but good practice)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Reload cache one last time
NOTIFY pgrst, 'reload config';
