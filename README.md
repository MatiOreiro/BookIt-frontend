# 📅 Bookit — Frontend

> Este repo es el **frontend** de Bookit. El backend vive en un repo aparte → **[BookIt-backend](https://github.com/MatiOreiro/BookIt-backend)**

Marketplace para la reserva de salones de eventos y servicios complementarios en el mercado uruguayo. Proyecto de tesis (capstone) de **Analista en Tecnologías de la Información**, Universidad ORT Uruguay — 8 sprints, desarrollo en curso hasta agosto de 2026.

## 🚀 ¿Qué resuelve?

Conecta a organizadores de eventos con salones y proveedores de servicios complementarios en una única plataforma: buscar, comparar, agendar una visita o reservar de punta a punta.

## 🛠️ Stack técnico

- **Next.js 14** — framework y servidor de desarrollo/producción
- **React 18** + **TypeScript**
- **React Router v7** — el ruteo real de la app corre del lado del cliente con React Router, montado dentro de Next.js a través de una página catch-all. Es un patrón poco común (SPA embebida en Next.js) que vale la pena poder explicar en una entrevista.
- **Axios** — cliente HTTP con interceptores JWT
- **next-cloudinary** — carga y gestión de imágenes
- **react-day-picker** + **date-fns** — selección de fecha/hora para reservas
- **react-toastify** — notificaciones

## ✨ Funcionalidades (verificadas en el código)

- Búsqueda y listado de salones/servicios (`/services`, `/lounges`)
- Ficha de detalle por servicio: galería de imágenes con lightbox, mapa embebido de Google Maps, contacto directo por WhatsApp
- Sistema de reseñas y calificación por estrellas, con soporte de fotos **y video** en los comentarios
- Flujo de reserva con selector de fecha/hora (`/services/:id/agendar`, `/services/:id/reservar`)
- Autenticación con rutas protegidas (`ProtectedRoute`) y control de acceso por rol (`vendedor` / `vendor` / `salon`)
- Registro y edición de servicios para proveedores
- **Dashboard de vendedor** con próximas visitas/reservas de los siguientes 7 días
- **Dashboard de propietario de servicio**
- **Seguimiento de pagos por reserva**: cada reserva calcula el saldo pendiente (monto acordado menos pagos registrados) — confirmado en el código (`pagoService.ts`, cálculo de `saldoPendiente` en el dashboard de vendedor)
- Página "Mis Trámites" — seguimiento de reservas/solicitudes del usuario
- Perfil de usuario y cambio de contraseña
- **Seguimiento de ingresos totales agregados** en el dashboard del dueño del servicio

## 🚫 Fuera de alcance

- **Soporte de video**: descartado del alcance del proyecto en general — no se llegó a explorar la integración con Cloudinary para ese caso de uso. El componente de reseñas conserva código que detecta y renderiza archivos de video (`mediaUrls` con `.mp4/.mov/.webm`), pero es un remanente que no forma parte del alcance validado; no se probó ni se documentó como funcionalidad activa.
- Pasarela de pago completa: el sistema registra pagos y calcula saldos, pero no procesa cobros end-to-end contra un proveedor externo (Mercado Pago, Stripe, etc.)

## 🧭 Rutas principales

| Ruta | Acceso | Página |
|---|---|---|
| `/` | Público | Inicio |
| `/login` | Público | Inicio de sesión |
| `/register/user` | Público | Registro de usuarios |
| `/services`, `/lounges` | Público | Listado de servicios/salones |
| `/services/:id`, `/lounges/:id` | Público | Detalle de servicio |
| `/services/:id/agendar`, `/services/:id/reservar` | Protegido | Reserva/agenda de visita |
| `/services/register` | Protegido | Alta de servicio |
| `/services/:id/edit` | Protegido (rol vendedor/vendor/salon) | Edición de servicio |
| `/vendor/dashboard` | Protegido (rol vendedor/vendor/salon) | Dashboard de vendedor |
| `/vendor/services/:id` | Protegido (rol vendedor/vendor/salon) | Dashboard de propietario del servicio |
| `/mis-tramites` | Protegido | Seguimiento de trámites del usuario |
| `/profile` | Protegido | Perfil |
| `/change-password` | Protegido | Cambio de contraseña |

Las rutas protegidas redirigen a `/login` si el usuario no está autenticado.

## 🧪 Testing

- Suite de **94 casos de prueba** (CP-01 a CP-94) documentados, con Playwright para los flujos end-to-end principales de reserva y gestión.

## 📐 Metodología

Desarrollado en 8 sprints con metodología ágil (a través de agosto 2026), incluyendo un grupo focal de validación con usuarios reales que confirmó la propuesta de valor del sistema.

## 🖥️ Capturas

_Próximamente_

## ⚙️ Cómo correrlo localmente

### Requisitos previos

- Node.js ≥ 18
- npm ≥ 9

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/MatiOreiro/BookIt-frontend.git
cd BookIt-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
```

Editar `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5062
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_unsigned_upload_preset
```

En despliegue (por ejemplo Vercel), usar la URL pública del backend:

```
NEXT_PUBLIC_API_BASE_URL=https://bookit-backend-es10.onrender.com/
```

```bash
# 4. Levantar el servidor de desarrollo
npm run dev
```

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción en `.next/` |
| `npm run start` | Ejecuta la build de producción |
| `npm run lint` | Ejecuta ESLint |

## 👤 Autores

Matías Oreiro — [LinkedIn](https://www.linkedin.com/in/matiasoreiro/)
Matias Pietrafesa — [LinkedIn](https://www.linkedin.com/in/matias-pietrafesa-47084b321/)
