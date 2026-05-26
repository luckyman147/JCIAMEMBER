-- Activity Budget Lifecycle: pending → approved → completed
-- When approved: funds are reserved from the session budget
-- When completed: unspent funds auto-release back to session

ALTER TABLE treasury_activity_budgets
  ADD COLUMN status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'completed')),
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN approved_by uuid,
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN completed_by uuid;

-- Mark existing rows as approved (backwards compatibility)
UPDATE treasury_activity_budgets
SET status = 'approved'
WHERE status = 'pending';

CREATE INDEX idx_activity_budgets_session_status
  ON treasury_activity_budgets(session_id, status);
