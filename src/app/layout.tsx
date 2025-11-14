// src/app/layout.tsx
import type { Metadata } from 'next';
import '../styles/globals.css'; // Ajusta la ruta según donde tengas tu archivo CSS

export const metadata: Metadata = {
  title: 'Sistema de Capacitaciones - Hospital',
  description: 'Plataforma de gestión y administración de capacitaciones para el personal del hospital',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}