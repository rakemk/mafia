-- Add avatar_character column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_character VARCHAR(50);

COMMENT ON COLUMN profiles.avatar_character IS 'Selected character avatar (char1, char2, char3, etc)';
