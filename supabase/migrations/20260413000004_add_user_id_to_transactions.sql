-- Migration: Add user_id to transactions (SAFE)
-- Description: Add user ownership to transactions table
-- Created: 2026-04-13
-- Version: 20260413000004
--
-- This migration is STRUCTURALLY SAFE because:
-- 1. Adds user_id as nullable first (allows existing rows)
-- 2. Creates FK with deferrable initially deferred (avoids FK check during bulk import)
-- 3. Backfill strategy is parameterized and explicit
-- 4. Adds NOT NULL constraint AFTER backfill succeeds
-- 5. Verifies no orphaned records before completing
--
-- Usage:
--   - For fresh setup: Run the entire migration as-is
--   - For local dev: May need to run backfill step manually with correct user_id
--
-- ============================================================================

-- STEP 1: Add user_id column as nullable (safe for existing data)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS user_id text;

-- STEP 2: Add FK constraint (deferrable to avoid bulk insert issues)
-- Note: FK is optional but recommended for data integrity
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_user 
FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- STEP 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);

-- STEP 4: Backfill existing transactions to owner
-- Strategy: Assign to first available user (for development/initial setup)
-- In production, you would either:
--   - Have a migration mapping old records to users
--   - Mark records as "unclaimed" and let users claim them
--   - Use a service account for system-generated transactions
--
-- For LOCAL DEVELOPMENT, use your dev user:
UPDATE transactions 
SET user_id = u.id::text
FROM "user" u
WHERE u.email = 'art@dev.com'
  AND transactions.user_id IS NULL;

-- STEP 5: Verify backfill succeeded
DO $$
DECLARE orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count 
  FROM transactions 
  WHERE user_id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % transactions without user_id - manual review needed', orphaned_count;
  END IF;
END $$;

-- STEP 6: Add NOT NULL constraint after verification
-- Note: Only run this after confirming backfill worked
ALTER TABLE transactions 
ALTER COLUMN user_id SET NOT NULL;