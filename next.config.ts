// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir que Next.js maneje las cookies del backend
  async rewrites() {
    return [
      // Si tu backend está en un puerto diferente, esto ayuda con CORS
      // Elimina esto si tu backend está en el mismo dominio
    ];
  },
  
  // Configuración para desarrollo
  reactStrictMode: true,
};

export default nextConfig;