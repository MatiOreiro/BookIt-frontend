# BookIt Frontend

Frontend de la plataforma de gestión de salones de eventos y servicios complementarios.

## Descripción

Aplicación web desarrollada en **React + TypeScript** con **Vite**, orientada a la interacción de usuarios con la plataforma BookIt. Permite la búsqueda de salones y servicios, autenticación de usuarios, gestión de reservas y visualización de información.

## Stack tecnológico

- **React 19** – UI
- **TypeScript** – tipado estático
- **Vite** – bundler y servidor de desarrollo
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
   ```bash
   cp .env.example .env
   ```
2. Editar `.env` y configurar la URL del backend:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

## Instalación

```bash
npm install
```

## Scripts disponibles

| Comando             | Descripción                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Inicia el servidor de desarrollo         |
| `npm run build`     | Genera el build de producción en `dist/` |
| `npm run lint`      | Ejecuta ESLint                           |
| `npm run preview`   | Previsualiza el build de producción      |

## Rutas

| Ruta                 | Acceso    | Descripción                  |
| -------------------- | --------- | ---------------------------- |
| `/`                  | Público   | Página de inicio             |
| `/login`             | Público   | Inicio de sesión             |
| `/register`          | Público   | Registro de usuarios         |
| `/services/register` | Protegido | Registro de servicios        |

Las rutas protegidas redirigen a `/login` si el usuario no está autenticado.

