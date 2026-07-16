-- ============================================================================
-- Pizarra de notas — crear tabla `notes` Y recuperar tus tareas antiguas.
-- Ejecútalo UNA vez en Supabase: SQL Editor > New query > pega esto > Run.
-- Es seguro: no borra la tabla `tasks` antigua y no duplica si ya migraste.
-- ============================================================================

-- 1) Tabla de notas ----------------------------------------------------------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  text        text not null default '',
  color       text not null default 'yellow',
  x           double precision not null default 0,
  y           double precision not null default 0,
  z           integer not null default 0,
  due_date    date,
  trashed     boolean not null default false,
  trashed_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notes_user_idx on public.notes (user_id);
create index if not exists notes_user_trashed_idx on public.notes (user_id, trashed);

alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = user_id);

-- 2) Recuperar tus tareas antiguas como notas --------------------------------
--    - texto  = título (+ observaciones si tenía)
--    - color  = según prioridad (P1 rosa, P2 naranja, P3 azul, P4 amarillo)
--    - posición en cuadrícula para que no se solapen
--    - las tareas COMPLETADAS entran directamente en la papelera
--    Solo se ejecuta si aún no tienes notas (evita duplicados al re-ejecutar).
insert into public.notes (user_id, text, color, x, y, z, due_date, trashed, trashed_at, created_at)
with src as (
  select
    t.*,
    row_number() over (partition by t.user_id order by t.created_at, t.id) - 1 as rn
  from public.tasks t
)
select
  src.user_id,
  case when coalesce(src.notes, '') <> ''
       then src.title || E'\n' || src.notes
       else src.title end,
  case src.priority when 1 then 'pink' when 2 then 'orange' when 3 then 'blue' else 'yellow' end,
  40 + (src.rn % 6) * 210,
  40 + (src.rn / 6) * 190,
  src.rn + 1,
  src.due_date,
  src.completed,
  case when src.completed then now() else null end,
  src.created_at
from src
where not exists (
  select 1 from public.notes n where n.user_id = src.user_id
);

-- (Opcional) cuando confirmes que todo está bien, puedes borrar la tabla vieja:
-- drop table if exists public.tasks;
