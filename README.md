# BookIt Frontend

Frontend de la plataforma de gestión de salones de eventos y servicios complementarios.

## Descripción

Aplicación web desarrollada en **Next.js + React + TypeScript**, orientada a la interacción de usuarios con la plataforma BookIt. Permite la búsqueda de salones y servicios, autenticación de usuarios, gestión de reservas y visualización de información.

## Stack tecnológico

- **Next.js 14** – framework web
- **React 18** – UI
- **TypeScript** – tipado estático
- **React Router v7** – navegación del lado del cliente
- **Axios** – cliente HTTP con interceptores JWT

## Estructura del proyecto

```
src/
├── api/          # Cliente Axios configurado
├── components/   # Componentes reutilizables (Layout, ProtectedRoute)
├── context/      # AuthContext (estado global de autenticación)
├── hooks/        # Custom hooks (useAuth)
├── pages/        # Páginas de la aplicación
├── routes/       # Configuración de React Router
├── services/     # Llamadas a la API REST
├── types/        # Interfaces TypeScript
└── utils/        # Utilidades (navegación programática)
```

## Requisitos previos

- Node.js ≥ 18
- npm ≥ 9

## Configuración

1. Copiar el archivo de variables de entorno:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Editar `.env` y configurar la URL del backend:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://bookit-backend-es10.onrender.com/
   ```

En despliegue (por ejemplo Vercel), configurar la misma variable con la URL pública del backend:

```
NEXT_PUBLIC_API_BASE_URL=https://bookit-backend-es10.onrender.com/
```

## Instalación

```bash
npm install
```

## Scripts disponibles

| Comando             | Descripción                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Inicia el servidor de desarrollo         |
| `npm run build`     | Genera el build de producción en `.next/` |
| `npm run lint`      | Ejecuta ESLint                           |
| `npm run start`     | Ejecuta la build de producción           |

## Rutas

| Ruta                 | Acceso    | Descripción                  |
| -------------------- | --------- | ---------------------------- |
| `/`                  | Público   | Página de inicio             |
| `/login`             | Público   | Inicio de sesión             |
| `/register`          | Público   | Registro de usuarios         |
| `/services/register` | Protegido | Registro de servicios        |
| `/register/service`  | Público   | Registro de servicios        |

Las rutas protegidas redirigen a `/login` si el usuario no está autenticado.

