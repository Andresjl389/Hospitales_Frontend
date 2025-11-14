// src/middleware.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;
  const path = request.nextUrl.pathname;


  console.log('🔍 Middleware - Path:', pathname, 'Token:', token ? 'existe' : 'no existe');

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/', '/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Rutas protegidas
  const protectedRoutes = ['/user', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Si no hay token y es ruta protegida, redirigir al login
  if (!token && isProtectedRoute) {
    console.log('❌ Sin token en ruta protegida, redirigiendo a login');
    const response = NextResponse.redirect(new URL('/', request.url));
    return response;
  }

  if (token && path === "/") {
    try {
      // Decodificar payload del token (sin validar firma)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload?.role || "user";

      // Redirigir según rol
      let redirectPath = "/";
      switch (role) {
        case "admin":
          redirectPath = "/admin";
          break;
        case "user":
          redirectPath = "/user";
          break;
        default:
          redirectPath = "/user";
      }

      return NextResponse.redirect(new URL(redirectPath, request.url));
    } catch (err) {
      console.error("Error al decodificar token:", err);
      // Si el token es inválido, eliminar cookie y quedarse en login
      const res = NextResponse.next();
      res.cookies.delete("access_token");
      return res;
    }
  }

  if(!token){
    const response = NextResponse.redirect(new URL('/', request.url))
  }


  // NO redirigir automáticamente si hay token y está en login
  // Esto permite que el logout funcione y que se pueda volver al login
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};