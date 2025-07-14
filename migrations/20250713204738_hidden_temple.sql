/*
  # Sistema Taker - Schema Completo

  1. Nuevas Tablas
    - `users` - Perfiles de cazadores con stats y progresión
    - `workouts` - Registro de entrenamientos con XP
    - `daily_quests` - Misiones diarias automáticas
    - `boss_fights` - Desafíos a largo plazo (Boss Raids)
    - `achievements` - Sistema de logros y títulos
    - `workout_history` - Historial detallado de entrenamientos

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas para que usuarios solo accedan a sus datos
    - Triggers para actualización automática de timestamps

  3. Funcionalidades
    - Sistema de XP y niveles automático
    - Generación automática de misiones diarias
    - Cálculo de progreso en Boss Fights
    - Sistema de logros desbloqueables
*/

-- Tabla de usuarios/cazadores
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  level integer DEFAULT 1,
  total_xp integer DEFAULT 0,
  current_xp integer DEFAULT 0,
  xp_to_next_level integer DEFAULT 100,
  str integer DEFAULT 1,
  agi integer DEFAULT 1,
  int integer DEFAULT 1,
  vit integer DEFAULT 1,
  cha integer DEFAULT 1,
  available_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  max_streak integer DEFAULT 0,
  total_workouts integer DEFAULT 0,
  avatar_url text,
  title text DEFAULT 'Cazador Novato',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de entrenamientos
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  type text NOT NULL,
  intensity text CHECK (intensity IN ('low', 'medium', 'high', 'extreme')) DEFAULT 'medium',
  duration integer NOT NULL, -- en minutos
  xp_gained integer NOT NULL,
  notes text DEFAULT '',
  exercises jsonb DEFAULT '[]', -- Array de ejercicios realizados
  created_at timestamptz DEFAULT now()
);

-- Tabla de misiones diarias
CREATE TABLE IF NOT EXISTS daily_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  quest_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  xp_reward integer DEFAULT 5,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Tabla de Boss Fights (desafíos)
CREATE TABLE IF NOT EXISTS boss_fights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  boss_type text DEFAULT 'challenge', -- challenge, streak, milestone
  target_value integer NOT NULL,
  current_progress integer DEFAULT 0,
  reward_type text NOT NULL, -- xp, stat_boost, title, special
  reward_description text NOT NULL,
  reward_stats jsonb DEFAULT '{}', -- {str: 2, agi: 1}
  completed boolean DEFAULT false,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme', 'legendary')) DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Tabla de logros
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  achievement_key text NOT NULL, -- first_workout, level_10, etc
  title text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '🏆',
  rarity text CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- Tabla de historial de stats
CREATE TABLE IF NOT EXISTS stat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stat_type text NOT NULL, -- str, agi, int, vit, cha
  old_value integer NOT NULL,
  new_value integer NOT NULL,
  reason text NOT NULL, -- level_up, boss_reward, etc
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_fights ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_history ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para users
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Políticas para workouts
CREATE POLICY "Users can manage own workouts"
  ON workouts
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Políticas para daily_quests
CREATE POLICY "Users can manage own daily quests"
  ON daily_quests
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Políticas para boss_fights
CREATE POLICY "Users can manage own boss fights"
  ON boss_fights
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Políticas para achievements
CREATE POLICY "Users can read own achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can insert achievements"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Políticas para stat_history
CREATE POLICY "Users can read own stat history"
  ON stat_history
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can insert stat history"
  ON stat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para generar misiones diarias automáticamente
CREATE OR REPLACE FUNCTION generate_daily_quests(user_uuid uuid, quest_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  quest_templates jsonb := '[
    {"title": "💧 Hidratación Perfecta", "description": "Bebe al menos 2L de agua", "xp_reward": 5, "quest_type": "hydration"},
    {"title": "🏃 Entrenamiento Diario", "description": "Completa al menos 20 minutos de ejercicio", "xp_reward": 15, "quest_type": "workout"},
    {"title": "😴 Descanso del Guerrero", "description": "Duerme al menos 7 horas", "xp_reward": 10, "quest_type": "sleep"},
    {"title": "🥗 Nutrición de Cazador", "description": "Come al menos 3 comidas balanceadas", "xp_reward": 8, "quest_type": "nutrition"},
    {"title": "📚 Desarrollo Mental", "description": "Lee o estudia por 30 minutos", "xp_reward": 6, "quest_type": "mental"},
    {"title": "🧘 Meditación del Alma", "description": "Medita o practica mindfulness por 10 minutos", "xp_reward": 7, "quest_type": "meditation"}
  ]'::jsonb;
  quest jsonb;
  existing_count integer;
BEGIN
  -- Verificar si ya existen misiones para esta fecha
  SELECT COUNT(*) INTO existing_count
  FROM daily_quests
  WHERE user_id = user_uuid AND date = quest_date;
  
  -- Si no hay misiones, crear 4 aleatorias
  IF existing_count = 0 THEN
    FOR quest IN SELECT * FROM jsonb_array_elements(quest_templates) ORDER BY random() LIMIT 4
    LOOP
      INSERT INTO daily_quests (user_id, date, quest_type, title, description, xp_reward)
      VALUES (
        user_uuid,
        quest_date,
        quest->>'quest_type',
        quest->>'title',
        quest->>'description',
        (quest->>'xp_reward')::integer
      );
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear Boss Fights iniciales
CREATE OR REPLACE FUNCTION create_initial_boss_fights(user_uuid uuid)
RETURNS void AS $$
DECLARE
  existing_count integer;
BEGIN
  -- Verificar si ya existen boss fights
  SELECT COUNT(*) INTO existing_count
  FROM boss_fights
  WHERE user_id = user_uuid AND completed = false;
  
  -- Si no hay boss fights activos, crear los iniciales
  IF existing_count = 0 THEN
    INSERT INTO boss_fights (user_id, title, description, target_value, reward_type, reward_description, reward_stats, difficulty) VALUES
    (user_uuid, '🔥 Racha de Fuego', 'Entrena 7 días consecutivos sin fallar', 7, 'stat_boost', '+2 STR, +1 VIT, Título: "Llama Ardiente"', '{"str": 2, "vit": 1}', 'medium'),
    (user_uuid, '⚡ Velocista Sombra', 'Completa 10 entrenamientos de cardio', 10, 'stat_boost', '+2 AGI, Título: "Corredor Umbral"', '{"agi": 2}', 'medium'),
    (user_uuid, '💪 Fuerza Absoluta', 'Alcanza el nivel 10', 10, 'stat_boost', '+3 STR, +2 VIT, Título: "Cazador de Élite"', '{"str": 3, "vit": 2}', 'hard'),
    (user_uuid, '🧠 Maestro Estratega', 'Completa 50 misiones diarias', 50, 'stat_boost', '+3 INT, +1 CHA, Título: "Estratega Supremo"', '{"int": 3, "cha": 1}', 'hard'),
    (user_uuid, '👑 Cazador Legendario', 'Alcanza el nivel 25', 25, 'special', '+5 a todas las stats, Título: "Cazador Rango S"', '{"str": 5, "agi": 5, "int": 5, "vit": 5, "cha": 5}', 'legendary');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;