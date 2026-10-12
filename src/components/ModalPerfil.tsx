'use client';

import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Save, X, Loader2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

interface ModalPerfilProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalPerfil({ isOpen, onClose }: ModalPerfilProps) {
  const { usuario, updatePerfil } = useAuth();
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  if (!isOpen || !usuario) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre y correo no pueden estar vacíos.' });
      return;
    }

    if (password && password !== confirmPassword) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }

    if (password && password.length < 4) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 4 caracteres.' });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    const res = await updatePerfil({
      nombre: nombre.trim(),
      email: email.trim(),
      password: password ? password.trim() : undefined,
    });

    setGuardando(false);

    if (res.ok) {
      setMensaje({ tipo: 'ok', texto: '¡Tus datos han sido actualizados con éxito!' });
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setMensaje(null);
        onClose();
      }, 1500);
    } else {
      setMensaje({ tipo: 'error', texto: res.error || 'Error al actualizar perfil.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-navy to-moran-blue text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">Mi Perfil</h3>
              <p className="text-xs text-blue-200">Cambiar usuario, correo y contraseña</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {mensaje && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
              mensaje.tipo === 'ok'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {mensaje.tipo === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {mensaje.texto}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Nombre de Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none transition-all"
                placeholder="Ej. Administrador"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none transition-all"
                placeholder="admin@moran.com"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Cambiar Contraseña (Opcional)</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Dejar en blanco para no cambiarla"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {password && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      required
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 bg-moran-blue hover:bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
