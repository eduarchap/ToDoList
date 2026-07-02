# Tareas — Gestor de tareas (tipo Todoist)

Aplicación web **responsive** e **instalable como app** (PWA) para registrar tareas
rápidamente, ponerles fecha/plazo y prioridad, y mantenerlas organizadas.
Sube automáticamente arriba lo más urgente (score de prioridad + cercanía del vencimiento).

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

Abre la URL que muestra Vite (normalmente `http://localhost:5173`).
Sin configurar Supabase, la app arranca directamente en **modo local**.

## 2. Activar la sincronización en la nube (opcional pero recomendado)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).
   Crea la tabla `tasks` con seguridad por usuario (RLS).
3. En **Project Settings → API**, copia:
   - `Project URL`
   - `anon public` key
4. Crea un archivo `.env` (copiando `.env.example`) y rellena:

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

5. Reinicia `npm run dev`. Ahora verás la pantalla de acceso: regístrate con tu
   correo y tus tareas se sincronizarán en todos tus dispositivos.

> En **Authentication → Providers → Email** puedes desactivar "Confirm email"
> mientras pruebas, para entrar sin confirmar el correo.

## 3. Publicar en Netlify

1. Sube este proyecto a un repositorio de GitHub.
2. En Netlify: **Add new site → Import an existing project** y elige el repo.
3. Netlify detecta [`netlify.toml`](netlify.toml): build `npm run build`, publish `dist`.
4. Si usas la nube, añade las variables en **Site settings → Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. En la URL de Netlify, desde el móvil, usa "Añadir a pantalla de inicio"
   para instalarla como app.

> Tras publicar, añade la URL de Netlify en Supabase
> **Authentication → URL Configuration → Site URL / Redirect URLs**.

---

## Cómo funciona la priorización automática

Cada tarea recibe un *score de urgencia* (ver [`src/lib/priority.ts`](src/lib/priority.ts))
que combina:

- **Prioridad** explícita P1–P4.
- **Cercanía del vencimiento:** vencidas > hoy > próximos días > lejanas > sin fecha.

Las listas se ordenan por ese score, así que lo urgente aparece siempre arriba,
agrupado en secciones (Vencidas / Hoy / Próximas / Sin fecha).

## Estructura

```
src/
  data/        capa de datos: interfaz + LocalRepository y SupabaseRepository
  context/     AuthContext (sesión) y TasksContext (estado de tareas)
  lib/         fechas, score de urgencia, agrupación, cliente Supabase
  components/  UI (QuickAdd, TaskList, TaskItem, navegación, login…)
```
