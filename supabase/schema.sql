-- Esquema de la base de datos para la sincronización en la nube (pizarra de notas).
-- Ejecútalo en Supabase: Dashboard > SQL Editor > New query > pega esto > Run.

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  text        text not null default '',
  color       text not null default 'yellow',
  x           double precision not null default 0,
  y           double precision not null default 0,
  z           integer not null default 0,
  w           double precision not null default 184,
  h           double precision not null default 0,
  due_date    date,
  trashed     boolean not null default false,
  trashed_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notes_user_idx on public.notes (user_id);
create index if not exists notes_user_trashed_idx on public.notes (user_id, trashed);

-- Seguridad a nivel de fila: cada usuario solo ve y edita SUS notas.
alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);

-- Si ya no vas a usar la lista de tareas anterior, puedes eliminar su tabla:
-- drop table if exists public.tasks;
