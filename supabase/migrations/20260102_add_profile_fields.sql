-- Add new profile fields: name, age, gender
-- This migration adds user profile information fields to the profiles table

-- Add name column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add age column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 13 AND age <= 100);

-- Add gender column with specific allowed values
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Set default value for gender
ALTER TABLE profiles 
ALTER COLUMN gender SET DEFAULT 'prefer_not_to_say';

-- Add comments for documentation
COMMENT ON COLUMN profiles.name IS 'User full name';
COMMENT ON COLUMN profiles.age IS 'User age (must be between 13 and 100)';
COMMENT ON COLUMN profiles.gender IS 'User gender (male, female, other, prefer_not_to_say)';
