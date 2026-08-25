CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  mp_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'pending',
  plan_type TEXT DEFAULT 'basic',
  subscription_end_date DATETIME
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 1. Catálogo de Fabricantes
CREATE TABLE IF NOT EXISTS marcas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

-- 2. Tabla Base de Dispositivos
CREATE TABLE IF NOT EXISTS protecciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  marca_id INTEGER NOT NULL,
  modelo TEXT NOT NULL,
  tipo_proteccion TEXT NOT NULL, -- 'PIA', 'MCCB', 'DIF'
  in_amp NUMERIC NOT NULL,
  curva_disparo TEXT,
  polos INTEGER,
  specs_tecnicas JSONB,
  user_id TEXT,
  FOREIGN KEY (marca_id) REFERENCES marcas(id)
);

-- 3. Tabla de Parámetros Operativos (Dependientes de la tensión Ue)
CREATE TABLE IF NOT EXISTS capacidades_corte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proteccion_id INTEGER NOT NULL,
  tension_v NUMERIC NOT NULL,
  icn_ka NUMERIC,
  clase_limitacion INTEGER,
  FOREIGN KEY (proteccion_id) REFERENCES protecciones(id)
);

-- Índices para optimizar
CREATE INDEX IF NOT EXISTS idx_capacidades_tension ON capacidades_corte(proteccion_id, tension_v);