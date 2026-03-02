-- ── Transform LBF from per-game to annual registration model ──

-- 1. Add new columns
alter table lbf add column if not exists ano integer;
alter table lbf add column if not exists entrenadora text;

-- 2. Backfill existing records with year from created_at
update lbf set ano = extract(year from created_at)::int where ano is null;

-- 3. Make ano NOT NULL after backfill
alter table lbf alter column ano set not null;

-- 4. Add unique constraint per year/division/rama
alter table lbf add constraint lbf_ano_division_rama_unique unique (ano, division, rama);

-- 5. Drop old per-game columns (nullable, can remove safely)
alter table lbf drop column if exists fecha_partido;
alter table lbf drop column if exists rival;
alter table lbf drop column if exists sede;
