-- CreaoLink Phase 1 schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('CLIENT', 'EDITOR')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO roles (name)
VALUES ('CLIENT'), ('EDITOR')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Phase 2 schema: Editor Marketplace

CREATE TABLE IF NOT EXISTS editor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  headline TEXT,
  summary TEXT,
  hourly_rate INTEGER,
  rating NUMERIC(2,1) DEFAULT 4.5,
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'away')),
  response_time_hours INTEGER DEFAULT 24,
  completed_projects INTEGER DEFAULT 0,
  languages TEXT[] DEFAULT ARRAY['English'],
  timezone TEXT DEFAULT 'UTC',
  turnaround_days INTEGER DEFAULT 3,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS editor_skills (
  editor_profile_id UUID NOT NULL REFERENCES editor_profiles(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (editor_profile_id, skill_id)
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  editor_profile_id UUID NOT NULL REFERENCES editor_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS editor_profiles_set_updated_at ON editor_profiles;
CREATE TRIGGER editor_profiles_set_updated_at
BEFORE UPDATE ON editor_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Phase 2 seed data (simple demo data)

INSERT INTO users (id, email, password_hash, role_id)
SELECT '8b1c76e5-4a94-4b34-a6c6-2e3f7d5c7f10', 'ava.editor@creaolink.test', crypt('Password123!', gen_salt('bf')), r.id
FROM roles r WHERE r.name = 'EDITOR'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, role_id)
SELECT '0b4f01b7-4c88-4df0-8ef9-0d2e3e7c9d21', 'leo.editor@creaolink.test', crypt('Password123!', gen_salt('bf')), r.id
FROM roles r WHERE r.name = 'EDITOR'
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, display_name, bio)
VALUES
  ('8b1c76e5-4a94-4b34-a6c6-2e3f7d5c7f10', 'Ava Kim', 'Cinematic storyteller focused on brand films and product launches.'),
  ('0b4f01b7-4c88-4df0-8ef9-0d2e3e7c9d21', 'Leo Park', 'Fast, punchy short-form edits for creators and startups.')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO editor_profiles (id, user_id, headline, summary, hourly_rate, rating, availability, response_time_hours, completed_projects, languages, timezone, turnaround_days, featured)
VALUES
  ('2f14f7a2-0a63-4b6d-9bd6-2c97c7249d5f', '8b1c76e5-4a94-4b34-a6c6-2e3f7d5c7f10', 'Cinematic brand films & launch videos', 'Specializes in cinematic storytelling, motion pacing, and clean sound design.', 65, 4.8, 'available', 12, 47, ARRAY['English', 'Korean'], 'Asia/Seoul', 5, true),
  ('c1b59e9a-ff2c-4f1d-b4bb-8c0b2f9fb2d7', '0b4f01b7-4c88-4df0-8ef9-0d2e3e7c9d21', 'Short-form edits for creators', 'Snappy edits, captions, and punchy beats optimized for social.', 45, 4.5, 'available', 6, 128, ARRAY['English', 'Spanish'], 'America/Los_Angeles', 2, false)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO skills (name, slug)
VALUES
  ('Cinematic', 'cinematic'),
  ('Documentary', 'documentary'),
  ('Short-form', 'short-form'),
  ('Motion Graphics', 'motion-graphics'),
  ('Sound Design', 'sound-design'),
  ('Color Grading', 'color-grading')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO editor_skills (editor_profile_id, skill_id)
SELECT '2f14f7a2-0a63-4b6d-9bd6-2c97c7249d5f', s.id FROM skills s WHERE s.slug IN ('cinematic', 'sound-design', 'color-grading')
ON CONFLICT DO NOTHING;

INSERT INTO editor_skills (editor_profile_id, skill_id)
SELECT 'c1b59e9a-ff2c-4f1d-b4bb-8c0b2f9fb2d7', s.id FROM skills s WHERE s.slug IN ('short-form', 'motion-graphics')
ON CONFLICT DO NOTHING;

INSERT INTO portfolio_items (editor_profile_id, title, youtube_url, youtube_id, description)
VALUES
  ('2f14f7a2-0a63-4b6d-9bd6-2c97c7249d5f', 'Skylight Launch Film', 'https://www.youtube.com/watch?v=6Dh-RL__uN4', '6Dh-RL__uN4', 'Cinematic launch teaser with rich sound design.'),
  ('2f14f7a2-0a63-4b6d-9bd6-2c97c7249d5f', 'Woven Studio Reel', 'https://www.youtube.com/watch?v=ysz5S6PUM-U', 'ysz5S6PUM-U', 'Brand story reel with cinematic pacing.'),
  ('c1b59e9a-ff2c-4f1d-b4bb-8c0b2f9fb2d7', 'Creator Shorts Pack', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'aqz-KE-bpKQ', 'Fast cuts, captions, and punchy rhythm for socials.')
ON CONFLICT DO NOTHING;

-- Client bookmarks (save favorite editors)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  editor_profile_id UUID NOT NULL REFERENCES editor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, editor_profile_id)
);

-- Additional seed editors for variety
INSERT INTO users (id, email, password_hash, role_id)
SELECT 'a3d8c1e2-5b7f-4a9d-8c6e-1f2a3b4c5d6e', 'maya.editor@creaolink.test', crypt('Password123!', gen_salt('bf')), r.id
FROM roles r WHERE r.name = 'EDITOR'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, role_id)
SELECT 'b4e9d2f3-6c8a-4b0e-9d7f-2a3b4c5d6e7f', 'raj.editor@creaolink.test', crypt('Password123!', gen_salt('bf')), r.id
FROM roles r WHERE r.name = 'EDITOR'
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, display_name, bio)
VALUES
  ('a3d8c1e2-5b7f-4a9d-8c6e-1f2a3b4c5d6e', 'Maya Chen', 'Documentary filmmaker with a passion for authentic stories.'),
  ('b4e9d2f3-6c8a-4b0e-9d7f-2a3b4c5d6e7f', 'Raj Patel', 'Motion graphics specialist for tech brands and SaaS.')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO editor_profiles (id, user_id, headline, summary, hourly_rate, rating, availability, response_time_hours, completed_projects, languages, timezone, turnaround_days, featured)
VALUES
  ('d5f0e3a4-7d9b-4c1f-ae8g-3b4c5d6e7f8a', 'a3d8c1e2-5b7f-4a9d-8c6e-1f2a3b4c5d6e', 'Documentary & interview edits', 'Creates compelling narrative arcs from raw interview footage. Expert in pacing and emotional storytelling.', 75, 4.9, 'busy', 24, 83, ARRAY['English', 'Mandarin'], 'America/New_York', 7, true),
  ('e6a1f4b5-8eac-4d2a-bf9h-4c5d6e7f8a9b', 'b4e9d2f3-6c8a-4b0e-9d7f-2a3b4c5d6e7f', 'Motion graphics for tech', 'Sleek animations, explainer videos, and product demos for startups and enterprises.', 85, 4.7, 'available', 8, 156, ARRAY['English', 'Hindi'], 'Asia/Kolkata', 4, false)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO editor_skills (editor_profile_id, skill_id)
SELECT 'd5f0e3a4-7d9b-4c1f-ae8g-3b4c5d6e7f8a', s.id FROM skills s WHERE s.slug IN ('documentary', 'color-grading', 'sound-design')
ON CONFLICT DO NOTHING;

INSERT INTO editor_skills (editor_profile_id, skill_id)
SELECT 'e6a1f4b5-8eac-4d2a-bf9h-4c5d6e7f8a9b', s.id FROM skills s WHERE s.slug IN ('motion-graphics', 'short-form')
ON CONFLICT DO NOTHING;

INSERT INTO portfolio_items (editor_profile_id, title, youtube_url, youtube_id, description)
VALUES
  ('d5f0e3a4-7d9b-4c1f-ae8g-3b4c5d6e7f8a', 'Voices of Change', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'JGwWNGJdvx8', 'Documentary short on community activism.'),
  ('e6a1f4b5-8eac-4d2a-bf9h-4c5d6e7f8a9b', 'SaaS Product Demo', 'https://www.youtube.com/watch?v=ZnuwB35GYMY', 'ZnuwB35GYMY', 'Clean motion graphics for product launch.')
ON CONFLICT DO NOTHING;
