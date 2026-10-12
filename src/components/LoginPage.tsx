'use client';

import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    setCargando(true);
    setError('');
    const result = await login(email.trim(), password);
    if (!result.ok) {
      setError(result.error || 'Error al iniciar sesión.');
    }
    setCargando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-2xl shadow-blue-500/30 mb-4">
            <span className="text-3xl font-black">SM</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">SERVICIOS MORÁN</h1>
          <p className="text-blue-300/70 text-sm mt-1">Sistema de Documentos Comerciales</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white/[0.08] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Email */}
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-blue-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Ingresar
                </>
              )}
            </button>
          </form>

          <p className="text-center text-blue-300/40 text-xs mt-6">
            Contacta al administrador si no tienes credenciales.
          </p>
        </div>

        {/* Créditos del desarrollador */}
        <div className="mt-8 text-center">
          <a
            href="https://axnetworksolutions.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-blue-200 text-xs font-semibold backdrop-blur-md border border-white/10 transition-all hover:scale-105 group"
          >
            <span className="text-blue-300/80">Developed by</span>
            <img
              src="/assets/ax-logo-blanco.png"
              alt="AX Network Solutions"
              className="h-5 w-auto object-contain"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
