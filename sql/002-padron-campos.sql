-- Migración: Campos faltantes del padrón (PDR v1 sección 4.1)
-- Ejecutar en Supabase SQL Editor

-- 1. Nuevas columnas
ALTER TABLE jugadoras
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'activa',
  ADD COLUMN IF NOT EXISTS fecha_alta date,
  ADD COLUMN IF NOT EXISTS fecha_baja date,
  ADD COLUMN IF NOT EXISTS motivo_baja text,
  ADD COLUMN IF NOT EXISTS temporada text DEFAULT '2026',
  ADD COLUMN IF NOT EXISTS contacto_tutor_nombre text,
  ADD COLUMN IF NOT EXISTS contacto_tutor_telefono text,
  ADD COLUMN IF NOT EXISTS contacto_tutor_email text,
  ADD COLUMN IF NOT EXISTS departamento text;

-- 2. Migrar datos existentes
UPDATE jugadoras SET estado = 'baja' WHERE activa = false AND estado = 'activa';
UPDATE jugadoras SET fecha_alta = created_at::date WHERE fecha_alta IS NULL;

-- 3. Constraint: motivo_baja obligatorio cuando estado = baja
-- (se valida en la app, no como constraint DB para flexibilidad)

-- 4. Índice para filtros por estado y temporada
CREATE INDEX IF NOT EXISTS idx_jugadoras_estado ON jugadoras(estado);
CREATE INDEX IF NOT EXISTS idx_jugadoras_temporada ON jugadoras(temporada);
CREATE INDEX IF NOT EXISTS idx_jugadoras_departamento ON jugadoras(departamento);
