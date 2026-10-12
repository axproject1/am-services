'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  PlusCircle,
  History,
  Building2,
  Database,
  Cloud,
  HardDrive,
  Users,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Nuevo Documento', href: '/editor', icon: PlusCircle },
    { label: 'Historial', href: '/historial', icon: History },
    { label: 'Empresa', href: '/configuracion', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-navy shadow-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-moran-blue flex items-center justify-center text-white shadow-inner font-bold text-xl group-hover:scale-105 transition-transform">
              SM
            </div>
            <div>
              <div className="font-bold text-lg leading-tight tracking-tight flex items-center gap-2">
                SERVICIOS MORÁN
              </div>
              <div className="text-xs text-blue-200">Sistema de Documentos Comerciales</div>
            </div>
          </Link>

          {/* Enlaces de Navegación */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-moran-blue text-white shadow-sm'
                      : 'text-blue-100 hover:bg-navy-light hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Estado de Conexión & Badges */}
          <div className="flex items-center gap-3">
            {isSupabaseConfigured && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Cloud className="w-3.5 h-3.5" />
                Cloud
              </span>
            )}

            <Link
              href="/editor"
              className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Crear
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
