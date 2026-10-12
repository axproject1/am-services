'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, RolUsuario } from '@/lib/types';
import { DataService } from '@/lib/supabase';

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  isAdmin: boolean;
  isEmpleado: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  cargando: true,
  isAdmin: false,
  isEmpleado: false,
  login: async () => ({ ok: false }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_KEY = 'moran_sesion';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar sesión al iniciar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Usuario;
        if (parsed && parsed.id && parsed.email) {
          setUsuario(parsed);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setCargando(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const user = await DataService.login(email, password);
      if (!user) {
        return { ok: false, error: 'Credenciales incorrectas o usuario inactivo.' };
      }
      setUsuario(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Error al iniciar sesión.' };
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const isAdmin = usuario?.rol === 'admin';
  const isEmpleado = usuario?.rol === 'empleado';

  return (
    <AuthContext.Provider value={{ usuario, cargando, isAdmin, isEmpleado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
