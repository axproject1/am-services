'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/Navbar';
import LoginPage from '@/components/LoginPage';

function AppContent({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-moran-blue" />
      </div>
    );
  }

  if (!usuario) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">{children}</main>
      <footer className="mt-auto py-5 border-t border-slate-200 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Servicios Morán — Sistema de Documentos Comerciales</p>
          <a
            href="https://axnetworksolutions.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold border border-slate-200/80 transition-all hover:scale-105 shadow-sm group"
          >
            <span className="text-slate-500">Developed by</span>
            <img
              src="/assets/ax-logo-negro.png"
              alt="axnetworksolutions"
              className="h-5 w-auto object-contain"
            />
          </a>
        </div>
      </footer>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}
