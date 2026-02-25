-- ============================================================
-- Los Tordos Hockey - Schema v1
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Profiles (auto-created on auth signup) ──
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update_own" on profiles for update to authenticated using (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Hockey Roles ──
create table if not exists hockey_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('director_deportivo','directora_hockey','entrenador','pf','monitora')),
  divisiones text[] default '{}',
  ramas text[] default '{}',
  active boolean default true,
  created_at timestamptz default now()
);

alter table hockey_roles enable row level security;
create policy "hockey_roles_select" on hockey_roles for select to authenticated using (true);
create policy "hockey_roles_insert" on hockey_roles for insert to authenticated with check (true);
create policy "hockey_roles_update" on hockey_roles for update to authenticated using (true);
create policy "hockey_roles_delete" on hockey_roles for delete to authenticated using (true);

create index idx_hockey_roles_user on hockey_roles(user_id);
create index idx_hockey_roles_role on hockey_roles(role);

-- ── Jugadoras (Padrón) ──
create table if not exists jugadoras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  dni text not null,
  fecha_nacimiento date not null,
  division_efectiva text, -- auto-calculated by trigger
  division_manual text,   -- manual override
  rama text not null default 'A' check (rama in ('A','B','C','D','E')),
  posicion text,
  email text,
  telefono text,
  telefono_emergencia text,
  contacto_emergencia text,
  direccion text,
  foto_url text,
  socia boolean default false,
  derecho_jugadora boolean default false,
  cert_medico_estado text default 'pendiente' check (cert_medico_estado in ('vigente','vencido','pendiente')),
  cert_medico_vencimiento date,
  obra_social text,
  grupo_sanguineo text,
  observaciones text,
  activa boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table jugadoras enable row level security;
create policy "jugadoras_select" on jugadoras for select to authenticated using (true);
create policy "jugadoras_insert" on jugadoras for insert to authenticated with check (true);
create policy "jugadoras_update" on jugadoras for update to authenticated using (true);
create policy "jugadoras_delete" on jugadoras for delete to authenticated using (true);

create unique index idx_jugadoras_dni on jugadoras(dni);
create index idx_jugadoras_division on jugadoras(division_efectiva);
create index idx_jugadoras_rama on jugadoras(rama);
create index idx_jugadoras_activa on jugadoras(activa);
create index idx_jugadoras_apellido on jugadoras(apellido);

-- Trigger: auto-calculate division from fecha_nacimiento
create or replace function calc_division()
returns trigger as $$
declare
  birth_year int;
  div text;
begin
  birth_year := extract(year from new.fecha_nacimiento);

  -- If manual override is set, use it
  if new.division_manual is not null then
    new.division_efectiva := new.division_manual;
    return new;
  end if;

  -- Auto-calculate based on birth year (2025 season)
  div := case
    when birth_year >= 2019 then 'Escuelita'
    when birth_year between 2017 and 2018 then 'Mini'
    when birth_year between 2015 and 2016 then 'Pre-mini'
    when birth_year = 2014 then 'Menores B'
    when birth_year = 2013 then 'Menores A'
    when birth_year = 2012 then 'Cadetes B'
    when birth_year = 2011 then 'Cadetes A'
    when birth_year between 2009 and 2010 then 'Juveniles B'
    when birth_year between 2007 and 2008 then 'Juveniles A'
    when birth_year between 2004 and 2006 then 'Sub 21'
    else 'Primera'
  end;

  new.division_efectiva := div;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_calc_division on jugadoras;
create trigger trg_calc_division
  before insert or update of fecha_nacimiento, division_manual on jugadoras
  for each row execute function calc_division();

-- Trigger: auto-update cert_medico_estado if vencimiento < today
create or replace function check_cert_medico()
returns trigger as $$
begin
  if new.cert_medico_vencimiento is not null then
    if new.cert_medico_vencimiento < current_date then
      new.cert_medico_estado := 'vencido';
    elsif new.cert_medico_estado = 'vencido' then
      new.cert_medico_estado := 'vigente';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_check_cert_medico on jugadoras;
create trigger trg_check_cert_medico
  before insert or update of cert_medico_vencimiento on jugadoras
  for each row execute function check_cert_medico();

-- Trigger: auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_updated_at_jugadoras on jugadoras;
create trigger trg_updated_at_jugadoras
  before update on jugadoras
  for each row execute function update_updated_at();

-- ── Jugadoras Historial (Audit) ──
create table if not exists jugadoras_historial (
  id uuid primary key default gen_random_uuid(),
  jugadora_id uuid not null references jugadoras(id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

alter table jugadoras_historial enable row level security;
create policy "jh_select" on jugadoras_historial for select to authenticated using (true);
create policy "jh_insert" on jugadoras_historial for insert to authenticated with check (true);

create index idx_jh_jugadora on jugadoras_historial(jugadora_id);

-- ── Lista de Buena Fe ──
create table if not exists lbf (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  division text not null,
  rama text not null default 'A',
  estado text not null default 'borrador' check (estado in ('borrador','pendiente','aprobada','rechazada')),
  fecha_partido date,
  rival text,
  sede text,
  notas text,
  creado_por uuid not null references profiles(id),
  aprobado_por uuid references profiles(id),
  aprobado_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table lbf enable row level security;
create policy "lbf_select" on lbf for select to authenticated using (true);
create policy "lbf_insert" on lbf for insert to authenticated with check (true);
create policy "lbf_update" on lbf for update to authenticated using (true);
create policy "lbf_delete" on lbf for delete to authenticated using (true);

create index idx_lbf_division on lbf(division);
create index idx_lbf_estado on lbf(estado);
create index idx_lbf_creado_por on lbf(creado_por);

drop trigger if exists trg_updated_at_lbf on lbf;
create trigger trg_updated_at_lbf
  before update on lbf
  for each row execute function update_updated_at();

-- ── LBF Jugadoras (players in a LBF) ──
create table if not exists lbf_jugadoras (
  id uuid primary key default gen_random_uuid(),
  lbf_id uuid not null references lbf(id) on delete cascade,
  jugadora_id uuid not null references jugadoras(id) on delete cascade,
  numero_camiseta int,
  posicion text,
  titular boolean default true,
  orden int default 0,
  unique(lbf_id, jugadora_id)
);

alter table lbf_jugadoras enable row level security;
create policy "lbfj_select" on lbf_jugadoras for select to authenticated using (true);
create policy "lbfj_insert" on lbf_jugadoras for insert to authenticated with check (true);
create policy "lbfj_update" on lbf_jugadoras for update to authenticated using (true);
create policy "lbfj_delete" on lbf_jugadoras for delete to authenticated using (true);

create index idx_lbfj_lbf on lbf_jugadoras(lbf_id);
create index idx_lbfj_jugadora on lbf_jugadoras(jugadora_id);

-- ── LBF Historial (Audit) ──
create table if not exists lbf_historial (
  id uuid primary key default gen_random_uuid(),
  lbf_id uuid not null references lbf(id) on delete cascade,
  accion text not null,
  detalle text,
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

alter table lbf_historial enable row level security;
create policy "lbfh_select" on lbf_historial for select to authenticated using (true);
create policy "lbfh_insert" on lbf_historial for insert to authenticated with check (true);

create index idx_lbfh_lbf on lbf_historial(lbf_id);

-- ── Enable Realtime ──
alter publication supabase_realtime add table jugadoras;
alter publication supabase_realtime add table lbf;
alter publication supabase_realtime add table lbf_jugadoras;
alter publication supabase_realtime add table hockey_roles;
