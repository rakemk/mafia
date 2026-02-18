-- Run this diagnostic query in your Supabase SQL Editor
-- It will check if all required tables and policies exist

-- Check if tables exist
SELECT 
  'profiles' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'game_rooms',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_rooms')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT 
  'game_players',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_players')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT 
  'chat_messages',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT 
  'game_states',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_states')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END;

-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname,
  '✅ Policy exists' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'game_rooms', 'game_players', 'chat_messages', 'game_states')
ORDER BY tablename, policyname;
