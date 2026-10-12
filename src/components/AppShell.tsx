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
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}
