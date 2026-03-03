-- ============================================================
-- 009: Fix hockey_roles CHECK constraint
-- Adds missing roles: coordinador_pf, desarrollo_motor,
--   desarrollo_tecnico, responsable_gym
-- Run in Supabase SQL Editor BEFORE 010-crear-usuarios
-- ============================================================

ALTER TABLE hockey_roles DROP CONSTRAINT hockey_roles_role_check;

ALTER TABLE hockey_roles ADD CONSTRAINT hockey_roles_role_check
  CHECK (role IN (
    'director_deportivo',
    'directora_hockey',
    'coordinador_pf',
    'entrenador',
    'pf',
    'desarrollo_motor',
    'desarrollo_tecnico',
    'responsable_gym',
    'monitora'
  ));
