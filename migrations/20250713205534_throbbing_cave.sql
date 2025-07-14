/*
 # SYSTEM REAPER - Schema Completo

 1. Nuevas Tablas
   - `user_profiles` - Perfiles completos de cazadores
   - `daily_missions` - Misiones diarias obligatorias estilo Solo Leveling
   - `workouts` - Registro detallado de entrenamientos
   - `exercises` - Base de datos de ejercicios disponibles
   - `workout_exercises` - Relación entre entrenamientos y ejercicios
   - `nutrition_logs` - Registro de comidas y nutrición
   - `hydration_logs` - Registro de consumo de agua
   - `boss_raids` - Desafíos épicos a largo plazo
   - `achievements` - Sistema de logros y títulos
   - `voice_commands` - Historial de comandos de voz

 2. Seguridad
   - RLS habilitado en todas las tablas
   - Políticas para que usuarios solo accedan a sus datos

 3. Funcionalidades Avanzadas
   - Sistema de XP y niveles automático
   - Misiones diarias obligatorias con penalizaciones
   - Contador de ejercicios en tiempo real
   - Sistema de nutrición e hidratación
   - Comandos de voz integrados
*/

-- Tabla de perfiles de usuario completos
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  full_name text,
  phone text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  height_cm integer,
  weight_kg decimal(5,2),
  fitness_level text CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
  
  -- Stats del sistema
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
  
  -- Progreso y rachas
  current_streak integer DEFAULT 0,
  max_streak integer DEFAULT 0,
  total_workouts integer DEFAULT 0,
  total_missions_completed integer DEFAULT 0,
  
  -- Personalización
  avatar_url text,
  title text DEFAULT 'Cazador Novato',
  rank text DEFAULT 'E',
  
  -- Configuraciones
  voice_enabled boolean DEFAULT true,
  notifications_enabled boolean DEFAULT true,
  daily_mission_time time DEFAULT '06:00:00',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de misiones diarias obligatorias
CREATE TABLE IF NOT EXISTS daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  mission_type text NOT NULL, -- 'daily_required', 'bonus', 'special'
  
  -- Misión específica
  title text NOT NULL,
  description text NOT NULL,
  exercise_type text, -- 'pushups', 'situps', 'squats', 'running', 'water', 'nutrition'
  target_value integer NOT NULL, -- 100 flexiones, 10km, 2L agua, etc
  current_progress integer DEFAULT 0,
  unit text DEFAULT 'reps', -- 'reps', 'km', 'liters', 'minutes'
  
  -- Recompensas y penalizaciones
  xp_reward integer DEFAULT 10,
  bonus_xp integer DEFAULT 0, -- XP extra por completar todo
  penalty_xp integer DEFAULT -5, -- Penalización por no completar
  
  -- Estado
  completed boolean DEFAULT false,
  completed_at timestamptz,
  penalty_applied boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Tabla de ejercicios disponibles
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY AS DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL, -- 'strength', 'cardio', 'flexibility', 'core'
  muscle_groups text[] DEFAULT '{}',
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  equipment_needed text[] DEFAULT '{}',
  instructions text,
  tips text,
  calories_per_rep decimal(4,2) DEFAULT 0.5,
  xp_multiplier decimal(3,2) DEFAULT 1.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabla de entrenamientos
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  name text NOT NULL,
  type text NOT NULL,
  intensity text CHECK (intensity IN ('low', 'medium', 'high', 'extreme')) DEFAULT 'medium',
  duration_minutes integer NOT NULL,
  calories_burned integer DEFAULT 0,
  xp_gained integer NOT NULL,
  notes text DEFAULT '',
  
  -- Métricas adicionales
  heart_rate_avg integer,
  heart_rate_max integer,
  perceived_exertion integer CHECK (perceived_exertion BETWEEN 1 AND 10),
  
  -- Estado
  completed boolean DEFAULT true,
  voice_guided boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Tabla de ejercicios en entrenamientos
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES exercises(id) NOT NULL,
  sets integer DEFAULT 1,
  reps integer DEFAULT 0,
  weight_kg decimal(5,2),
  distance_km decimal(6,3),
  duration_seconds integer,
  rest_seconds integer DEFAULT 60,
  notes text,
  completed boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabla de registro nutricional
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  food_name text NOT NULL,
  quantity decimal(6,2) DEFAULT 1,
  unit text DEFAULT 'portion',
  calories integer DEFAULT 0,
  protein_g decimal(5,2) DEFAULT 0,
  carbs_g decimal(5,2) DEFAULT 0,
  fat_g decimal(5,2) DEFAULT 0,
  is_healthy boolean DEFAULT true,
  xp_bonus integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabla de hidratación
CREATE TABLE IF NOT EXISTS hydration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  amount_ml integer NOT NULL,
  drink_type text DEFAULT 'water',
  time_consumed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tabla de Boss Raids
CREATE TABLE IF NOT EXISTS boss_raids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  boss_type text DEFAULT 'challenge',
  difficulty text CHECK (difficulty IN ('E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS')) DEFAULT 'E',
  
  -- Objetivos
  target_type text NOT NULL,
  target_value integer NOT NULL,
  current_progress integer DEFAULT 0,
  
  -- Recompensas
  reward_type text NOT NULL,
  reward_description text NOT NULL,
  reward_stats jsonb DEFAULT '{}',
  reward_xp integer DEFAULT 0,
  
  -- Estado
  completed boolean DEFAULT false,
  unlocked_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Tabla de logros
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_key text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '🏆',
  rarity text CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')) DEFAULT 'common',
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- Tabla de comandos de voz
CREATE TABLE IF NOT EXISTS voice_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  command_text text NOT NULL,
  command_type text NOT NULL, -- 'exercise_count', 'mission_update', 'workout_start', 'nutrition_log'
  recognized_intent text,
  parameters jsonb DEFAULT '{}',
  executed_successfully boolean DEFAULT false,
  response_text text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_raids ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can manage own profile"
  ON user_profiles FOR ALL TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can manage own data"
  ON daily_missions FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own data"
  ON workouts FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own data"
  ON workout_exercises FOR ALL TO authenticated
  USING (workout_id IN (SELECT id FROM workouts WHERE user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())));

CREATE POLICY "Users can manage own data"
  ON nutrition_logs FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own data"
  ON hydration_logs FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own data"
  ON boss_raids FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own data"
  ON achievements FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own data"
  ON voice_commands FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Everyone can read exercises"
  ON exercises FOR SELECT TO authenticated
  USING (true);

-- Función para generar misiones diarias obligatorias
CREATE OR REPLACE FUNCTION generate_daily_missions(user_uuid uuid, mission_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  existing_count integer;
  user_level integer;
  user_fitness text;
  
  -- Definir plantillas de misiones por dificultad/nivel
  mission_templates jsonb := '[
      -- MISIONES OBLIGATORIAS - Nivel Principiante (Beginner/Nivel 1-4)
      {"level_min": 1, "fitness": "beginner", "title": "💪 50 Flexiones", "description": "Realiza 50 flexiones sin parar (puedes hacer series)", "exercise_type": "pushups", "target_value": 50, "unit": "reps", "xp_reward": 15, "penalty_xp": -8, "mission_type_template": "daily_required"},
      {"level_min": 1, "fitness": "beginner", "title": "🔥 50 Abdominales", "description": "Completa 50 abdominales para fortalecer tu core", "exercise_type": "situps", "target_value": 50, "unit": "reps", "xp_reward": 15, "penalty_xp": -8, "mission_type_template": "daily_required"},
      {"level_min": 1, "fitness": "beginner", "title": "🦵 50 Sentadillas", "description": "Ejecuta 50 sentadillas perfectas", "exercise_type": "squats", "target_value": 50, "unit": "reps", "xp_reward": 15, "penalty_xp": -8, "mission_type_template": "daily_required"},
      {"level_min": 1, "fitness": "beginner", "title": "🏃 Correr 3km", "description": "Completa una carrera de 3 kilómetros", "exercise_type": "running", "target_value": 3, "unit": "km", "xp_reward": 20, "penalty_xp": -10, "mission_type_template": "daily_required"},

      -- MISIONES OBLIGATORIAS - Nivel Intermedio (Intermediate/Nivel 5-14)
      {"level_min": 5, "fitness": "intermediate", "title": "💪 100 Flexiones", "description": "Realiza 100 flexiones sin parar (puedes hacer series)", "exercise_type": "pushups", "target_value": 100, "unit": "reps", "xp_reward": 20, "penalty_xp": -10, "mission_type_template": "daily_required"},
      {"level_min": 5, "fitness": "intermediate", "title": "🔥 100 Abdominales", "description": "Completa 100 abdominales para fortalecer tu core", "exercise_type": "situps", "target_value": 100, "unit": "reps", "xp_reward": 20, "penalty_xp": -10, "mission_type_template": "daily_required"},
      {"level_min": 5, "fitness": "intermediate", "title": "🦵 100 Sentadillas", "description": "Ejecuta 100 sentadillas perfectas", "exercise_type": "squats", "target_value": 100, "unit": "reps", "xp_reward": 20, "penalty_xp": -10, "mission_type_template": "daily_required"},
      {"level_min": 5, "fitness": "intermediate", "title": "🏃 Correr 5km", "description": "Completa una carrera de 5 kilómetros", "exercise_type": "running", "target_value": 5, "unit": "km", "xp_reward": 25, "penalty_xp": -12, "mission_type_template": "daily_required"},
      
      -- MISIONES OBLIGATORIAS - Nivel Avanzado (Advanced/Nivel 15+)
      {"level_min": 15, "fitness": "advanced", "title": "💪 150 Flexiones", "description": "Realiza 150 flexiones sin parar (puedes hacer series)", "exercise_type": "pushups", "target_value": 150, "unit": "reps", "xp_reward": 25, "penalty_xp": -12, "mission_type_template": "daily_required"},
      {"level_min": 15, "fitness": "advanced", "title": "🔥 150 Abdominales", "description": "Completa 150 abdominales para fortalecer tu core", "exercise_type": "situps", "target_value": 150, "unit": "reps", "xp_reward": 25, "penalty_xp": -12, "mission_type_template": "daily_required"},
      {"level_min": 15, "fitness": "advanced", "title": "🦵 150 Sentadillas", "description": "Ejecuta 150 sentadillas perfectas", "exercise_type": "squats", "target_value": 150, "unit": "reps", "xp_reward": 25, "penalty_xp": -12, "mission_type_template": "daily_required"},
      {"level_min": 15, "fitness": "advanced", "title": "🏃 Correr 10km", "description": "Completa una carrera de 10 kilómetros", "exercise_type": "running", "target_value": 10, "unit": "km", "xp_reward": 30, "penalty_xp": -15, "mission_type_template": "daily_required"}
  ]'::jsonb;

  selected_missions_for_level jsonb;
  mission jsonb;

BEGIN
  -- Verificar si ya existen misiones para esta fecha
  SELECT COUNT(*) INTO existing_count
  FROM daily_missions
  WHERE user_id = user_uuid AND date = mission_date;
  
  -- Obtener nivel y fitness del usuario
  SELECT level, fitness_level INTO user_level, user_fitness
  FROM user_profiles WHERE id = user_uuid;
  
  -- Si no hay misiones, crear las 4 obligatorias + extras
  IF existing_count = 0 THEN
    -- Seleccionar misiones obligatorias según el nivel/fitness del usuario
    -- Prioriza por fitness_level, luego por nivel. Si no encuentra específico, toma un valor por defecto.
    SELECT jsonb_agg(m) INTO selected_missions_for_level
    FROM jsonb_array_elements(mission_templates) m
    WHERE (
        (m->>'fitness')::text = user_fitness AND (m->>'level_min')::integer <= user_level
    )
    AND (m->>'mission_type_template')::text = 'daily_required'; -- Asegurar que solo seleccionamos las obligatorias

    -- Si no se encontraron misiones específicas para el nivel/fitness (ej. 'expert' no tiene plantillas aquí), usar las de 'advanced' o 'intermediate' como fallback
    IF selected_missions_for_level IS NULL OR jsonb_array_length(selected_missions_for_level) = 0 THEN
        -- Fallback a 'advanced' si el usuario es 'expert' o nivel muy alto sin plantillas específicas
        SELECT jsonb_agg(m) INTO selected_missions_for_level
        FROM jsonb_array_elements(mission_templates) m
        WHERE (m->>'fitness')::text = 'advanced'
        AND (m->>'mission_type_template')::text = 'daily_required';

        -- Fallback a 'intermediate' si aún no hay (para niveles muy bajos o errores de configuración)
        IF selected_missions_for_level IS NULL OR jsonb_array_length(selected_missions_for_level) = 0 THEN
            SELECT jsonb_agg(m) INTO selected_missions_for_level
            FROM jsonb_array_elements(mission_templates) m
            WHERE (m->>'fitness')::text = 'intermediate'
            AND (m->>'mission_type_template')::text = 'daily_required';
        END IF;
    END IF;

    -- Insertar las misiones obligatorias seleccionadas (deberían ser 4)
    FOR mission IN SELECT * FROM jsonb_array_elements(selected_missions_for_level)
    LOOP
      INSERT INTO daily_missions (user_id, date, mission_type, title, description, exercise_type, target_value, unit, xp_reward, penalty_xp)
      VALUES (
        user_uuid,
        mission_date,
        (mission->>'mission_type_template')::text, -- Usar el tipo de la plantilla
        mission->>'title',
        mission->>'description',
        mission->>'exercise_type',
        (mission->>'target_value')::integer,
        mission->>'unit',
        (mission->>'xp_reward')::integer,
        (mission->>'penalty_xp')::integer
      );
    END LOOP;
    
    -- MISIONES ADICIONALES SEGÚN NIVEL
    IF user_level >= 5 THEN
      INSERT INTO daily_missions (user_id, date, mission_type, title, description, exercise_type, target_value, unit, xp_reward) VALUES
      (user_uuid, mission_date, 'bonus', '💧 Hidratación Perfecta', 'Bebe al menos 3 litros de agua', 'water', 3000, 'ml', 10),
      (user_uuid, mission_date, 'bonus', '🥗 Nutrición de Cazador', 'Consume 5 comidas saludables', 'nutrition', 5, 'meals', 15);
    ELSE
      INSERT INTO daily_missions (user_id, date, mission_type, title, description, exercise_type, target_value, unit, xp_reward) VALUES
      (user_uuid, mission_date, 'bonus', '💧 Hidratación Básica', 'Bebe al menos 2 litros de agua', 'water', 2000, 'ml', 8),
      (user_uuid, mission_date, 'bonus', '🥗 Alimentación Sana', 'Consume 3 comidas saludables', 'nutrition', 3, 'meals', 10);
    END IF;
    
    -- MISIÓN ESPECIAL SEMANAL
    IF EXTRACT(DOW FROM mission_date) = 0 THEN -- Domingo
      INSERT INTO daily_missions (user_id, date, mission_type, title, description, exercise_type, target_value, unit, xp_reward) VALUES
      (user_uuid, mission_date, 'special', '👑 Desafío Dominical', 'Entrena por 90 minutos consecutivos', 'workout', 90, 'minutes', 50);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear Boss Raids iniciales
CREATE OR REPLACE FUNCTION create_initial_boss_raids(user_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO boss_raids (user_id, title, description, difficulty, target_type, target_value, reward_type, reward_description, reward_stats, reward_xp) VALUES
  (user_uuid, '🔥 Racha de Hierro', 'Completa misiones diarias por 7 días consecutivos', 'D', 'streak', 7, 'stat_boost', '+3 STR, +2 VIT, Título: "Guerrero de Hierro"', '{"str": 3, "vit": 2}', 100),
  (user_uuid, '⚡ Velocista Sombra', 'Corre 50km en total', 'C', 'distance', 50, 'stat_boost', '+4 AGI, Título: "Corredor Umbral"', '{"agi": 4}', 150),
  (user_uuid, '💪 Fuerza Absoluta', 'Realiza 1000 flexiones en total', 'B', 'exercise_total', 1000, 'stat_boost', '+5 STR, +3 VIT', '{"str": 5, "vit": 3}', 200),
  (user_uuid, '🧠 Maestro Estratega', 'Alcanza el nivel 15', 'A', 'level', 15, 'rank_up', 'Ascender a Rango C + 5 puntos de stat', '{"str": 1, "agi": 1, "int": 1, "vit": 1, "cha": 1}', 300),
  (user_uuid, '👑 Cazador Legendario', 'Completa 100 entrenamientos', 'S', 'workouts', 100, 'special', 'Rango B + Título: "Cazador de Élite" + 10 puntos', '{"str": 2, "agi": 2, "int": 2, "vit": 2, "cha": 2}', 500);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insertar ejercicios base
INSERT INTO exercises (name, category, muscle_groups, difficulty, equipment_needed, instructions, calories_per_rep, xp_multiplier) VALUES
('Flexiones', 'strength', '{"chest", "arms", "core"}', 'beginner', '{"none"}', 'Posición de plancha, baja el pecho hasta casi tocar el suelo, empuja hacia arriba', 0.5, 1.0),
('Flexiones Diamante', 'strength', '{"chest", "triceps", "core"}', 'intermediate', '{"none"}', 'Flexiones con las manos formando un diamante', 0.7, 1.3),
('Flexiones Archer', 'strength', '{"chest", "arms", "core"}', 'advanced', '{"none"}', 'Flexiones alternando el peso hacia un lado', 1.0, 1.8),
('Abdominales', 'core', '{"abs", "core"}', 'beginner', '{"none"}', 'Acostado, manos detrás de la cabeza, sube el torso hacia las rodillas', 0.3, 1.0),
('Abdominales Bicicleta', 'core', '{"abs", "obliques"}', 'intermediate', '{"none"}', 'Alterna codos con rodillas opuestas', 0.5, 1.2),
('Plancha', 'core', '{"abs", "core", "shoulders"}', 'intermediate', '{"none"}', 'Mantén posición de flexión sin movimiento', 0.8, 1.5),
('Sentadillas', 'strength', '{"legs", "glutes", "core"}', 'beginner', '{"none"}', 'Pies separados, baja como si te sentaras, mantén la espalda recta', 0.6, 1.0),
('Sentadillas Jump', 'cardio', '{"legs", "glutes", "core"}', 'intermediate', '{"none"}', 'Sentadilla normal pero salta al subir', 1.0, 1.4),
('Burpees', 'cardio', '{"full_body"}', 'advanced', '{"none"}', 'Flexión + salto + sentadilla en un movimiento', 1.5, 2.0),
('Mountain Climbers', 'cardio', '{"core", "legs", "arms"}', 'intermediate', '{"none"}', 'Posición de plancha, alterna rodillas al pecho rápidamente', 1.2, 1.6);