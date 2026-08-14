# Legal Nea Soft — Prompt maestro para Claude Code / VS Code

> Nota antes de copiar: revisá el bloque "Antes de pegar esto" al final del archivo. Todo lo que sigue, desde el título "## Rol" hasta "## Estrategia de sesión", es el prompt en sí — pegalo completo en tu primer turno con el agente de código.

---

## Rol

Actuá como ingeniero de software full-stack senior, especializado en Next.js (App Router), Supabase (Postgres + Auth + Storage) y sistemas de gestión multi-rol para clientes reales en producción. Vas a construir **Legal Nea Soft** de cero, un sistema para el estudio jurídico Legal Nea (Corrientes, Argentina) que gestiona el alta de abogados voluntarios de la red **PROBONO** y las solicitudes de asistencia jurídica gratuita de la ciudadanía.

Pensá con cuidado y paso a paso antes de empezar a programar: hay decisiones de modelo de datos y de flujo de autenticación que si se resuelven mal son costosas de corregir después.

## Objetivo

Construir el MVP funcional y desplegable de Legal Nea Soft: un sitio con un formulario público de alta de abogados, un formulario público de alta de clientes (personas que piden ayuda legal gratuita), un panel de Administrador, un panel de Abogado y un panel de Cliente, con autenticación real, notificaciones por email y una base de datos relacional en Supabase, listo para desplegar en Vercel.

## Contexto de negocio (no lo resumas de más, son requisitos reales del cliente)

**PROBONO** es una red de más de 1.600 abogados en Argentina que prestan servicios legales gratuitos en casos de interés público, coordinada por la Comisión de Trabajo Pro Bono e Interés Público (Colegio de Abogados de la Ciudad de Buenos Aires, +25 años de trayectoria). Las áreas históricas de trabajo de la Comisión son: Transparencia, Derechos de niñas/niños/adolescentes, Salud, Microfinanzas, Justicia e Inclusión social — además de todas las especialidades jurídicas tradicionales, porque cualquier abogado matriculado puede sumarse independientemente de su especialidad.

El cliente, **Estudio Legal Nea** (Corrientes), quiere replicar y potenciar ese modelo de alta de abogados con un portal propio: cualquier abogado matriculado en cualquier parte de la Argentina debe poder registrarse, y cualquier persona debe poder pedir asistencia jurídica gratuita.

Existe una **"Declaración de Trabajo Pro Bono para el Continente Americano"** (documento oficial que el cliente adjuntó) que resume el compromiso ético de los abogados pro bono: prestar un mínimo de 20 horas o 3 días anuales de trabajo legal gratuito, con la misma calidad profesional que un servicio pago, a personas, comunidades u organizaciones en situación de vulnerabilidad. Ese documento debe transformarse en una **declaración jurada dentro del formulario de alta de abogado**, que el abogado debe leer y aceptar explícitamente antes de poder enviar sus datos. Te paso el texto completo abajo, en la sección "Contenido de la Declaración Jurada", para que lo uses tal cual (respetando el sentido, podés mejorar la tipografía/maquetación pero no alterar el contenido legal).

## Decisiones técnicas ya cerradas con el cliente (no las vuelvas a preguntar, son definitivas para este MVP)

1. **Autenticación con 3 roles reales**: Admin, Abogado y Cliente, todos con cuenta y login vía Supabase Auth, cada uno con su propio dashboard.
2. **Email transaccional**: Resend + React Email para las plantillas. No usar el servicio de email por defecto de Supabase para las notificaciones de negocio (sí se puede usar Supabase Auth internamente para lo estrictamente técnico de sesión, pero todo el contenido/branding de los emails sale por Resend).
3. **Autocompletado de domicilio**: Nominatim/OpenStreetMap (gratuito, sin API key) en lugar de Google Places. Debe intentar completar automáticamente provincia, localidad y código postal a partir de la dirección tipeada; si Nominatim no devuelve esos datos con confianza suficiente, esos campos quedan editables manualmente (no bloquear el formulario).
4. **WhatsApp**: no se integra la API de WhatsApp Business. Solo se guarda el número de celular y se genera un botón "Chatear por WhatsApp" que abre `https://wa.me/<numero>` para que el Administrador escriba manualmente.

## Flujo de autenticación y aprobación (definilo así, es importante)

Los formularios públicos de alta (abogado y cliente) **NO requieren estar logueado** para enviarse — son formularios anónimos accesibles por URL pública. La cuenta de usuario (Supabase Auth) se crea **después**, así:

- **Abogado**: completa el formulario público → se crea un registro en `abogados` con estado `pendiente` → el Administrador revisa y **aprueba o rechaza** desde su panel → al aprobar, el sistema crea el usuario en Supabase Auth (rol `abogado`) y dispara, vía Resend, un email con un link de activación para que el abogado defina su contraseña y acceda a su panel. Si se rechaza, se le informa por email de forma respetuosa, sin necesidad de crear cuenta.
- **Cliente**: completa el formulario público → se crea de inmediato un registro en `clientes` + una `solicitudes` asociada (no requiere aprobación previa, porque pedir ayuda no debe tener fricción) → el sistema crea el usuario en Supabase Auth (rol `cliente`) automáticamente y envía, vía Resend, un email de bienvenida con link para definir contraseña y poder seguir el estado de su solicitud desde su panel.
- **Administrador**: cuenta creada manualmente por vos (seed / script), no hay alta pública de administradores.
- **Reseteo de contraseña por el Admin (punto 2.a)**: desde el panel de Administrador, un botón "Restablecer contraseña" por cada abogado/cliente que use `supabase.auth.admin` (con la service role key, solo en el backend/servidor, nunca en el cliente) para generar el link de recuperación, y lo envíe con el template propio de Resend — nunca exponer la service role key al frontend.

## Stack técnico

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui para componentes de formulario, tablas y modales.
- **Animaciones**: Framer Motion (para la animación del martillo y las micro-interacciones).
- **Backend/DB/Auth/Storage**: Supabase (Postgres, Auth, Storage, Row Level Security).
- **Email**: Resend + React Email para las plantillas (confirmación de alta abogado, confirmación de alta cliente, aprobación/rechazo, reseteo de contraseña, respuesta del admin).
- **Geocodificación**: Nominatim (OpenStreetMap) vía fetch server-side con debounce, respetando su política de uso (1 request/seg, User-Agent identificado).
- **Despliegue**: Vercel (frontend + API routes / server actions), Supabase Cloud (DB gestionada).
- **Validación de formularios**: React Hook Form + Zod, compartiendo los mismos schemas de Zod entre cliente y servidor.

Solo agregá dependencias nuevas si son estrictamente necesarias para lo pedido acá. Si creés que hace falta algo no listado, preguntame antes de instalarlo.

## Alcance (Scope)

Es un proyecto **nuevo desde cero**. Creá la estructura de carpetas estándar de un proyecto Next.js App Router. Organizá rutas así (podés ajustar nombres si hay una convención mejor, pero mantené la separación por rol):

```
/app
  /(public)
    /abogados/nuevo        -> formulario de alta de abogado
    /clientes/nuevo        -> formulario de alta de cliente
    /                       -> landing con explicación de PROBONO + accesos
  /(auth)
    /login
    /activar-cuenta
    /recuperar-password
  /admin/...                -> panel administrador (protegido, rol=admin)
  /abogado/...               -> panel del abogado (protegido, rol=abogado)
  /cliente/...                -> panel del cliente (protegido, rol=cliente)
  /api/... o /actions        -> server actions / route handlers (envío de emails, geocoding proxy, alta de usuarios)
/lib
  /supabase                 -> clientes de Supabase (browser/server), tipos generados
  /email                    -> templates React Email + wrapper de Resend
  /validation                -> schemas Zod compartidos
/components
/supabase
  /migrations                -> SQL de creación de tablas, políticas RLS, seed
```

No toques archivos de configuración de infraestructura fuera de lo necesario para este proyecto (no hay proyecto previo que respetar, porque es greenfield).

## Modelo de datos (Supabase / Postgres)

Creá las migraciones SQL correspondientes (en `/supabase/migrations`). Usá UUID como PK en todas las tablas (`gen_random_uuid()`), timestamps `created_at`/`updated_at` con default `now()`, y `enum` de Postgres para los campos de estado.

**`perfiles`** (espejo 1:1 de `auth.users`, para poder saber el rol sin tocar el JWT en cada policy)
- `id uuid` PK, FK a `auth.users(id)`
- `rol` enum: `admin` | `abogado` | `cliente`
- `nombre_completo text`
- `email text`
- `activo boolean default true`
- `created_at timestamptz`

**`abogados`**
- `id uuid` PK
- `user_id uuid` FK a `auth.users(id)`, **nullable** (se completa recién cuando se aprueba y se crea la cuenta)
- `nombre_apellido text not null`
- `email text not null unique`
- `telefono_whatsapp text not null`
- `domicilio text not null`
- `provincia text not null`
- `localidad text not null`
- `codigo_postal text`
- `matricula_federal text`
- `matricula_provincial text`
- `estado` enum: `pendiente` | `aprobado` | `rechazado` | `suspendido`, default `pendiente`
- `acepto_declaracion_jurada boolean not null default false`
- `fecha_aceptacion_dj timestamptz`
- `fecha_alta timestamptz default now()`
- `fecha_aprobacion timestamptz`
- `aprobado_por uuid` FK a `perfiles(id)`, nullable
- `motivo_rechazo text`
- `notas_internas text` (solo visibles para admin)

**`especialidades`**
- `id uuid` PK, `nombre text unique not null`, `categoria` enum: `prioritaria_probono` | `general`, `activa boolean default true`
- Precargar con el listado completo de la sección "Especialidades legales" de este documento.

**`abogado_especialidades`** (N:N)
- `abogado_id uuid` FK, `especialidad_id uuid` FK, PK compuesta

**`clientes`**
- `id uuid` PK
- `user_id uuid` FK a `auth.users(id)`, nullable hasta que se procesa el alta de cuenta
- `nombre_apellido text not null`
- `email text not null`
- `telefono_whatsapp text not null`
- `domicilio text not null`
- `provincia text not null`
- `localidad text not null`
- `created_at timestamptz default now()`

**`solicitudes`** (el caso/consulta del cliente)
- `id uuid` PK
- `cliente_id uuid` FK a `clientes`
- `motivo_consulta text not null`
- `especialidad_sugerida_id uuid` FK a `especialidades`, nullable (para matching automático, ver sección de funcionalidades admin)
- `abogado_asignado_id uuid` FK a `abogados`, nullable
- `estado` enum: `nueva` | `en_revision` | `asignada` | `en_curso` | `resuelta` | `derivada` | `cerrada`, default `nueva`
- `prioridad` enum: `baja` | `media` | `alta`, default `media`
- `notas_internas text`
- `created_at timestamptz default now()`
- `fecha_asignacion timestamptz`
- `fecha_cierre timestamptz`

**`solicitud_adjuntos`**
- `id uuid` PK, `solicitud_id uuid` FK, `storage_path text not null`, `nombre_archivo text`, `tipo_mime text`, `tamano_bytes int`, `subido_en timestamptz default now()`

**`mensajes`** (mensajería interna admin ↔ abogado / admin ↔ cliente, con historial)
- `id uuid` PK, `remitente_id uuid` FK `perfiles`, `destinatario_id uuid` FK `perfiles`, `asunto text`, `cuerpo text not null`, `leido boolean default false`, `created_at timestamptz default now()`

**`logs_auditoria`** (ver funcionalidades admin, punto 2.c)
- `id uuid` PK, `actor_id uuid` FK `perfiles` nullable, `accion text not null`, `entidad text not null`, `entidad_id uuid`, `detalle jsonb`, `created_at timestamptz default now()`

**`plantillas_email`** (para que el admin pueda editar el copy sin redeploy — ver 2.c)
- `id uuid` PK, `clave text unique` (ej: `alta_abogado_confirmacion`), `asunto text`, `cuerpo_html text`, `updated_at timestamptz`

**`notificaciones_admin`** (bandeja interna del admin)
- `id uuid` PK, `tipo text` (ej: `nuevo_abogado`, `nueva_solicitud`), `entidad_id uuid`, `mensaje text`, `leido boolean default false`, `created_at timestamptz default now()`

### Row Level Security (RLS) — activar en TODAS las tablas

- `abogados`: `INSERT` público (anon) permitido solo con los campos del formulario (usar una función/policy que valide `estado = 'pendiente'` y `user_id is null` en el insert, para que nadie pueda auto-aprobarse). `SELECT`/`UPDATE`: el propio abogado solo puede ver/editar su fila (`user_id = auth.uid()`); el admin (`rol = 'admin'` en `perfiles`) puede todo. Un abogado **no** puede ver los datos de otro abogado.
- `clientes` y `solicitudes`: `INSERT` público permitido (alta + primera solicitud). `SELECT`: el cliente solo ve lo propio (`user_id = auth.uid()` vía `clientes.id`); el admin ve todo; el abogado asignado puede `SELECT` (no `UPDATE` de datos personales) las `solicitudes` donde `abogado_asignado_id` corresponda a su propio registro en `abogados`.
- `solicitud_adjuntos` y el bucket de Storage: bucket **privado**, acceso solo vía URLs firmadas generadas server-side; políticas de Storage espejando las de `solicitudes` (dueño, admin, abogado asignado).
- `mensajes`: cada usuario ve solo los mensajes donde es remitente o destinatario; admin ve todos.
- `especialidades`, `plantillas_email`, `logs_auditoria`, `notificaciones_admin`: solo lectura/escritura para `admin`. `especialidades` además necesita `SELECT` público (para poblar el multiselect de los formularios).
- Nunca uses la `service role key` en el cliente. Las operaciones que requieren privilegios (crear usuario en Auth, resetear password, mandar el email de aprobación) van en Server Actions o Route Handlers, nunca en componentes cliente.

## Roles y permisos — resumen

| Rol | Accede a | Puede |
|---|---|---|
| **Admin** | `/admin/*` | Ver/aprobar/rechazar abogados, ver/gestionar clientes y solicitudes, mensajería, reportes, resetear contraseñas, gestionar especialidades y plantillas de email, ver auditoría |
| **Abogado** | `/abogado/*` | Ver y editar su propio perfil, ver solicitudes que se le asignaron, responder mensajes del admin, ver su estado de aprobación |
| **Cliente** | `/cliente/*` | Ver el estado de su(s) solicitud(es), agregar comentarios/adjuntos adicionales, ver mensajes del admin/abogado asignado |

## Especificación funcional

### 1) Formulario público de alta de Abogado — `/abogados/nuevo`

Campos (en este orden), todos con validación Zod y mensajes de error en español:

1. Nombre y apellido (texto, requerido)
2. Celular WhatsApp (input con máscara/validación de número argentino, requerido)
3. Domicilio (input con autocompletado vía Nominatim; al seleccionar una sugerencia, intentar rellenar automáticamente Provincia, Localidad y Código Postal)
4. Provincia (select con las 24 provincias argentinas + CABA; editable aunque se haya autocompletado)
5. Localidad (texto, autocompletable)
6. Código Postal (texto, autocompletable)
7. Matrícula Federal (texto)
8. Matrícula Provincial (texto)
9. Email (validación de formato, requerido)
10. Área de actuación (multiselect con checkboxes de **todas** las especialidades — ver listado abajo; permitir selección múltiple, mínimo 1)

**Antes de habilitar el botón "Enviar"**: al hacer click en "Enviar" por primera vez, abrir un **modal de Declaración Jurada** (no enviar todavía) que muestre el texto completo de la Declaración de Trabajo Pro Bono (sección siguiente), bien maquetado, con scroll interno, tipografía legible (usá una tipografía serif para el cuerpo del documento, tamaño cómodo, buen espaciado entre párrafos, y destacá en negrita los títulos "CONSIDERANDO" y los compromisos), un botón **"Descargar en PDF"** (generar el PDF en el momento con el mismo contenido, usando por ejemplo `@react-pdf/renderer` o `pdf-lib`, no hardcodear un archivo estático) y, al pie, un checkbox **"He leído y acepto los términos de la Declaración de Trabajo Pro Bono"** + botón **"Aceptar y enviar mi solicitud"**, deshabilitado hasta tildar el checkbox. Recién ahí se hace el submit real, se guarda `acepto_declaracion_jurada = true` y `fecha_aceptacion_dj = now()`.

**Al confirmar el envío exitoso**:
- Reproducir la animación del martillo (ver sección dedicada).
- Mostrar el mensaje: *"¡Felicitaciones! Tus datos fueron enviados para ser evaluados por nuestro equipo. En un plazo de hasta 48 horas hábiles vas a recibir un email con la novedad. Si pasado ese plazo no tenés noticias nuestras, escribinos a [TELÉFONO/WHATSAPP DE CONTACTO DE LEGAL NEA] y con gusto te ayudamos."* — **dejá el teléfono como placeholder claramente marcado**, porque el número que pasó el cliente ("3795 0893456") tiene un dígito de más para ser un teléfono argentino válido; hay que confirmarlo con Legal Nea antes de hardcodearlo.
- 1.5 segundos después, hacer scroll suave (`scrollIntoView({ behavior: 'smooth' })`) hacia la sección de listado en vivo de abogados y agregar ahí, con un efecto de destaque (borde/fondo que titila 2 veces y se desvanece), la fila recién creada.

### 2) Animación del martillo (mazo de juez)

Implementarla con Framer Motion, sin depender de assets externos pagos:
- Un SVG simple de un mazo de juez (cabeza + mango), posicionado sobre una base/tabla.
- Estado inicial: mazo rotado a `-55deg` (levantado).
- Al confirmarse el envío: animar `rotate` de `-55deg` a `0deg` en ~450ms con un `cubic-bezier` de tipo "ease-in" pronunciado (que acelere hacia el final, simulando el golpe), seguido de un pequeño "rebote" de 5-8 grados y vuelta a 0.
- En el instante del impacto (cuando `rotate` llega a 0): disparar un shake breve (translateX ±4px, 2-3 ciclos, 150ms) en la tarjeta contenedora, y un pulso de sombra radial debajo del mazo simulando el golpe.
- 300ms después del impacto, hacer aparecer (fade + slide-up sutil) el texto de "¡Felicitaciones...!" descripto arriba.
- Todo el conjunto (mazo + mensaje) debe poder saltearse/no bloquear si el usuario tiene `prefers-reduced-motion` activado (mostrar el mensaje directamente sin animación).

### 3) Listado en vivo de abogados suscriptos (debajo del formulario, en la misma landing)

Tabla o grid de tarjetas con: nombre, provincia, especialidad(es), fecha de alta. Traer los abogados con `estado = 'aprobado'` (para no exponer datos de gente pendiente de revisión) ordenados por fecha de alta descendente, con paginación o "cargar más". Precargar la base con **40 abogados de ejemplo** para que la demo se vea poblada (ver seed data abajo).

### 4) Panel del Abogado — `/abogado`

- Ver su propio perfil y estado (`pendiente` / `aprobado` / `rechazado` / `suspendido`) con mensaje explicativo según el estado.
- Editar sus datos de contacto (no puede editar `estado`, `matricula` sin quedar marcado como "pendiente de revalidación" — a tu criterio de diseño, dejalo simple en el MVP: puede editar todo excepto `estado`).
- Ver mensajes recibidos del admin y responder.
- Ver las solicitudes de clientes que se le hayan asignado, con acceso a los adjuntos vía URL firmada.

### 5) Panel de Administrador — `/admin`

- **Dashboard** con KPIs: abogados pendientes de revisión, abogados aprobados totales, solicitudes nuevas, solicitudes en curso, distribución por provincia y por especialidad (gráficos simples con `recharts`).
- **Gestión de abogados**: listado filtrable/buscable (por nombre, provincia, especialidad, estado), vista de detalle completo, acciones **Aprobar** / **Rechazar** (con motivo) / **Suspender**, exportar a CSV/Excel con los filtros aplicados.
- **Gestión de clientes y solicitudes (2.b)**: listado de todas las solicitudes con filtros (estado, provincia, especialidad sugerida, prioridad, rango de fechas), vista de detalle del cliente con historial completo de sus solicitudes y adjuntos. Acciones disponibles sobre una solicitud:
  - Cambiar estado (`nueva → en_revision → asignada → en_curso → resuelta / derivada → cerrada`)
  - Asignar/reasignar abogado (con sugerencia automática por especialidad + provincia, ver 2.c)
  - Agregar notas internas (no visibles para el cliente)
  - Cambiar prioridad
  - Enviar mensaje al cliente y/o al abogado asignado desde la misma vista
  - Descargar adjuntos
  - Ver historial/timeline de cambios de estado (usa `logs_auditoria`)
- **Mensajería**: bandeja de mensajes enviados/recibidos con abogados y clientes, con historial por persona.
- **Reportes**: exportación CSV/Excel de abogados y de solicitudes con los filtros vigentes; opcionalmente un botón "generar reporte PDF" resumen del período.
- **Reseteo de contraseñas (2.a)**: botón por usuario (abogado o cliente) que dispara el flujo de recuperación vía `supabase.auth.admin` + email de Resend, como se explicó en "Flujo de autenticación".

### 6) Panel del Cliente — `/cliente`

- Ver el estado de su(s) solicitud(es) con una línea de tiempo simple (nueva → en revisión → asignada → en curso → resuelta).
- Ver el nombre del abogado asignado (sin datos de contacto directo, salvo que el admin decida compartirlos vía mensaje — mantené la privacidad del abogado por defecto).
- Agregar comentarios o adjuntos adicionales a su solicitud.
- Ver los mensajes que le enviaron y responder.

### 7) Formulario público de alta de Cliente — `/clientes/nuevo`

Campos:
1. Nombre y apellido
2. Celular WhatsApp
3. Email
4. Domicilio (mismo autocompletado Nominatim que en el formulario de abogados)
5. Provincia
6. Localidad
7. Motivo de la consulta (`textarea`, sin límite artificial de caracteres razonable, ej. hasta 3000 caracteres) + adjuntar archivos: múltiples archivos (PDF, DOC/DOCX, JPG/PNG), máximo 5 archivos, 10MB por archivo, subida a un bucket privado de Supabase Storage con `storage_path` guardado en `solicitud_adjuntos`.

**Antes de habilitar "Enviar"**: mostrar un aviso tipo alerta (puede ser un checkbox destacado dentro de una `Alert` de shadcn/ui, no necesariamente un modal aparte como en el caso del abogado) con el texto: *"Declaro que la información que relaté en este formulario es veraz y me hago responsable por su exactitud."* — checkbox obligatorio para habilitar el botón "Enviar".

**Mensaje de éxito al enviar**: *"¡Listo! Tu solicitud fue recibida y ya la estamos derivando a un abogado especialista de nuestra red PROBONO para que la analice. Te vamos a contactar a la brevedad por el medio que nos indicaste. Gracias por confiar en nosotros."*

### 8) Notificaciones por email (Resend + React Email)

Crear como mínimo estas plantillas, todas con el mismo header/footer de marca ("Legal Nea Soft — Red PROBONO"):

- `alta_abogado_confirmacion`: al abogado, apenas envía el formulario. Asunto: *"Recibimos tu solicitud para sumarte a la Red PROBONO"*. Cuerpo: agradecimiento, resumen de lo que envió, próximos pasos (revisión en hasta 48hs hábiles), contacto de soporte.
- `alta_abogado_aprobado`: al abogado, cuando el admin aprueba. Incluye el link de activación de cuenta/definición de contraseña.
- `alta_abogado_rechazado`: al abogado, cuando se rechaza, con el motivo (si el admin lo cargó) en tono respetuoso.
- `alta_cliente_confirmacion` (punto 4.a): al cliente, apenas envía su solicitud. Asunto: *"Recibimos tu solicitud de asistencia jurídica gratuita"*. Cuerpo: agradecimiento, número/identificador de la solicitud, próximos pasos, y aclaración de que un especialista se va a contactar.
- `reseteo_password`: para el flujo 2.a.
- `mensaje_admin`: cuando el admin le manda un mensaje a un abogado/cliente desde la plataforma (opcional en MVP, pero dejá el template listo).
- Notificación interna al admin: apenas se recibe un alta de abogado o una nueva solicitud, crear una fila en `notificaciones_admin` (visible en una campanita/badge en el panel admin). Adicionalmente, contemplar un email opcional a una casilla de administración configurable por variable de entorno (`ADMIN_NOTIFICATION_EMAIL`), para no depender solo de que el admin esté mirando el panel.

## Especialidades legales (precargar en la tabla `especialidades`)

**Prioritarias de la Comisión Pro Bono** (categoría `prioritaria_probono`):
- Transparencia y Acceso a la Información Pública
- Derechos de Niñas, Niños y Adolescentes
- Derecho a la Salud
- Microfinanzas y Emprendedurismo
- Acceso a la Justicia
- Inclusión Social

**Especialidades generales del derecho** (categoría `general`):
- Derecho Civil
- Derecho de Familia
- Derecho Penal
- Derecho Laboral
- Derecho Comercial y Societario
- Derecho Administrativo
- Derecho Tributario y Fiscal
- Derecho Previsional (Jubilaciones y Pensiones)
- Derecho Inmobiliario
- Derecho Sucesorio
- Defensa del Consumidor
- Derecho Ambiental
- Propiedad Intelectual (Marcas y Patentes)
- Derecho Migratorio y de Extranjería
- Derecho de la Discapacidad
- Género y Violencia Familiar/de Género
- Derechos Humanos
- Derecho Concursal y Quiebras
- Derecho Bancario y Financiero
- Derecho de Seguros
- Derecho Aduanero y Comercio Exterior
- Derecho Agrario y Rural
- Derecho Minero y Energético
- Arbitraje y Mediación
- Derecho Informático y Protección de Datos Personales
- Derecho Municipal y Contravencional
- Derecho Electoral
- Derecho Deportivo
- Derechos de Pueblos Originarios

Dejá el CRUD de esta tabla accesible desde el panel admin (ver funcionalidades sugeridas 2.c) para que Legal Nea pueda agregar/desactivar especialidades sin tocar código.

## Seed data: 40 abogados de ejemplo para la demo

Generá un script de seed (`/supabase/migrations/..._seed_abogados_demo.sql` o un script TypeScript ejecutado con `tsx`) que inserte estos 40 abogados con `estado = 'aprobado'` y `fecha_alta` según la columna, vinculando cada uno a la/las especialidad(es) indicada(s) en la tabla `abogado_especialidades`. Usá emails ficticios con dominio `@ejemplo-legalnea.com` para que no choquen con emails reales, y matrículas con formato realista pero inventado.

| # | Nombre y Apellido | Provincia | Localidad | Especialidad | Matrícula Federal | Matrícula Provincial | Fecha de alta |
|---|---|---|---|---|---|---|---|
| 1 | María Fernanda Gómez | Buenos Aires | La Plata | Derecho de Familia | CPACF T°45 F°210 | CASI T°12 F°88 | 03/02/2023 |
| 2 | Juan Ignacio Rodríguez | Buenos Aires | Mar del Plata | Derecho Laboral | CPACF T°51 F°134 | CAMDP T°20 F°45 | 14/05/2023 |
| 3 | Lucía Belén Fernández | CABA | CABA | Derechos Humanos | CPACF T°60 F°301 | — | 22/01/2024 |
| 4 | Martín Alejandro Torres | CABA | CABA | Derecho Penal | CPACF T°58 F°275 | — | 09/03/2024 |
| 5 | Sofía Valentina Acosta | Córdoba | Córdoba Capital | Derecho Civil | CPACF T°40 F°190 | Col. Ab. Córdoba T°5 F°60 | 11/06/2022 |
| 6 | Diego Sebastián Moyano | Córdoba | Río Cuarto | Derecho Comercial y Societario | CPACF T°42 F°205 | Col. Ab. Río Cuarto T°8 F°120 | 18/09/2022 |
| 7 | Carla Yamila Suárez | Santa Fe | Rosario | Defensa del Consumidor | CPACF T°47 F°250 | Col. Ab. Rosario T°15 F°300 | 25/11/2023 |
| 8 | Federico Ezequiel López | Santa Fe | Santa Fe Capital | Derecho Tributario y Fiscal | CPACF T°44 F°220 | Col. Ab. Santa Fe T°9 F°145 | 07/04/2023 |
| 9 | Rocío Antonella Ibarra | Corrientes | Corrientes Capital | Derechos de Niñas, Niños y Adolescentes | CPACF T°49 F°260 | Col. Ab. Corrientes T°3 F°41 | 30/01/2024 |
| 10 | Nicolás Ariel Benítez | Corrientes | Goya | Derecho Agrario y Rural | CPACF T°39 F°178 | Col. Ab. Corrientes T°4 F°55 | 12/07/2023 |
| 11 | Agustina Paz Cardozo | Chaco | Resistencia | Inclusión Social | CPACF T°53 F°289 | Col. Ab. Chaco T°6 F°77 | 19/02/2024 |
| 12 | Bruno Maximiliano Ramírez | Chaco | P. R. Sáenz Peña | Derecho Laboral | CPACF T°36 F°150 | Col. Ab. Chaco T°7 F°91 | 04/08/2022 |
| 13 | Camila Ayelén Duarte | Misiones | Posadas | Derecho a la Salud | CPACF T°55 F°295 | Col. Ab. Misiones T°2 F°33 | 15/10/2023 |
| 14 | Tomás Ezequiel Ojeda | Misiones | Oberá | Derecho Ambiental | CPACF T°38 F°165 | Col. Ab. Misiones T°3 F°48 | 27/03/2023 |
| 15 | Valentina Micaela Rojas | Formosa | Formosa Capital | Género y Violencia Familiar/de Género | CPACF T°57 F°310 | Col. Ab. Formosa T°1 F°10 | 08/12/2023 |
| 16 | Gonzalo Emanuel Peralta | Entre Ríos | Paraná | Derecho Sucesorio | CPACF T°41 F°198 | Col. Ab. Entre Ríos T°6 F°99 | 21/05/2022 |
| 17 | Julieta Abril Medina | Entre Ríos | Concordia | Derecho de Familia | CPACF T°46 F°240 | Col. Ab. Concordia T°4 F°62 | 02/09/2023 |
| 18 | Franco Emiliano Aguirre | Tucumán | San Miguel de Tucumán | Derecho Laboral | CPACF T°43 F°215 | Col. Ab. Tucumán T°10 F°155 | 16/06/2023 |
| 19 | Milagros Zoe Herrera | Salta | Salta Capital | Acceso a la Justicia | CPACF T°52 F°280 | Col. Ab. Salta T°5 F°70 | 29/01/2024 |
| 20 | Ramiro Nahuel Castro | Jujuy | San Salvador de Jujuy | Derechos de Pueblos Originarios | CPACF T°37 F°160 | Col. Ab. Jujuy T°3 F°44 | 10/07/2022 |
| 21 | Brisa Noelia Villalba | Mendoza | Mendoza Capital | Derecho Inmobiliario | CPACF T°48 F°255 | Col. Ab. Mendoza T°11 F°180 | 23/04/2023 |
| 22 | Ezequiel Tomás Funes | Mendoza | San Rafael | Derecho Concursal y Quiebras | CPACF T°34 F°140 | Col. Ab. San Rafael T°2 F°30 | 05/11/2022 |
| 23 | Ana Paula Sosa | San Juan | San Juan Capital | Derecho Minero y Energético | CPACF T°45 F°235 | Col. Ab. San Juan T°4 F°58 | 17/08/2023 |
| 24 | Matías Joel Correa | San Luis | San Luis Capital | Derecho Administrativo | CPACF T°33 F°130 | Col. Ab. San Luis T°2 F°25 | 28/02/2023 |
| 25 | Florencia Ailén Coronel | La Rioja | La Rioja Capital | Derecho Previsional | CPACF T°50 F°265 | Col. Ab. La Rioja T°1 F°12 | 09/09/2023 |
| 26 | Santiago Iván Molina | Catamarca | San F. del Valle de Catamarca | Propiedad Intelectual | CPACF T°32 F°122 | Col. Ab. Catamarca T°1 F°8 | 20/06/2022 |
| 27 | Renata Ludmila Bazán | Santiago del Estero | Santiago del Estero Capital | Derecho Migratorio y de Extranjería | CPACF T°54 F°291 | Col. Ab. Sgo. del Estero T°3 F°39 | 03/12/2023 |
| 28 | Facundo Emanuel Díaz | Neuquén | Neuquén Capital | Derecho Ambiental | CPACF T°35 F°148 | Col. Ab. Neuquén T°5 F°66 | 14/03/2023 |
| 29 | Abril Constanza Leiva | Río Negro | San Carlos de Bariloche | Microfinanzas y Emprendedurismo | CPACF T°56 F°300 | Col. Ab. Río Negro T°4 F°51 | 26/01/2024 |
| 30 | Ignacio Bautista Domínguez | Chubut | Comodoro Rivadavia | Derecho Penal | CPACF T°31 F°115 | Col. Ab. Chubut T°3 F°40 | 07/07/2022 |
| 31 | Guadalupe Milagros Roldán | Santa Cruz | Río Gallegos | Transparencia y Acceso a la Información Pública | CPACF T°59 F°320 | Col. Ab. Santa Cruz T°1 F°6 | 18/10/2023 |
| 32 | Bautista Lionel Navarro | Tierra del Fuego | Ushuaia | Derecho Laboral | CPACF T°30 F°108 | Col. Ab. Tierra del Fuego T°1 F°5 | 30/04/2022 |
| 33 | Delfina Rosario Paz | La Pampa | Santa Rosa | Derecho de Familia | CPACF T°29 F°100 | Col. Ab. La Pampa T°1 F°4 | 12/11/2022 |
| 34 | Lautaro Joaquín Ferreyra | Buenos Aires | Bahía Blanca | Derecho Bancario y Financiero | CPACF T°61 F°330 | CASI T°22 F°95 | 05/02/2024 |
| 35 | Catalina Emilia Vega | Buenos Aires | San Isidro | Derecho de Seguros | CPACF T°62 F°340 | CASI T°23 F°101 | 21/02/2024 |
| 36 | Thiago Benjamín Quiroga | CABA | CABA | Arbitraje y Mediación | CPACF T°63 F°350 | — | 01/03/2024 |
| 37 | Emma Guadalupe Zalazar | Corrientes | Mercedes | Derecho Civil | CPACF T°27 F°90 | Col. Ab. Corrientes T°5 F°68 | 15/09/2022 |
| 38 | Joaquín Damián Sánchez | Chaco | Charata | Acceso a la Justicia | CPACF T°28 F°95 | Col. Ab. Chaco T°8 F°110 | 08/06/2022 |
| 39 | Pilar Antonella Escobar | Misiones | Eldorado | Derecho Informático y Protección de Datos Personales | CPACF T°64 F°360 | Col. Ab. Misiones T°4 F°55 | 10/03/2024 |
| 40 | Benicio Rodrigo Aráoz | Tucumán | Concepción | Derecho Electoral | CPACF T°26 F°84 | Col. Ab. Tucumán T°11 F°165 | 03/05/2022 |

Usá emails del tipo `nombre.apellido@ejemplo-legalnea.com` (en minúsculas, sin tildes) generados a partir de la columna Nombre y Apellido, y celulares ficticios con formato argentino válido (`+54 9 <código de área> <número>`) coherentes con la provincia de cada fila.

## Funcionalidades adicionales sugeridas para el Administrador (punto 2.c)

Elegí e implementá (o al menos dejá el modelo de datos preparado) para estas, ordenadas por impacto/costo:

1. **Matching automático abogado–caso**: al crear una `solicitud`, sugerir automáticamente hasta 3 abogados aprobados cuya especialidad coincida con el motivo de consulta (podés arrancar con un matcheo simple por especialidad + provincia, sin IA) para que el admin asigne con un clic en lugar de buscar manualmente. Alto impacto, bajo costo — priorizalo para el MVP.
2. **Tablero tipo Kanban de solicitudes** (columnas = estados) además del listado tabular, para que el admin visualice de un vistazo cuántos casos hay en cada etapa. Alto impacto en usabilidad.
3. **Gestión de especialidades desde el panel** (CRUD sobre `especialidades`) para que Legal Nea pueda mantener el listado sin pedir cambios de código.
4. **Auditoría/logs de acciones** (`logs_auditoria`): quién aprobó/rechazó/reasignó qué y cuándo — importante para un sistema que maneja datos sensibles de personas vulnerables y aprobaciones profesionales.
5. **Roles y permisos de sub-administradores**: además del admin general, permitir un rol `admin_lectura` o `moderador` que pueda revisar y comentar pero no aprobar/rechazar ni resetear contraseñas — útil cuando el estudio sume más personal administrativo. Podés dejarlo como fase 2, no bloqueante para el MVP.
6. **Gestión de plantillas de email** desde el panel (editar asunto/cuerpo de `plantillas_email` con un editor WYSIWYG simple), para que el estudio pueda ajustar el copy sin pedir un deploy.
7. **Dashboard de KPIs con series temporales**: altas de abogados por mes, solicitudes resueltas vs. nuevas, tiempo promedio de resolución — útil para que Legal Nea muestre impacto a sponsors/colegios de abogados.
8. **Recordatorios automáticos**: si una solicitud queda más de X días sin cambio de estado, generar una notificación interna al admin (y opcionalmente al abogado asignado) para evitar que se "pierdan" casos.
9. **Exportación programada de reportes** (por ejemplo, un resumen mensual automático por email al admin) — fase 2.
10. **Búsqueda global** (abogados + clientes + solicitudes) desde una sola barra en el panel admin.

## Seguridad y validaciones

- Sanitizar y validar todos los inputs con Zod tanto en cliente como en servidor (nunca confiar solo en la validación de React Hook Form).
- Rate limiting básico en los endpoints públicos de alta (abogado/cliente) para evitar spam/bots — como mínimo, agregar un captcha invisible (por ejemplo Cloudflare Turnstile, que es gratuito) en ambos formularios públicos.
- Los archivos adjuntos: validar tipo MIME real (no solo extensión) y tamaño antes de subir a Storage; nombres de archivo sanitizados (sin caracteres especiales) al guardarlos en el bucket.
- Nunca exponer la Supabase Service Role Key en el bundle del cliente; solo usarla en Server Actions/Route Handlers.
- Las URLs de descarga de adjuntos deben ser firmadas (`createSignedUrl`) y de corta duración.
- Sesiones de Supabase Auth con expiración razonable y refresh automático estándar de Supabase SSR.
- Nunca loggear contraseñas ni tokens en `logs_auditoria` ni en la consola.

## Fases de desarrollo sugeridas

**Fase 1 — MVP (esto es lo que tenés que entregar en esta sesión de trabajo)**
- Modelo de datos + RLS + seed de especialidades y de los 40 abogados demo.
- Formulario público de alta de abogado completo (incluyendo declaración jurada, PDF descargable y animación del martillo).
- Formulario público de alta de cliente completo (incluyendo adjuntos).
- Panel admin: listado y aprobación de abogados, listado y gestión básica de solicitudes (cambiar estado, asignar abogado, notas).
- Panel abogado y panel cliente en su versión básica (ver estado propio, mensajes).
- Envío de los emails transaccionales core (confirmación de alta abogado, confirmación de alta cliente, aprobación/rechazo).
- Login/activación de cuenta funcionando de punta a punta.

**Fase 2 — iteraciones siguientes (dejar preparado el modelo de datos, no implementar todavía salvo que sobre tiempo)**
- Matching automático + Kanban de solicitudes.
- Roles de sub-administrador.
- Gestión de plantillas de email desde el panel.
- Dashboard de KPIs con gráficos y series temporales.
- Recordatorios automáticos de solicitudes estancadas.
- Reportes programados por email.

## Variables de entorno / checklist de deploy (Vercel + Supabase + Resend)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # solo server-side, nunca exponer al cliente
RESEND_API_KEY=
RESEND_FROM_EMAIL=notificaciones@legalneasoft.com   # confirmar dominio verificado en Resend
ADMIN_NOTIFICATION_EMAIL=           # casilla del estudio que recibe copia de altas nuevas
NEXT_PUBLIC_SITE_URL=               # para armar links absolutos en los emails
NOMINATIM_USER_AGENT=LegalNeaSoft/1.0 (contacto@legalneasoft.com)  # requerido por la política de uso de Nominatim
```

Checklist antes de dar por cerrado el MVP:
- [ ] Migraciones de Supabase aplicadas y RLS habilitado en todas las tablas (probar con un usuario de cada rol que NO pueda ver lo que no le corresponde).
- [ ] Dominio verificado en Resend y emails de prueba enviados a una casilla real.
- [ ] Bucket de Storage privado, con políticas probadas (un cliente no puede leer el adjunto de otro).
- [ ] Formularios probados en mobile (la mayoría de los abogados/clientes van a completar esto desde el celular).
- [ ] `prefers-reduced-motion` respetado en la animación del martillo.
- [ ] Variables de entorno cargadas en Vercel (Production y Preview).
- [ ] Seed de 40 abogados + especialidades corrido en el entorno de producción o en uno de demo separado (a definir con el cliente si los datos ficticios van a producción o solo a un entorno de staging).

## Restricciones (Constraints)

- No agregues autenticación social (Google/Facebook login) ni ningún feature no pedido acá — el cliente no lo solicitó.
- No uses `localStorage`/`sessionStorage` para nada sensible (tokens, datos de sesión); confiá en el manejo de sesión estándar de Supabase Auth SSR con cookies.
- No hardcodees el contenido de la Declaración Jurada como imagen; debe ser texto real (accesible, seleccionable, indexable) tanto en el modal como en el PDF generado.
- No implementes la integración con WhatsApp Business API (fue descartada explícitamente).
- No uses Google Places/Maps (fue descartado explícitamente, usar Nominatim).
- Solo agregá dependencias nuevas si son necesarias para lo pedido; si dudás, preguntame antes de instalar algo no listado en el stack.

## Criterios de aceptación

- [ ] Un usuario anónimo puede completar y enviar el formulario de alta de abogado, ver la declaración jurada, descargarla en PDF, aceptarla, ver la animación del martillo y encontrarse a sí mismo agregado al listado en vivo (una vez aprobado por el admin, o inmediatamente si decidís mostrar también los pendientes con otro estilo — a definir, pero como mínimo los aprobados se listan).
- [ ] Un usuario anónimo puede completar y enviar el formulario de alta de cliente, adjuntar archivos, aceptar la declaración de veracidad y ver el mensaje de confirmación.
- [ ] Al enviar cualquiera de los dos formularios, llega un email real (via Resend) a la casilla cargada.
- [ ] El admin puede loguearse, ver la lista de abogados pendientes, aprobar uno y verificar que ese abogado recibe el email de aprobación con link de activación.
- [ ] El admin puede ver una solicitud de cliente, asignarle un abogado y cambiarle el estado.
- [ ] El admin puede resetear la contraseña de un abogado/cliente desde el panel.
- [ ] Un abogado logueado solo ve sus propios datos (verificado probando con dos cuentas distintas).
- [ ] Un cliente logueado solo ve sus propias solicitudes (verificado probando con dos cuentas distintas).
- [ ] La base tiene las 40 filas de abogados demo con sus especialidades correctamente vinculadas.
- [ ] `npm run build` compila sin errores y las políticas RLS quedan documentadas en el propio SQL de migración (comentarios).

## Condiciones de parada (Stop Conditions)

Detenete y preguntame antes de:
- Elegir un proveedor o librería no mencionado en el stack técnico.
- Modificar el modelo de datos propuesto de forma estructural (agregar/quitar tablas, cambiar relaciones).
- Definir el copy final de algún email o mensaje si tenés dudas de tono (mejor preguntame antes que inventar algo que suene poco profesional).
- Hardcodear el número de teléfono de contacto (dejalo como placeholder/variable hasta que yo lo confirme).
- Decidir si los datos demo (los 40 abogados) van a producción o a un entorno de staging separado.

## Progreso

Después de cada paso completado, reportá: `✅ [qué se hizo] — [archivo(s) afectados]`. Si te encontrás con una decisión de diseño no cubierta acá, tomá la opción más simple y razonable, dejala documentada en un comentario, y avisame en tu resumen de progreso para que la revise.

## Estrategia de sesión

Sesión nueva — proyecto greenfield, no hay contexto previo que preservar. Empezá por el modelo de datos y las migraciones de Supabase (es la base de todo lo demás), después los formularios públicos, después los paneles. Si en algún punto el contexto se llena, corré `/compact` enfocado en "estado actual del modelo de datos y qué falta de la especificación funcional" antes de seguir.

---

🎯 **Target:** Claude Code (extensión de VS Code o CLI) — asumí esto como agente de destino porque mencionaste "Visual Studio Code"; si en realidad vas a usar GitHub Copilot Chat, Cursor o Windsurf avisame y te adapto el formato (ellos necesitan anclar el prompt a archivos concretos, que acá todavía no existen).
💡 Prompt de tipo "Task Brief" para tarea agéntica compleja de creación desde cero: todo el contexto de negocio, modelo de datos, flujos y criterios de aceptación va en un único primer turno para que el agente no tenga que adivinar nada ni volver a preguntarte lo básico.

Antes de pegar esto en el chat de tu agente:
1. Creá el repo/proyecto Next.js vacío (o dejá que el propio agente lo scaffoldee como primer paso) y el proyecto en Supabase antes de arrancar, para tener las keys a mano.
2. Reemplazá el placeholder de teléfono de contacto por el número real una vez que lo confirmes con Legal Nea.
3. Este prompt es para una herramienta agéntica con acceso real al sistema de archivos y, eventualmente, a tu base de Supabase. Revisá el alcance, las restricciones y las condiciones de parada antes de pegarlo, y confirmá que las rutas y el nombre del proyecto coincidan con tu entorno real.
