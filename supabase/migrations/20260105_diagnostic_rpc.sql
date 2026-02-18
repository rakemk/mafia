-- Create a diagnostic function to check table existence/health
CREATE OR REPLACE FUNCTION check_game_setup()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run as superuser to bypass table permissions for this check
AS $$
DECLARE
  table_exists boolean;
  row_count int;
  schema_info record;
BEGIN
  -- Check if table exists in information_schema
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'game_rooms'
  ) INTO table_exists;

  IF table_exists THEN
    SELECT count(*) INTO row_count FROM public.game_rooms;
    RETURN json_build_object(
      'status', 'ok',
      'message', 'Table exists',
      'row_count', row_count
    );
  ELSE
    RETURN json_build_object(
      'status', 'error',
      'message', 'Table public.game_rooms NOT FOUND in database'
    );
  END IF;
END;
$$;
