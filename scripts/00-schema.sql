-- ============================================================
-- Schema para infinite-are-better-than-one
-- Proyecto Supabase: wsyyhankjpwhtjkbfhrp
-- ============================================================

-- Tabla principal: cada Gioconda con su metadata
CREATE TABLE IF NOT EXISTS giocondas (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  format TEXT NOT NULL CHECK (format IN ('jpg', 'jpeg', 'png', 'webp')),
  width INT NOT NULL,
  height INT NOT NULL,
  file_size_bytes BIGINT,

  -- Metadata de generación
  prompt TEXT,
  negative_prompt TEXT,
  model_base TEXT,
  model_checkpoint TEXT,
  seed BIGINT,
  steps INT,
  cfg_scale FLOAT,
  sampler TEXT,

  -- LoRAs con pesos
  loras JSONB,                           -- [{"name": "Quinquela_AI_v2", "weight": 0.9}, ...]
  primary_style TEXT,                    -- nombre del LoRA con mayor peso
  is_mixed BOOLEAN DEFAULT FALSE,        -- true si >1 LoRA con peso > 0.1

  -- Coords calculadas para el mapa 3D Interstellar
  coord_x FLOAT,
  coord_y FLOAT,
  coord_z FLOAT,

  -- Tracking
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,

  -- Origen
  source TEXT NOT NULL DEFAULT 'batch_original',  -- 'batch_original' | 'ai_generated_live'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_giocondas_slug ON giocondas(slug);
CREATE INDEX idx_giocondas_primary_style ON giocondas(primary_style);
CREATE INDEX idx_giocondas_is_mixed ON giocondas(is_mixed);
CREATE INDEX idx_giocondas_loras_gin ON giocondas USING GIN (loras);
CREATE INDEX idx_giocondas_source ON giocondas(source);

-- Tracking de descargas
CREATE TABLE IF NOT EXISTS downloads (
  id SERIAL PRIMARY KEY,
  gioconda_id INT NOT NULL REFERENCES giocondas(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX idx_downloads_gioconda_id ON downloads(gioconda_id);
CREATE INDEX idx_downloads_downloaded_at ON downloads(downloaded_at DESC);

-- Trigger: incrementar download_count al insertar en downloads
CREATE OR REPLACE FUNCTION increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE giocondas SET download_count = download_count + 1 WHERE id = NEW.gioconda_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_download_count
AFTER INSERT ON downloads
FOR EACH ROW
EXECUTE FUNCTION increment_download_count();

-- Configuración del sitio (single row)
CREATE TABLE IF NOT EXISTS site_config (
  id INT PRIMARY KEY DEFAULT 1,
  cycle_duration_seconds INT NOT NULL DEFAULT 60,
  total_giocondas INT NOT NULL DEFAULT 0,
  premiere_pueyrredon_year INT DEFAULT 2025,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO site_config (id, cycle_duration_seconds) VALUES (1, 60)
ON CONFLICT (id) DO NOTHING;

-- Tabla de LoRAs / estilos disponibles (referencia)
CREATE TABLE IF NOT EXISTS styles (
  name TEXT PRIMARY KEY,               -- 'Quinquela_AI_v2'
  artist_full_name TEXT,               -- 'Benito Quinquela Martín'
  artist_slug TEXT UNIQUE,             -- 'quinquela'
  description TEXT,
  -- Posición del ancla en la esfera Fibonacci (punto de atracción gravitacional)
  anchor_x FLOAT,
  anchor_y FLOAT,
  anchor_z FLOAT,
  color_hex TEXT,                      -- color representativo en el mapa 3D
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed de los 12 estilos entrenados (las anchor_coords se calculan después con Fibonacci sphere)
INSERT INTO styles (name, artist_full_name, artist_slug, description) VALUES
  ('Quinquela_AI_v2',     'Benito Quinquela Martín',       'quinquela',          'Maestro del arte portuario argentino, La Boca'),
  ('XulSolar_AI_SD15',    'Xul Solar',                      'xul-solar',          'Surrealismo místico argentino'),
  ('Berni_AI',            'Antonio Berni',                  'berni',              'Realismo social argentino'),
  ('Forner_AI',           'Raquel Forner',                  'forner',             'Expresionismo argentino, series apocalípticas'),
  ('Fini_AI',             'Leonor Fini',                    'fini',               'Surrealismo argentino-italiano, figura femenina'),
  ('DeLaCarcova_AI',      'Ernesto de la Cárcova',          'de-la-carcova',      'Realismo académico argentino'),
  ('LeParc_AI',           'Julio Le Parc',                  'le-parc',            'Arte óptico y cinético'),
  ('Minujin_AI_Flux',     'Marta Minujín',                  'minujin',            'Arte conceptual e instalativo'),
  ('Casares_AI',          'Casares',                        'casares',            'Estilo entrenado específico'),
  ('ElEternauta_AI',      'El Eternauta (Oesterheld/Solano López)', 'el-eternauta', 'Cómic argentino icónico'),
  ('DisenoIndigena_AI',   'Diseño Indígena Argentino',      'diseno-indigena',    'Patrones y motivos originarios'),
  ('NoMa_AI',             'NoMa Studio',                    'noma',               'Estilo propio del estudio')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE giocondas ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Lectura pública para mostrar la obra
CREATE POLICY "giocondas_public_read" ON giocondas FOR SELECT USING (true);
CREATE POLICY "styles_public_read" ON styles FOR SELECT USING (true);
CREATE POLICY "site_config_public_read" ON site_config FOR SELECT USING (true);

-- Insert de download desde cualquier cliente (tracking anónimo)
CREATE POLICY "downloads_public_insert" ON downloads FOR INSERT WITH CHECK (true);

-- Secret key (service_role) bypassa todas estas políticas, como es esperado.

-- ============================================================
-- Función helper: registrar descarga y devolver URL
-- (la usaremos desde la API de Next.js)
-- ============================================================

CREATE OR REPLACE FUNCTION register_download(
  p_gioconda_id INT,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
)
RETURNS TABLE(id INT, filename TEXT) AS $$
BEGIN
  INSERT INTO downloads (gioconda_id, ip_hash, user_agent, referrer)
  VALUES (p_gioconda_id, p_ip_hash, p_user_agent, p_referrer);

  RETURN QUERY
  SELECT g.id, g.filename
  FROM giocondas g
  WHERE g.id = p_gioconda_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
