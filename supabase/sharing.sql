-- ============================================================================
-- FASE 2: compartir tableros por email (rol editor / solo lectura).
-- Ejecútalo una vez en Supabase (SQL Editor > Run). Idempotente.
-- ============================================================================

-- 1) Miembros aceptados de un tablero -----------------------------------------
create table if not exists public.board_members (
  board_id   uuid not null references public.boards (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  email      text not null default '',
  role       text not null default 'viewer' check (role in ('editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (board_id, user_id)
);
create index if not exists board_members_user_idx on public.board_members (user_id);

-- 2) Invitaciones pendientes (por email, aún sin cuenta vinculada) -------------
create table if not exists public.board_invites (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards (id) on delete cascade,
  email      text not null,
  role       text not null default 'viewer' check (role in ('editor','viewer')),
  created_at timestamptz not null default now(),
  unique (board_id, email)
);
create index if not exists board_invites_email_idx on public.board_invites (lower(email));

-- 3) Funciones de ayuda (SECURITY DEFINER: evitan recursión de RLS) -----------
create or replace function public.is_board_owner(bid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.boards b where b.id = bid and b.owner_id = auth.uid());
$$;
grant execute on function public.is_board_owner(uuid) to authenticated;

create or replace function public.is_board_member(bid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.board_members m where m.board_id = bid and m.user_id = auth.uid());
$$;
grant execute on function public.is_board_member(uuid) to authenticated;

-- rol del usuario actual sobre un tablero: owner / editor / viewer / null
create or replace function public.board_role(bid uuid)
returns text language sql security definer set search_path = public stable as $$
  select case
    when exists (select 1 from public.boards b where b.id = bid and b.owner_id = auth.uid()) then 'owner'
    else (select m.role from public.board_members m where m.board_id = bid and m.user_id = auth.uid())
  end;
$$;
grant execute on function public.board_role(uuid) to authenticated;

-- 4) Al iniciar sesión, convierte invitaciones (por email) en membresías -------
create or replace function public.accept_invites()
returns integer language plpgsql security definer set search_path = public as $$
declare
  uemail text;
  n integer;
begin
  uemail := lower(coalesce(auth.jwt() ->> 'email', ''));
  if uemail = '' then return 0; end if;
  insert into public.board_members (board_id, user_id, email, role)
    select i.board_id, auth.uid(), uemail, i.role
    from public.board_invites i
    where lower(i.email) = uemail
  on conflict (board_id, user_id) do update set role = excluded.role, email = excluded.email;
  get diagnostics n = row_count;
  delete from public.board_invites i where lower(i.email) = uemail;
  return n;
end;
$$;
grant execute on function public.accept_invites() to authenticated;

-- 5) RLS de board_members -----------------------------------------------------
alter table public.board_members enable row level security;
drop policy if exists bm_select on public.board_members;
create policy bm_select on public.board_members
  for select using (user_id = auth.uid() or public.is_board_owner(board_id));
drop policy if exists bm_insert on public.board_members;
create policy bm_insert on public.board_members
  for insert with check (public.is_board_owner(board_id));
drop policy if exists bm_update on public.board_members;
create policy bm_update on public.board_members
  for update using (public.is_board_owner(board_id)) with check (public.is_board_owner(board_id));
drop policy if exists bm_delete on public.board_members;
create policy bm_delete on public.board_members
  for delete using (public.is_board_owner(board_id) or user_id = auth.uid());

-- 6) RLS de board_invites (solo el propietario gestiona) ----------------------
alter table public.board_invites enable row level security;
drop policy if exists bi_all on public.board_invites;
create policy bi_all on public.board_invites
  for all using (public.is_board_owner(board_id)) with check (public.is_board_owner(board_id));

-- 7) boards_select: propietario (directo, sin re-consulta) O miembro ----------
drop policy if exists boards_select on public.boards;
create policy boards_select on public.boards
  for select using (owner_id = auth.uid() or public.is_board_member(id));

-- 8) notes: lectura para cualquier rol; escritura solo owner/editor -----------
drop policy if exists notes_select on public.notes;
create policy notes_select on public.notes
  for select using (public.board_role(board_id) is not null);
drop policy if exists notes_insert on public.notes;
create policy notes_insert on public.notes
  for insert with check (public.board_role(board_id) in ('owner','editor') and user_id = auth.uid());
drop policy if exists notes_update on public.notes;
create policy notes_update on public.notes
  for update using (public.board_role(board_id) in ('owner','editor'))
  with check (public.board_role(board_id) in ('owner','editor'));
drop policy if exists notes_delete on public.notes;
create policy notes_delete on public.notes
  for delete using (public.board_role(board_id) in ('owner','editor'));
