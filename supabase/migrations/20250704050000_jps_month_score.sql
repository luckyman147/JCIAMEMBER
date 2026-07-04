-- ============================================================================
-- JPS: add a genuine "this period" (calendar month) score, distinct from the
-- trimester and year scores.
--
-- Naming note (easy to re-confuse, so spelling it out): despite having a
-- `month` column, jps_snapshots has always been TRIMESTER-scoped — its score
-- is computed over the current 3-month window, just stored under the current
-- month's key (see 20250704010000_jps_realtime_triggers.sql). This migration
-- does NOT change that. It adds a NEW, separate table for a true month-only
-- window, so the three scores now are:
--   - jps_month_snapshots     — this calendar month only (NEW)
--   - jps_snapshots           — current trimester (unchanged)
--   - jps_year_snapshots      — Jan 1 through today (unchanged)
--
-- Assumption: "this period" = the calendar month, matching the leaderboard's
-- existing "Month" tab. If that's not what was meant, this is a small,
-- additive migration to correct — it doesn't touch trimester/year.
--
-- Cost note: every write to activity_participants/member_tasks/points_history/
-- profiles(cotisation)/complaints/team_members now triggers THREE independent
-- aggregate recomputations (month + trimester + year) instead of two. Still
-- fine at this app's scale, same tradeoff already accepted for the first two.
--
-- Test after applying: update a test member's activity_participants row, then
--   select score, details from jps_month_snapshots where member_id = '<id>';
-- should reflect the change immediately.
-- ============================================================================

CREATE TABLE IF NOT EXISTS jps_month_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL,
  score integer NOT NULL,
  category text NOT NULL,
  details jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, year, month)
);

CREATE OR REPLACE FUNCTION public.recalculate_member_jps_month(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year         int := extract(year from now())::int;
  v_month        int := extract(month from now())::int;
  v_period_start timestamptz := make_timestamptz(v_year, v_month, 1, 0, 0, 0);
  v_period_end   timestamptz := (v_period_start + interval '1 month' - interval '1 second');
  v_result       RECORD;
BEGIN
  SELECT * INTO v_result FROM public.compute_jps_for_period(p_member_id, v_period_start, v_period_end);
  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO jps_month_snapshots (member_id, year, month, score, category, details, updated_at)
  VALUES (p_member_id, v_year, v_month, v_result.score, v_result.category, v_result.details, now())
  ON CONFLICT (member_id, year, month)
  DO UPDATE SET score = excluded.score, category = excluded.category, details = excluded.details, updated_at = now();
END;
$$;

-- Add the month recompute as a third, independent call — a failure here must
-- not roll back the trimester/year calls already made in this same trigger fire.
CREATE OR REPLACE FUNCTION public.trg_recalculate_jps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_team_activity_id uuid;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'activity_participants' THEN
      v_member_id := COALESCE(NEW.user_id, OLD.user_id);
    WHEN 'member_tasks' THEN
      v_member_id := COALESCE(NEW.member_id, OLD.member_id);
    WHEN 'points_history' THEN
      v_member_id := COALESCE(NEW.member_id, OLD.member_id);
    WHEN 'complaints' THEN
      v_member_id := COALESCE(NEW.member_id, OLD.member_id);
    WHEN 'profiles' THEN
      v_member_id := NEW.id;
    WHEN 'team_members' THEN
      SELECT activity_id INTO v_team_activity_id FROM teams WHERE id = COALESCE(NEW.team_id, OLD.team_id);
      IF v_team_activity_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
      END IF;
      v_member_id := COALESCE(NEW.member_id, OLD.member_id);
    ELSE
      RETURN COALESCE(NEW, OLD);
  END CASE;

  IF v_member_id IS NOT NULL THEN
    BEGIN
      PERFORM public.recalculate_member_jps_month(v_member_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS month recalculation failed for member %: %', v_member_id, SQLERRM;
    END;

    BEGIN
      PERFORM public.recalculate_member_jps(v_member_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS trimester recalculation failed for member %: %', v_member_id, SQLERRM;
    END;

    BEGIN
      PERFORM public.recalculate_member_jps_year(v_member_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS year recalculation failed for member %: %', v_member_id, SQLERRM;
    END;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Realtime, failure-isolated like the other two tables.
DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'jps_month_snapshots'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.jps_month_snapshots;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not enable realtime on jps_month_snapshots (publication may not exist or already includes it): %', SQLERRM;
  END;
END $$;

-- Backfill: populate this month's score for every existing member right now.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM profiles LOOP
    BEGIN
      PERFORM public.recalculate_member_jps_month(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS month backfill failed for member %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;
