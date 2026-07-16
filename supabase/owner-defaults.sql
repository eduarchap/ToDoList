-- Que la base de datos rellene el propietario automáticamente con el usuario
-- autenticado. Así el cliente no envía owner_id/user_id y no puede haber
-- desajuste con auth.uid() (causa del 403 al crear tableros/notas).
alter table public.boards alter column owner_id set default auth.uid();
alter table public.notes  alter column user_id  set default auth.uid();
