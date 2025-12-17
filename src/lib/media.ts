const normalizeBaseUrl = (url?: string | null) => {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const normalizePath = (path?: string | null) => {
  if (!path) return "";
  return path.startsWith("/") ? path.slice(1) : path;
};

/**
 * Devuelve una URL absoluta para assets (imagen/video) que vienen como rutas relativas del backend.
 * Si ya es una URL absoluta, se regresa tal cual.
 */
export const buildMediaUrl = (path?: string | null) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const base = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  const cleanPath = normalizePath(path);

  if (!base) {
    // Mejor devolver ruta relativa con slash para evitar 404 por doble slash
    return `/${cleanPath}`;
  }

  return `${base}/${cleanPath}`;
};
