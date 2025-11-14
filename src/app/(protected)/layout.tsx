// src/app/(protected)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ConfirmProvider } from '@/components/ui/ConfirmProvider';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    console.log('🔒 Protected Layout - Estado:', { user, loading, pathname });
    
    if (!loading) {
      if (!user) {
        console.log('❌ No hay usuario, redirigiendo a login...');
        router.push('/');
      } else {
        console.log('✅ Usuario autenticado:', user.email);
        setShouldRender(true);
      }
    }
  }, [user, loading, router, pathname]);

  // Mostrar loading mientras verifica
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // No renderizar si no hay usuario
  if (!user || !shouldRender) {
    return null;
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar user={user} />
          <div className="flex pt-16">
            <Sidebar user={user} />
            <main className="flex-1 p-6 lg:ml-64">{children}</main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
