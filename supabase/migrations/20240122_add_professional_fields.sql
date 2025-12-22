-- Migration: Add professional and availability columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability_days TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability_time TEXT CHECK (availability_time IN ('matinal', 'afternoon', 'full_day')) DEFAULT 'matinal';

-- Index for searching by specialties
CREATE INDEX IF NOT EXISTS idx_profiles_specialties ON profiles USING GIN (specialties);
