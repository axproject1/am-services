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
  updatePerfil: (datos: { nombre?: string; email?: string; password?: string }) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  cargando: true,
  isAdmin: false,
  isEmpleado: false,
  login: async () => ({ ok: false }),
  logout: () => {},
  updatePerfil: async () => ({ ok: false }),
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

  const updatePerfil = async (datos: { nombre?: string; email?: string; password?: string }) => {
    if (!usuario) return { ok: false, error: 'No hay sesión activa.' };
    try {
      const payload: { nombre?: string; email?: string; password_hash?: string } = {};
      if (datos.nombre) payload.nombre = datos.nombre.trim();
      if (datos.email) payload.email = datos.email.trim();
      if (datos.password && datos.password.trim()) payload.password_hash = datos.password.trim();

      await DataService.actualizarUsuario(usuario.id, payload);

      const updatedUser: Usuario = {
        ...usuario,
        ...(payload.nombre ? { nombre: payload.nombre } : {}),
        ...(payload.email ? { email: payload.email } : {}),
      };

      setUsuario(updatedUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Error al actualizar perfil.' };
    }
  };

  const isAdmin = usuario?.rol === 'admin';
  const isEmpleado = usuario?.rol === 'empleado';

  return (
    <AuthContext.Provider value={{ usuario, cargando, isAdmin, isEmpleado, login, logout, updatePerfil }}>
      {children}
    </AuthContext.Provider>
  );
}
