'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Shield,
  UserCog,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  X,
  Pencil,
  KeyRound,
} from 'lucide-react';
import { DataService } from '@/lib/supabase';
import { Usuario } from '@/lib/types';
import { useAuth } from '@/components/AuthContext';
import { ModalPerfil } from '@/components/ModalPerfil';

export default function UsuariosPage() {
  const { isAdmin, usuario: loggedUser } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showModalPerfil, setShowModalPerfil] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Formulario nuevo usuario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rol, setRol] = useState<'admin' | 'empleado'>('empleado');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const users = await DataService.getUsuarios();
    setUsuarios(users);
    setCargando(false);
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setMensaje({ tipo: 'error', texto: 'Completa todos los campos.' });
      return;
    }
    setGuardando(true);
    try {
      await DataService.crearUsuario(nombre.trim(), email.trim(), password, rol);
      setMensaje({ tipo: 'ok', texto: `Usuario "${nombre}" creado exitosamente.` });
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('empleado');
      setMostrarFormulario(false);
      await cargarUsuarios();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al crear usuario.' });
    }
    setGuardando(false);
    setTimeout(() => setMensaje(null), 4000);
  };

  const handleToggleActivo = async (user: Usuario) => {
    if (String(user.id) === String(loggedUser?.id)) {
      setMensaje({ tipo: 'error', texto: 'No puedes desactivarte a ti mismo.' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    try {
      await DataService.actualizarUsuario(user.id, { activo: !user.activo });
      await cargarUsuarios();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  const handleCambiarRol = async (user: Usuario) => {
    if (String(user.id) === String(loggedUser?.id)) {
      setMensaje({ tipo: 'error', texto: 'No puedes cambiar tu propio rol.' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    const nuevoRol = user.rol === 'admin' ? 'empleado' : 'admin';
    try {
      await DataService.actualizarUsuario(user.id, { rol: nuevoRol });
      await cargarUsuarios();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  const handleEliminar = async (user: Usuario) => {
    if (String(user.id) === String(loggedUser?.id)) {
      setMensaje({ tipo: 'error', texto: 'No puedes eliminar tu propia cuenta.' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar a "${user.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await DataService.eliminarUsuario(user.id);
      await cargarUsuarios();
      setMensaje({ tipo: 'ok', texto: `Usuario "${user.nombre}" eliminado.` });
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-32 text-slate-500">
        <Shield className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <p className="text-xl font-bold text-navy mb-2">Acceso Restringido</p>
        <p className="text-sm">Solo los administradores pueden gestionar usuarios.</p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-moran-blue" />
        Cargando usuarios...
      </div>
    );
  }

  return (
    <>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-navy flex items-center gap-3">
            <Users className="w-8 h-8 text-moran-blue" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500 mt-1">Crea y administra las cuentas del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModalPerfil(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 shadow-sm transition-all hover:scale-[1.02]"
          >
            <KeyRound className="w-4 h-4 text-moran-blue" />
            Mi Cuenta / Contraseña
          </button>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="inline-flex items-center gap-2 bg-moran-blue hover:bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200/50 transition-all hover:scale-[1.02]"
          >
            {mostrarFormulario ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {mostrarFormulario ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-6 ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {mensaje.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {mensaje.texto}
        </div>
      )}

      {/* Formulario Nuevo Usuario */}
      {mostrarFormulario && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-navy mb-4">Crear Nuevo Usuario</h3>
          <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="juan@serviciosmoran.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Rol</label>
              <select
                value={rol}
                onChange={e => setRol(e.target.value as 'admin' | 'empleado')}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white"
              >
                <option value="empleado">Empleado (acceso limitado)</option>
                <option value="admin">Administrador (acceso completo)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Usuario</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Rol</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map(user => {
                const esYoMismo = String(user.id) === String(loggedUser?.id);
                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${user.rol === 'admin' ? 'bg-violet-500' : 'bg-blue-500'}`}>
                          {user.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-navy">{user.nombre}</p>
                          {esYoMismo && <span className="text-xs text-blue-500 font-medium">(Tú)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleCambiarRol(user)}
                        disabled={esYoMismo}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          user.rol === 'admin'
                            ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        } ${esYoMismo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={esYoMismo ? 'No puedes cambiar tu propio rol' : 'Clic para cambiar rol'}
                      >
                        {user.rol === 'admin' ? <Shield className="w-3 h-3" /> : <UserCog className="w-3 h-3" />}
                        {user.rol === 'admin' ? 'Admin' : 'Empleado'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleActivo(user)}
                        disabled={esYoMismo}
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          user.activo
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } ${esYoMismo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={esYoMismo ? 'No puedes desactivarte' : 'Clic para cambiar estado'}
                      >
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {esYoMismo ? (
                        <button
                          onClick={() => setShowModalPerfil(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-moran-blue bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                          title="Editar mi nombre, correo o contraseña"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar Mis Datos
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEliminar(user)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda de roles */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-violet-600" />
            <h4 className="font-bold text-navy text-sm">Administrador</h4>
          </div>
          <p className="text-xs text-slate-500">
            Acceso completo: crea documentos, ve precios y totales, accede al historial de todos, configura la empresa y gestiona usuarios.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-navy text-sm">Empleado</h4>
          </div>
          <p className="text-xs text-slate-500">
            Acceso limitado: crea documentos sin ver precios ni totales, solo ve sus propios documentos, sin acceso a configuración ni gestión de usuarios.
          </p>
        </div>
      </div>

      {/* Modal para editar mi perfil */}
      <ModalPerfil
        isOpen={showModalPerfil}
        onClose={() => {
          setShowModalPerfil(false);
          cargarUsuarios();
        }}
      />
    </>
  );
}
