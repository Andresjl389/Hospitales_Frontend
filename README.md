# Hospitales Frontend

Frontend del Sistema de Capacitaciones para hospitales, construido con Next.js 15, React 19 y Tailwind CSS.

## Requisitos previos
- Node.js 18.17+ (recomendado 20 LTS)
- npm 8+ (o el gestor que prefieras)
- Backend FastAPI disponible (local o desplegado)

## Instalación
```bash
# Instalar dependencias
npm install

# Levantar en desarrollo (puerto 3000)
npm run dev
```
La app estará disponible en http://localhost:3000.

## Configuración de entorno
1) Crea el archivo `.env.local` en la raíz (si no existe).
2) Coloca las variables necesarias:
```env
# URL del backend de FastAPI
NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_API_URL=https://hospitales-1dhz.onrender.com

# Metadatos de la app (opcional)
NEXT_PUBLIC_APP_NAME="Sistema de Capacitaciones - Hospital"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```
- Usa la URL del backend local (`http://localhost:8000`) o la URL desplegada.
- No subas `.env.local` al repositorio (ya está en `.gitignore`).

## Scripts útiles
- `npm run dev`: entorno de desarrollo con Turbopack.
- `npm run build`: build de producción.
- `npm start`: servir el build.
- `npm run lint`: análisis de linting.

## Estructura rápida
- `src/app/(public)/page.tsx`: pantalla de login.
- `src/lib/constants.ts`: configuración base y constantes.
- `public/`: assets estáticos.

## Troubleshooting
- Verifica que `NEXT_PUBLIC_API_URL` responda (`/api` si corresponde).
- Si usas otra versión de Node, elimina `node_modules` y reinstala.
