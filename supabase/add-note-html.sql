-- Añade el contenido con formato (HTML) a las notas. Supabase > SQL Editor > Run.
alter table public.notes add column if not exists html text;
