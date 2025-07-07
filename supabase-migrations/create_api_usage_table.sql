CREATE TABLE public.api_usage (
  user_id TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0 NOT NULL
);
