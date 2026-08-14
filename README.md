# Legal Nea Soft

Plataforma de **Legal Nea** (Corrientes, Argentina) para gestionar la red de
abogados voluntarios **PROBONO** y las solicitudes de asistencia jurídica
gratuita de la ciudadanía.

Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage) + Resend/React
Email + Tailwind v4 + shadcn/ui.

## Setup local

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Crear proyecto en [Supabase](https://supabase.com/dashboard)** y copiar
   `.env.example` a `.env.local`, completando las variables (ver detalle de
   cada una en el propio `.env.example`).

3. **Aplicar el schema**: correr `supabase/migrations/0001_schema.sql` contra
   tu proyecto (SQL Editor de Supabase, o `supabase db push` si usás la CLI
   linkeada al proyecto).

4. **Cargar el seed**: correr `supabase/seed/seed.sql` — precarga las
   especialidades legales y 40 abogados de ejemplo (`estado = 'aprobado'`)
   para que el listado en vivo se vea poblado en la demo. **Decidir con el
   cliente si estos 40 registros ficticios van a producción o solo a un
   entorno de staging** (queda pendiente, ver "Condiciones de parada" del
   prompt maestro).

5. **Crear el usuario Administrador** (no hay alta pública de admins):

   ```bash
   npm run crear-admin -- admin@legalnea.com "Nombre Apellido"
   ```

   Requiere `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el
   entorno. Imprime una contraseña temporal — cambiarla después del primer
   login (o usar "¿Olvidaste tu contraseña?" desde `/login`).

6. **Dominio en Resend**: verificar el dominio remitente (`RESEND_FROM_EMAIL`)
   en [resend.com/domains](https://resend.com/domains). Sin `RESEND_API_KEY`
   configurada, los envíos se loguean en consola del server y no rompen el
   flujo (útil para desarrollar sin credenciales).

7. **Correr en desarrollo**

   ```bash
   npm run dev
   ```

## Estructura

- `src/app/(public)/` — landing, alta de abogado (`/abogados/nuevo`, con el
  listado en vivo debajo del formulario) y alta de cliente (`/clientes/nuevo`).
- `src/app/(auth)/` — login, activación de cuenta, recuperación de contraseña.
- `src/app/admin/`, `src/app/abogado/`, `src/app/cliente/` — paneles por rol
  (protegidos por `src/proxy.ts` + verificación server-side en cada layout
  vía `requireRole`).
- `src/app/api/geocode` — proxy a Nominatim/OpenStreetMap (autocompletado de
  domicilio; nunca se llama a Nominatim directo desde el browser).
- `src/app/api/declaracion-jurada-pdf` — genera el PDF de la Declaración
  Jurada al vuelo con `@react-pdf/renderer` (no hay archivo estático).
- `src/lib/email/` — cliente Resend + plantillas React Email.
- `src/lib/supabase/` — clientes `server` (RLS), `client` (browser) y `admin`
  (service role, exclusivo de Server Actions/Route Handlers).
- `supabase/migrations/0001_schema.sql` — schema completo, enums y políticas
  RLS documentadas con comentarios en el propio SQL.

## Checklist de deploy (Vercel + Supabase + Resend)

- [ ] Migraciones aplicadas y RLS habilitado en todas las tablas — probar con
      un usuario de cada rol que **no** pueda ver lo que no le corresponde.
- [ ] Dominio verificado en Resend y emails de prueba enviados a una casilla
      real (alta de abogado, alta de cliente, reseteo de contraseña,
      aprobación de abogado).
- [ ] Buckets de Storage privados (`adjuntos-solicitudes`,
      `declaraciones-juradas`) con políticas probadas — un cliente no puede
      leer el adjunto de otro.
- [ ] Formularios probados en mobile.
- [ ] `prefers-reduced-motion` respetado en la animación del martillo.
- [ ] Variables de entorno cargadas en Vercel (Production **y** Preview).
- [ ] `npm run crear-admin` corrido contra el proyecto de Supabase de
      producción.
- [ ] Seed de 40 abogados + especialidades corrido — confirmar con el
      cliente si van a producción o a un entorno de demo separado.
- [ ] `NEXT_PUBLIC_SITE_URL` apuntando al dominio real de producción (se usa
      para armar los links de los emails y el `redirectTo` de Supabase Auth).
- [ ] `npm run build` compila sin errores.

## Notas de implementación

- El texto de la Declaración Jurada (`src/lib/legal/declaracion-jurada.ts`)
  fue redactado en base al resumen de compromisos del prompt maestro, porque
  el archivo `legal-nea-soft-prompt-maestro.md` referencia una sección con el
  texto oficial completo que no llegó a incluirse. Reemplazar por el texto
  oficial exacto si Legal Nea lo provee.
- Teléfono de contacto hardcodeado (`src/lib/constants.ts`): **3795 089816**,
  confirmado por el cliente — reemplaza el placeholder inválido del prompt
  original ("3795 0893456").
