-- ============================================================================
-- One-time backfill for jps_snapshots and jps_year_snapshots.
--
-- The triggers added in 20250704010000_jps_realtime_triggers.sql only fire on
-- NEW writes going forward — they don't retroactively score members whose data
-- hasn't changed since the migration ran. Without this, both tables stay empty
-- (and the leaderboard shows "No performance snapshots found") until someone
-- happens to rate an activity, complete a task, etc. This runs both
-- recalculate functions once for every existing member right now.
--
-- Safe to re-run any time (e.g. after a bulk data fix) — it's the same
-- functions the triggers call, just looped over everyone instead of one member.
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_count int := 0;
BEGIN
  FOR r IN SELECT id FROM profiles LOOP
    -- Separate exception blocks: a failure in the year calc must not roll back
    -- an already-successful trimester calc (they'd share a savepoint otherwise).
    BEGIN
      PERFORM public.recalculate_member_jps(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS trimester backfill failed for member %: %', r.id, SQLERRM;
    END;

    BEGIN
      PERFORM public.recalculate_member_jps_year(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'JPS year backfill failed for member %: %', r.id, SQLERRM;
    END;

    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'JPS backfill complete: % members processed', v_count;
END $$;
