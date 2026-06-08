-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN CREATE TYPE life_class         AS ENUM ('fisico', 'mental', 'disciplina');  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE mission_difficulty AS ENUM ('easy', 'medium', 'hard', 'boss');   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE mission_type       AS ENUM ('daily', 'streak', 'achievement', 'boss'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_type  AS ENUM ('healthkit', 'health_connect', 'manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT        NOT NULL UNIQUE,
  global_level      INTEGER     NOT NULL DEFAULT 1,
  current_xp        INTEGER     NOT NULL DEFAULT 0,
  xp_to_next_level  INTEGER     NOT NULL DEFAULT 100,
  current_streak    INTEGER     NOT NULL DEFAULT 0,
  longest_streak    INTEGER     NOT NULL DEFAULT 0,
  total_days_active    INTEGER     NOT NULL DEFAULT 0,
  username_changed_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE class_progress (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  life_class       life_class  NOT NULL,
  level            INTEGER     NOT NULL DEFAULT 1,
  current_xp       INTEGER     NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER     NOT NULL DEFAULT 100,
  UNIQUE (user_id, life_class)
);

CREATE TABLE missions (
  id             UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT                NOT NULL,
  description    TEXT,
  life_class     life_class          NOT NULL,
  difficulty     mission_difficulty  NOT NULL,
  type           mission_type        NOT NULL,
  xp_reward      INTEGER             NOT NULL DEFAULT 10,
  verification   verification_type   NOT NULL DEFAULT 'manual',
  required_level INTEGER             NOT NULL DEFAULT 1
);

CREATE TABLE completed_missions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  mission_id   UUID        NOT NULL REFERENCES missions(id)  ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE streaks (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date               DATE    NOT NULL,
  missions_completed INTEGER NOT NULL DEFAULT 0,
  streak_day         INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, date)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_class_progress_user_id     ON class_progress     (user_id);
CREATE INDEX idx_completed_missions_user_id ON completed_missions (user_id);
CREATE INDEX idx_completed_missions_mission ON completed_missions (mission_id);
CREATE INDEX idx_streaks_user_id            ON streaks            (user_id);
CREATE INDEX idx_streaks_date               ON streaks            (date);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks            ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: select own"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: insert own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: update own"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- class_progress
CREATE POLICY "class_progress: select own" ON class_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "class_progress: insert own" ON class_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "class_progress: update own" ON class_progress FOR UPDATE USING (auth.uid() = user_id);

-- missions (catálogo de solo lectura para usuarios autenticados)
CREATE POLICY "missions: read all authenticated" ON missions
  FOR SELECT USING (auth.role() = 'authenticated');

-- completed_missions
CREATE POLICY "completed_missions: select own" ON completed_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "completed_missions: insert own" ON completed_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- streaks
CREATE POLICY "streaks: select own" ON streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streaks: insert own" ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks: update own" ON streaks FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- TRIGGER: crear perfil + class_progress al registrarse
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );

  INSERT INTO class_progress (user_id, life_class) VALUES
    (NEW.id, 'fisico'),
    (NEW.id, 'mental'),
    (NEW.id, 'disciplina');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
