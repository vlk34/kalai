-- Migration: Add photo_path column to Foods_consumed table
-- Run this SQL in your Supabase SQL Editor to update existing schema

-- Add photo_path column to existing Foods_consumed table
ALTER TABLE Foods_consumed 
ADD COLUMN photo_path VARCHAR(500);

-- Add comment for the new column
COMMENT ON COLUMN Foods_consumed.photo_path IS 'Path to photo in Supabase Storage';

-- Create index on photo_path for better query performance when filtering by photos
CREATE INDEX idx_foods_consumed_photo_path ON Foods_consumed(photo_path) WHERE photo_path IS NOT NULL; 