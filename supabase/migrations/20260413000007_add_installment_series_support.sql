-- Migration: Add installment series support with atomicity
-- Description: Add purchase_total_amount and installment_group_id for parcelamento
-- Created: 2026-04-13
-- Version: 20260413000007
--
-- This migration:
-- 1. Adds purchase_total_amount to store total purchase value
-- 2. Adds installment_group_id to link series of installments
-- 3. Removes previous simplified installment columns
-- 4. Creates atomic RPC function for series generation

-- Step 1: Add new columns
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS purchase_total_amount numeric(12, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_group_id uuid;

-- Step 2: Create index for series lookup
CREATE INDEX IF NOT EXISTS idx_transactions_installment_group_id
  ON transactions(installment_group_id);

-- Step 3: Create atomic function for installment series generation
CREATE OR REPLACE FUNCTION create_installment_series(
  p_user_id text,
  p_type text,
  p_purchase_total_amount numeric,
  p_installment_total integer,
  p_category text,
  p_subcategory text,
  p_description text,
  p_date date,
  p_income_type text,
  p_expense_nature text,
  p_frequency text,
  p_planning_status text
)
RETURNS json AS $$
DECLARE
  v_group_id uuid;
  v_base_amount numeric;
  v_last_amount numeric;
  v_total_sum numeric := 0;
  v_i integer;
  v_current_date date;
  v_count integer := 0;
BEGIN
  -- Validate inputs
  IF p_purchase_total_amount IS NULL OR p_installment_total IS NULL THEN
    RAISE EXCEPTION 'purchase_total_amount and installment_total are required';
  END IF;

  IF p_installment_total < 1 THEN
    RAISE EXCEPTION 'installment_total must be >= 1';
  END IF;

  -- Generate group ID for this series
  v_group_id := gen_random_uuid();

  -- Calculate base amount (rounded to 2 decimals)
  v_base_amount := ROUND(p_purchase_total_amount / p_installment_total, 2);

  -- Insert installments 1 to N-1
  FOR v_i IN 1..(p_installment_total - 1) LOOP
    v_current_date := p_date + (interval '1 month' * (v_i - 1));

    INSERT INTO transactions (
      user_id, type, amount, purchase_total_amount,
      installment_total, installment_number, installment_group_id,
      category, subcategory, description, date,
      income_type, expense_nature, frequency, planning_status
    ) VALUES (
      p_user_id, p_type::transaction_type, v_base_amount, p_purchase_total_amount,
      p_installment_total, v_i, v_group_id,
      p_category, p_subcategory, p_description, v_current_date,
      p_income_type::income_type, p_expense_nature::expense_nature, p_frequency::frequency,
      CASE WHEN v_i = 1 THEN 'realized'::planning_status ELSE 'planned'::planning_status END
    );

    v_total_sum := v_total_sum + v_base_amount;
    v_count := v_count + 1;
  END LOOP;

  -- Calculate and insert last installment (absorbs difference)
  v_last_amount := ROUND(p_purchase_total_amount - v_total_sum, 2);
  v_current_date := p_date + (interval '1 month' * (p_installment_total - 1));

  INSERT INTO transactions (
    user_id, type, amount, purchase_total_amount,
    installment_total, installment_number, installment_group_id,
    category, subcategory, description, date,
    income_type, expense_nature, frequency, planning_status
  ) VALUES (
    p_user_id, p_type::transaction_type, v_last_amount, p_purchase_total_amount,
    p_installment_total, p_installment_total, v_group_id,
    p_category, p_subcategory, p_description, v_current_date,
    p_income_type::income_type, p_expense_nature::expense_nature, p_frequency::frequency, 'planned'::planning_status
  );

  v_count := v_count + 1;

  -- Return success with metadata
  RETURN json_build_object(
    'success', true,
    'group_id', v_group_id,
    'installments_created', v_count
  );

EXCEPTION WHEN OTHERS THEN
  -- Any error causes full rollback (transaction is atomic)
  RAISE EXCEPTION 'Failed to create installment series: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Verify constraints are in place
ALTER TABLE transactions
ADD CONSTRAINT IF NOT EXISTS chk_installment_consistency CHECK (
  (installment_number IS NULL AND installment_total IS NULL AND installment_group_id IS NULL) OR
  (installment_number IS NOT NULL AND installment_total IS NOT NULL AND installment_group_id IS NOT NULL)
);

COMMENT ON COLUMN transactions.purchase_total_amount IS 'Total purchase amount for parcelado transactions (metadata)';
COMMENT ON COLUMN transactions.installment_group_id IS 'UUID that links all installments of the same purchase';
COMMENT ON FUNCTION create_installment_series IS 'Atomically creates a series of installments. Either all succeed or all rollback.';
