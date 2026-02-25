-- ============================================================
-- Los Tordos Hockey - Seed Data
-- Run AFTER 001-schema.sql
-- ============================================================

-- NOTE: The admin user should be created via Supabase Auth first.
-- After creating the user in Supabase Dashboard > Authentication,
-- copy their UUID and run this:

-- Replace 'YOUR_ADMIN_UUID' with the actual UUID from Supabase Auth
-- INSERT INTO hockey_roles (user_id, role, divisiones, ramas, active) VALUES
--   ('YOUR_ADMIN_UUID', 'director_deportivo', '{}', '{}', true);

-- ── Sample Jugadoras for Testing ──
insert into jugadoras (nombre, apellido, dni, fecha_nacimiento, rama, posicion, socia, derecho_jugadora, cert_medico_estado, cert_medico_vencimiento) values
  ('María', 'González', '40123456', '2007-03-15', 'Competitiva', 'Delantera', true, true, 'vigente', '2026-06-30'),
  ('Lucía', 'Martínez', '41234567', '2008-07-22', 'Competitiva', 'Mediocampista', true, true, 'vigente', '2026-08-15'),
  ('Valentina', 'López', '42345678', '2009-01-10', 'Competitiva', 'Defensa Central', true, true, 'vigente', '2026-05-20'),
  ('Catalina', 'Rodríguez', '43456789', '2010-11-30', 'Competitiva', 'Arquera', true, false, 'pendiente', null),
  ('Sofía', 'Fernández', '44567890', '2011-05-08', 'Competitiva', 'Defensa Lateral', false, true, 'vencido', '2025-12-01'),
  ('Isabella', 'García', '45678901', '2012-09-14', 'Competitiva', 'Volante', true, true, 'vigente', '2026-07-31'),
  ('Emma', 'Pérez', '46789012', '2013-02-28', 'No Competitiva', 'Delantera', true, true, 'vigente', '2026-04-15'),
  ('Martina', 'Sánchez', '47890123', '2014-08-19', 'No Competitiva', 'Mediocampista', false, false, 'pendiente', null),
  ('Olivia', 'Ramírez', '48901234', '2015-06-05', 'Competitiva', 'Defensa Central', true, true, 'vigente', '2026-09-30'),
  ('Mía', 'Torres', '49012345', '2007-12-25', 'Competitiva', 'Delantera', true, true, 'vigente', '2026-03-31');
