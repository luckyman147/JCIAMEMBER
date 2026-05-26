-- Safe, idempotent seed for Treasury module
-- Adds default categories, an active session, budgets and sample transactions.

DO $$
DECLARE
  _admin_id UUID;
  _session_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  _budget_general UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  _budget_events UUID := '33333333-3333-3333-3333-333333333333'::uuid;
  _txn1 UUID := '44444444-4444-4444-4444-444444444444'::uuid;
  _txn2 UUID := '55555555-5555-5555-5555-555555555555'::uuid;
  v_admin_exists BOOLEAN;
  v_expense_cat UUID;
  v_marketing_cat UUID;
  v_sponsorship_cat UUID;
BEGIN
  -- Use first user as seed author if any users exist
  SELECT id INTO _admin_id FROM auth.users ORDER BY created_at LIMIT 1;
  IF _admin_id IS NULL THEN
    RAISE NOTICE 'No auth.users found; skipping treasury seed.';
    RETURN;
  END IF;

  -- Ensure categories exist (safe to run multiple times)
  INSERT INTO treasury_categories (name, type)
  SELECT 'Event','expense' WHERE NOT EXISTS (SELECT 1 FROM treasury_categories WHERE name='Event' AND type='expense');

  INSERT INTO treasury_categories (name, type)
  SELECT 'Marketing','expense' WHERE NOT EXISTS (SELECT 1 FROM treasury_categories WHERE name='Marketing' AND type='expense');

  INSERT INTO treasury_categories (name, type)
  SELECT 'Administration','expense' WHERE NOT EXISTS (SELECT 1 FROM treasury_categories WHERE name='Administration' AND type='expense');

  INSERT INTO treasury_categories (name, type)
  SELECT 'Electricity','expense' WHERE NOT EXISTS (SELECT 1 FROM treasury_categories WHERE name='Electricity' AND type='expense');

  INSERT INTO treasury_categories (name, type)
  SELECT 'Water','expense' WHERE NOT EXISTS (SELECT 1 FROM treasury_categories WHERE name='Water' AND type='expense');

  INSERT INTO treasury_categories (name, type)
  SELECT 'Internet','expense' WHERE NOT EXISTS (SELECT 1 FROM treasury_categories WHERE name='Internet' AND type='expense');

  INSERT INTO treasury_categories (name, type)
  SELECT 'Sponsorship','gain' WHERE NOT EXISTS (SELECT 1 FROM treasury_categories WHERE name='Sponsorship' AND type='gain');

  -- pick category ids for sample transactions
  SELECT id INTO v_expense_cat FROM treasury_categories WHERE name='Administration' AND type='expense' LIMIT 1;
  SELECT id INTO v_marketing_cat FROM treasury_categories WHERE name='Marketing' AND type='expense' LIMIT 1;
  SELECT id INTO v_sponsorship_cat FROM treasury_categories WHERE name='Sponsorship' AND type='gain' LIMIT 1;

  -- Upsert a single active treasury session for demo/testing
  INSERT INTO treasury_sessions (id, planned_budget, current_balance, reserved_amount, spent_amount, remaining_amount, start_date, end_date, status, created_by, created_at, updated_at)
  VALUES (_session_id, 50000.00, 47000.00, 5000.00, 3000.00, 47000.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 'active', _admin_id, now(), now())
  ON CONFLICT (id) DO UPDATE SET planned_budget=EXCLUDED.planned_budget, current_balance=EXCLUDED.current_balance, reserved_amount=EXCLUDED.reserved_amount, spent_amount=EXCLUDED.spent_amount, remaining_amount=EXCLUDED.remaining_amount, start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date, status=EXCLUDED.status, updated_at=now();

  -- Add a few activity budgets (general, events)
  INSERT INTO treasury_activity_budgets (id, session_id, activity_id, allocated_amount, spent_amount, remaining_amount, notes, created_at, updated_at)
  VALUES (_budget_general, _session_id, NULL, 20000.00, 1200.00, 18800.00, 'General operations budget', now(), now())
  ON CONFLICT (id) DO UPDATE SET session_id=EXCLUDED.session_id, allocated_amount=EXCLUDED.allocated_amount, spent_amount=EXCLUDED.spent_amount, remaining_amount=EXCLUDED.remaining_amount, notes=EXCLUDED.notes, updated_at=now();

  INSERT INTO treasury_activity_budgets (id, session_id, activity_id, allocated_amount, spent_amount, remaining_amount, notes, created_at, updated_at)
  VALUES (_budget_events, _session_id, NULL, 15000.00, 1800.00, 13200.00, 'Events & outreach', now(), now())
  ON CONFLICT (id) DO UPDATE SET session_id=EXCLUDED.session_id, allocated_amount=EXCLUDED.allocated_amount, spent_amount=EXCLUDED.spent_amount, remaining_amount=EXCLUDED.remaining_amount, notes=EXCLUDED.notes, updated_at=now();

  -- Sample transactions (one approved expense, one pending gain)
  IF v_expense_cat IS NOT NULL THEN
    INSERT INTO treasury_transactions (id, session_id, activity_budget_id, category_id, type, amount, description, date, status, created_by, approved_by, approved_at, created_at, updated_at)
    VALUES (_txn1, _session_id, _budget_general, v_expense_cat, 'expense', 1200.00, 'Office supplies', CURRENT_DATE - INTERVAL '21 days', 'approved', _admin_id, _admin_id, now() - INTERVAL '20 days', now(), now())
    ON CONFLICT (id) DO UPDATE SET session_id=EXCLUDED.session_id, activity_budget_id=EXCLUDED.activity_budget_id, category_id=EXCLUDED.category_id, type=EXCLUDED.type, amount=EXCLUDED.amount, description=EXCLUDED.description, date=EXCLUDED.date, status=EXCLUDED.status, created_by=EXCLUDED.created_by, approved_by=EXCLUDED.approved_by, approved_at=EXCLUDED.approved_at, updated_at=now();
  END IF;

  IF v_marketing_cat IS NOT NULL THEN
    INSERT INTO treasury_transactions (id, session_id, activity_budget_id, category_id, type, amount, description, date, status, created_by, approved_by, approved_at, created_at, updated_at)
    VALUES (_txn2, _session_id, _budget_events, v_marketing_cat, 'expense', 1800.00, 'Event branding & printing', CURRENT_DATE - INTERVAL '12 days', 'approved', _admin_id, _admin_id, now() - INTERVAL '11 days', now(), now())
    ON CONFLICT (id) DO UPDATE SET session_id=EXCLUDED.session_id, activity_budget_id=EXCLUDED.activity_budget_id, category_id=EXCLUDED.category_id, type=EXCLUDED.type, amount=EXCLUDED.amount, description=EXCLUDED.description, date=EXCLUDED.date, status=EXCLUDED.status, created_by=EXCLUDED.created_by, approved_by=EXCLUDED.approved_by, approved_at=EXCLUDED.approved_at, updated_at=now();
  END IF;

  -- Example incoming sponsorship (pending)
  IF v_sponsorship_cat IS NOT NULL THEN
    INSERT INTO treasury_transactions (id, session_id, activity_budget_id, category_id, type, amount, description, date, status, created_by, created_at, updated_at)
    VALUES ('66666666-6666-6666-6666-666666666666'::uuid, _session_id, _budget_events, v_sponsorship_cat, 'gain', 2500.00, 'Local sponsor contribution', CURRENT_DATE - INTERVAL '7 days', 'pending', _admin_id, now(), now())
    ON CONFLICT (id) DO UPDATE SET session_id=EXCLUDED.session_id, activity_budget_id=EXCLUDED.activity_budget_id, category_id=EXCLUDED.category_id, type=EXCLUDED.type, amount=EXCLUDED.amount, description=EXCLUDED.description, date=EXCLUDED.date, status=EXCLUDED.status, created_by=EXCLUDED.created_by, updated_at=now();
  END IF;

END $$;

-- End seed
