-- Migration: Add installment support to transactions
-- Description: Add installment_total and installment_number columns to transactions table
-- Created: 2026-04-13
-- Version: 20260413000006
--
-- Semântica:
-- - amount é sempre o valor REAL do lançamento daquele mês
-- - installment_total e installment_number são METADADOS opcionais
-- - não divide amount automaticamente
-- - não gera cronograma automático
-- - ambas as colunas são nullable
-- - lançamentos antigos continuam funcionando normalmente

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_total integer;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_number integer;

-- Add constraint: if installment_number exists, installment_total must also exist
ALTER TABLE transactions
ADD CONSTRAINT IF NOT EXISTS chk_installment_consistency CHECK (
  (installment_number IS NULL AND installment_total IS NULL) OR
  (installment_number IS NOT NULL AND installment_total IS NOT NULL)
);

-- Add constraint: installment_number >= 1 and installment_number <= installment_total
ALTER TABLE transactions
ADD CONSTRAINT IF NOT EXISTS chk_installment_valid_range CHECK (
  installment_number IS NULL OR (
    installment_number >= 1 AND
    installment_number <= COALESCE(installment_total, 1)
  )
);

CREATE INDEX IF NOT EXISTS idx_transactions_installment ON transactions (installment_total, installment_number);
