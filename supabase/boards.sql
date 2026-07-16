-- ============================================================================
-- FASE 1: múltiples tableros. Ejecútalo una vez en Supabase (SQL Editor > Run).
-- Crea la tabla `boards`, enlaza las notas a un tablero, migra tus notas actuales
-- a un tablero "Mi pizarra" y cambia la seguridad (RLS) para que sea por tablero.
-- Es idempotente y no borra notas.
-- ============================================================================

-- 1) Tabla de tableros --------------------------------------------------------
create table if not exists public.boards (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  name       text not null default 'Pizarra',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists boards_owner_idx on public.boards (owner_id);

-- 2) Enlazar notas a un tablero ----------------------------------------------
alter table public.notes
  add column if not exists board_id uuid references public.boards (id) on delete cascade;
create index if not exists notes_board_idx on public.notes (board_id);

-- 3) Función de rol: qué puede hacer el usuario actual sobre un tablero.
--    SECURITY DEFINER para evitar recursión de RLS. (En fase 2 añadirá miembros.)
create or replace function public.board_role(bid uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when exists (select 1 from public.boards b where b.id = bid and b.owner_id = auth.uid())
      then 'owner'
    else null
  end;
$$;
grant execute on function public.board_role(uuid) to authenticated;

-- 4) RLS de tableros ----------------------------------------------------------
alter table public.boards enable row level security;
drop policy if exists boards_select on public.boards;
create policy boards_select on public.boards for select using (public.board_role(id) is not null);
drop policy if exists boards_insert on public.boards;
create policy boards_insert on public.boards for insert with check (owner_id = auth.uid());
drop policy if exists boards_update on public.boards;
create policy boards_update on public.boards for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists boards_delete on public.boards;
create policy boards_delete on public.boards for delete using (owner_id = auth.uid());

-- 5) Migrar notas existentes a un tablero por defecto por usuario -------------
insert into public.boards (owner_id, name)
select distinct n.user_id, 'Mi pizarra'
from public.notes n
where n.board_id is null
  and not exists (select 1 from public.boards b where b.owner_id = n.user_id);

update public.notes n
set board_id = b.id
from public.boards b
where n.board_id is null and b.owner_id = n.user_id;

-- 6) RLS de notas: ahora basada en el tablero (reemplaza las de user_id) -------
drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;

drop policy if exists notes_select on public.notes;
create policy notes_select on public.notes
  for select using (public.board_role(board_id) is not null);
drop policy if exists notes_insert on public.notes;
create policy notes_insert on public.notes
  for insert with check (public.board_role(board_id) is not null and user_id = auth.uid());
drop policy if exists notes_update on public.notes;
create policy notes_update on public.notes
  for update using (public.board_role(board_id) is not null)
  with check (public.board_role(board_id) is not null);
drop policy if exists notes_delete on public.notes;
create policy notes_delete on public.notes
  for delete using (public.board_role(board_id) is not null);
