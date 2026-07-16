-- Añade a las notas: título y tamaño (ancho/alto). Idempotente: puedes ejecutarlo
-- aunque ya hubieras añadido alguna columna. Supabase > SQL Editor > Run.
alter table public.notes add column if not exists title text not null default '';
alter table public.notes add column if not exists w double precision not null default 184;
alter table public.notes add column if not exists h double precision not null default 0;
