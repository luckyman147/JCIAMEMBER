-- Treasury Verification & Expense Type Migration
-- Adds verification columns, payment tracking, and expense subtypes

-- 1. Add verification columns
ALTER TABLE treasury_transactions
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verified_by UUID REFERENCES auth.users(id),
ADD COLUMN verified_at TIMESTAMPTZ;

-- 2. Add payment tracking for reserved→paid conversion
ALTER TABLE treasury_transactions
ADD COLUMN paid_at TIMESTAMPTZ;

-- 3. Change type check constraint to include expense subtypes
ALTER TABLE treasury_transactions
DROP CONSTRAINT IF EXISTS treasury_transactions_type_check;

UPDATE treasury_transactions
SET type = 'expense_paid'
WHERE type = 'expense';

ALTER TABLE treasury_transactions
ADD CONSTRAINT treasury_transactions_type_check
CHECK (type IN ('gain', 'expense_paid', 'expense_reserved'));
