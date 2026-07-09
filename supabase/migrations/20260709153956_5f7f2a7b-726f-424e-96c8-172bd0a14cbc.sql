CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-messages') THEN
    PERFORM cron.unschedule('purge-expired-messages');
  END IF;
END $$;
SELECT cron.schedule('purge-expired-messages', '*/15 * * * *', $$SELECT public.purge_expired_messages();$$);