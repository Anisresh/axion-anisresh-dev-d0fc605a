
ALTER TABLE public.user_settings ALTER COLUMN theme SET DEFAULT 'dark';
UPDATE public.user_settings SET theme = 'dark' WHERE theme = 'light';
