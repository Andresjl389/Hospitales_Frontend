// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/types/auth';
import { 
  Home, 
  BookOpen, 
  History, 
  Settings,
  Users,
  BarChart3,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  user: User;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const userNavItems: NavItem[] = [
    {
      label: 'Inicio',
      href: '/user',
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: 'Capacitaciones',
      href: '/user/capacitaciones',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: 'Historial',
      href: '/user/historial',
      icon: <History className="w-5 h-5" />,
    },
    {
      label: 'Configuración',
      href: '/user/configuracion',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: 'Capacitaciones',
      href: '/admin/capacitaciones',
      icon: <FolderOpen className="w-5 h-5" />,
    },
    {
      label: 'Usuarios',
      href: '/admin/usuarios',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Configuración',
      href: '/user/configuracion',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const isAdmin = user.role.name === 'Admin';
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const filteredNavItems = navItems.filter(
    item => !item.roles || item.roles.includes(user.role.name)
  );

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 hidden lg:block overflow-y-auto padding: calc(var(--spacing) * <15px>);">
      <nav className="p-4 space-y-1 pt-7">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Información adicional */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="font-medium">{user.area.name || 'Sin área asignada'}</p>
          <p className="mt-1">{user.role.name || 'Sin cargo'}</p>
        </div>
      </div>
    </aside>
  );
}