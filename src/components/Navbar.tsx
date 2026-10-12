'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  PlusCircle,
  History,
  Building2,
  Cloud,
  Users,
  LogOut,
  Shield,
  UserCog,
  ChevronDown,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const { usuario, isAdmin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Construir items de navegación según rol
  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard, adminOnly: true },
    { label: 'Nuevo Documento', href: '/editor', icon: PlusCircle, adminOnly: false },
    { label: isAdmin ? 'Historial' : 'Mis Documentos', href: '/historial', icon: History, adminOnly: false },
    { label: 'Empresa', href: '/configuracion', icon: Building2, adminOnly: true },
    { label: 'Usuarios', href: '/usuarios', icon: Users, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-50 bg-navy shadow-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <Link href={isAdmin ? "/" : "/editor"} className="flex items-center gap-3 group">
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
            {filteredNavItems.map(item => {
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

          {/* Estado de Conexión, Usuario y Badges */}
          <div className="flex items-center gap-3">
            {isSupabaseConfigured && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Cloud className="w-3.5 h-3.5" />
                Cloud
              </span>
            )}

            {/* Menú de usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isAdmin ? 'bg-violet-500' : 'bg-blue-500'}`}>
                  {usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold leading-tight">{usuario?.nombre}</p>
                  <p className="text-[10px] text-blue-300 flex items-center gap-1">
                    {isAdmin ? <Shield className="w-2.5 h-2.5" /> : <UserCog className="w-2.5 h-2.5" />}
                    {isAdmin ? 'Admin' : 'Empleado'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-300" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-navy">{usuario?.nombre}</p>
                      <p className="text-xs text-slate-500">{usuario?.email}</p>
                      <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isAdmin ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isAdmin ? <Shield className="w-2.5 h-2.5" /> : <UserCog className="w-2.5 h-2.5" />}
                        {isAdmin ? 'Administrador' : 'Empleado'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>

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
