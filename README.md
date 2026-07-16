# Pizarra de notas (post-its)

Aplicación web **responsive** e **instalable como app** (PWA): una pizarra libre donde
colocas notas adhesivas, las arrastras a donde quieras, les pones **color** y **fecha**
opcional, y las tiras a una **papelera recuperable**.

- **Stack:** React + Vite + TypeScript + Tailwind CSS.
- **Datos:** funciona en **modo local** (localStorage) sin configurar nada, y en
  **modo nube** (Supabase) con login para sincronizar entre el móvil y el ordenador.
- **Despliegue:** Netlify.

---

## 1. Ejecutar en local

```bash
npm install
npm run icons   # genera los iconos de la PWA (solo hace falta una vez)
npm run dev
```

Sin configurar Supabase, la app arranca directamente en **modo local**.

## 2. Sincronización en la nube (Supabase)

1. Crea/usa un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).
   Crea la tabla `notes` con seguridad por usuario (RLS).
3. En **Project Settings → API**, copia la **Project URL** y la **anon/publishable key**.
4. Crea un `.env` (ver `.env.example`) con:

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```

5. `npm run dev` → aparece la pantalla de acceso; regístrate y tus notas se sincronizan.

## 3. Desplegar en Netlify

Ya configurado con la CLI de Netlify:

```bash
npm run deploy          # build + publish a producción
npm run deploy:preview  # build + deploy a una URL temporal de prueba
```

Las variables `VITE_SUPABASE_*` deben estar en el `.env` local (el build es local y las
incrusta) y también en Netlify (*Site settings → Environment variables*).

---

## Cómo funciona la pizarra

- **Añadir**: botón **+** flotante. La nota aparece en el centro de la vista, lista para escribir.
- **Mover**: arrastra una nota por su **cabecera** (la franja superior). En el lienzo grande
  puedes desplazarte (pan) arrastrando el fondo.
- **Color**: botón de paleta en la nota → elige entre 7 colores.
- **Fecha**: botón de calendario → fecha opcional (se marca en rojo si está vencida).
- **Tirar**: arrastra la nota a la **zona de papelera** que aparece abajo, o pulsa 🗑.
- **Papelera**: botón *Papelera* arriba → **restaurar** notas, **eliminar** una a una, o
  **vaciar** definitivamente.

## Estructura

```
src/
  data/        capa de datos: interfaz + LocalRepository y SupabaseRepository
  context/     AuthContext (sesión) y NotesContext (estado de las notas)
  lib/         board (dimensiones), colors (paleta), date, id, supabase
  components/  Board, StickyNote, ColorMenu, TrashDrawer, TopBar, Login…
```
