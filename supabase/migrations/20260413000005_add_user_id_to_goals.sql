-- Migration: Add user_id to goals and clean legacy data
-- Description: Add user ownership to goals table and remove shared goals
-- Created: 2026-04-13
-- Version: 20260413000005

-- Step 1: Add user_id column (nullable initially)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id text;

-- Step 2: Create index for user_id
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- Step 3: Delete ALL existing goals (legacy shared data)
-- This removes any goals without proper ownership
DELETE FROM goals WHERE user_id IS NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE goals ADD CONSTRAINT fk_goals_user 
FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Step 5: Verify no orphaned records remain
DO $$
DECLARE orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count 
  FROM goals 
  WHERE user_id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE EXCEPTION 'Found % orphaned goals after cleanup', orphaned_count;
  END IF;
  
  RAISE NOTICE 'Goals table cleaned successfully. All goals now require user_id.';
END $$;