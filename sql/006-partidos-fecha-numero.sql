-- Add fecha_numero column to partidos table
-- Represents the match day number (e.g., Fecha 1, Fecha 10)
alter table partidos add column if not exists fecha_numero integer;
