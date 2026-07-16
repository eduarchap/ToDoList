-- Añade el tamaño (ancho/alto) a las notas. Ejecútalo una vez en Supabase (SQL Editor).
-- w = anchura en px (por defecto 184); h = altura en px (0 = automática).
alter table public.notes add column if not exists w double precision not null default 184;
alter table public.notes add column if not exists h double precision not null default 0;
