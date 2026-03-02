-- ── Notification system for LBF approvals and general alerts ──

create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  titulo text not null,
  mensaje text not null,
  tipo text not null default 'lbf' check (tipo in ('lbf','info','alerta')),
  link text,
  leida boolean default false,
  created_at timestamptz default now()
);

alter table notificaciones enable row level security;
create policy "notif_select" on notificaciones for select to authenticated using (true);
create policy "notif_insert" on notificaciones for insert to authenticated with check (true);
create policy "notif_update" on notificaciones for update to authenticated using (true);

create index idx_notif_user on notificaciones(user_id);
create index idx_notif_unread on notificaciones(user_id, leida) where leida = false;

alter publication supabase_realtime add table notificaciones;
