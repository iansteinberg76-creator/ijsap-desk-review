-- supabase-schema.sql
-- IJSaP Desk Review Web Tool: database schema
-- Run this in the Supabase SQL Editor after creating the project in Canada (Central).

CREATE TABLE desk_reviews (
  id                    text PRIMARY KEY,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  submission_id         text NOT NULL,
  submission_title      text NOT NULL,
  genre                 text NOT NULL,
  suggested_genre       text,
  editors               text NOT NULL,
  assessment_date       date NOT NULL,
  reviewed_by           text,
  reviewed_date         date,
  layer_of_decision     text NOT NULL,
  outcome               text NOT NULL,
  key_reason            text NOT NULL,
  points_to_carry_forward text,
  formatting_note       text,
  email_text            text NOT NULL,
  shareable_url         text,
  rubric_version        text NOT NULL,
  content_version       text NOT NULL
);

-- Enable Row Level Security
ALTER TABLE desk_reviews ENABLE ROW LEVEL SECURITY;

-- Deny-all policy: no access through the anon key or any authenticated user.
-- All access goes through the Netlify Functions using the service role key,
-- which bypasses RLS entirely.
CREATE POLICY "Deny all access" ON desk_reviews
  FOR ALL
  USING (false)
  WITH CHECK (false);
