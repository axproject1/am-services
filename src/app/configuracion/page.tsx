'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Database,
  Cloud,
  HardDrive,
  Upload,
  Image as ImageIcon,
  Shield,
} from 'lucide-react';
import { DataService, isSupabaseConfigured } from '@/lib/supabase';
import { EmpresaConfig, TerminoCondicion } from '@/lib/types';
import { useAuth } from '@/components/AuthContext';

export default function ConfiguracionPage() {
  const { isAdmin } = useAuth();
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Campos editables
  const [nombre, setNombre] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [rucNit, setRucNit] = useState('');
  const [itbmsDefault, setItbmsDefault] = useState(7.0);
  const [terminosDefault, setTerminosDefault] = useState<TerminoCondicion[]>([]);
  const [gmailPassword, setGmailPassword] = useState('');

  useEffect(() => {
    (async () => {
      const emp = await DataService.getEmpresa();
      setEmpresa(emp);
      setNombre(emp.nombre);
      setSubtitulo(emp.subtitulo);
      setLogoPath(emp.logo_path || '');
      setTelefono(emp.telefono);
      setEmail(emp.email);
      setDireccion(emp.direccion);
      setRucNit(emp.ruc_nit);
      setItbmsDefault(emp.itbms_default);
      setTerminosDefault(emp.terminos_default || []);
      setCargando(false);
    })();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const b64 = event.target?.result as string;
      setLogoPath(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const config: EmpresaConfig = {
        ...empresa,
        id: empresa?.id || 1,
        nombre,
        subtitulo,
        logo_path: logoPath,
        telefono,
        email,
        direccion,
        ruc_nit: rucNit,
        itbms_default: itbmsDefault,
        terminos_default: terminosDefault,
        gmail_app_password: gmailPassword || empresa?.gmail_app_password,
        activa: true,
      };

      await DataService.saveEmpresa(config);
      setMensaje({ tipo: 'ok', texto: 'Configuración guardada exitosamente.' });
      setTimeout(() => setMensaje(null), 4000);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar la configuración.' });
    } finally {
      setGuardando(false);
    }
  };

  // Gestión de términos por defecto
  const agregarTermino = () => setTerminosDefault(prev => [...prev, { label: '', value: '' }]);
  const eliminarTermino = (idx: number) => setTerminosDefault(prev => prev.filter((_, i) => i !== idx));
  const updateTermino = (idx: number, field: 'label' | 'value', val: string) => {
    setTerminosDefault(prev => {
      const copia = [...prev];
      copia[idx][field] = val;
      return [...copia];
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-moran-blue" />
        Cargando configuración...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-32 text-slate-500">
        <Shield className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <p className="text-xl font-bold text-navy mb-2">Acceso Restringido</p>
        <p className="text-sm text-slate-400 mb-6">Solo los administradores pueden modificar los datos institucionales de la empresa.</p>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 bg-moran-blue hover:bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all"
        >
          Ir al Editor de Documentos
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-navy flex items-center gap-3">
            <Building2 className="w-8 h-8 text-moran-blue" />
            Configuración de la Empresa
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra los datos fiscales, logo corporativo y condiciones por defecto de tus documentos.
          </p>
        </div>
      </div>

      {mensaje && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {mensaje.tipo === 'ok' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ═══ FORMULARIO PRINCIPAL ═══ */}
        <form onSubmit={handleGuardar} className="lg:col-span-2 space-y-6">
          {/* Logo Corporativo */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon className="w-5 h-5 text-moran-blue" />
              <h2 className="font-bold text-navy text-base">Logo Corporativo</h2>
            </div>
            <p className="text-xs text-slate-500">
              Sube el logo de la empresa para usarlo en Facturas, Cotizaciones y Órdenes de Trabajo. En el editor podrás elegir si incluir o no el logo en cada documento.
            </p>
            <div className="flex flex-wrap items-center gap-5 pt-2">
              {logoPath ? (
                <div className="relative group border border-slate-200 rounded-lg p-2.5 bg-slate-50 shadow-inner">
                  <img src={logoPath} alt="Logo Empresa" className="h-16 max-w-[220px] object-contain" />
                  <button
                    type="button"
                    onClick={() => setLogoPath('')}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700 transition-colors"
                    title="Eliminar Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-xs font-medium text-slate-400 bg-slate-50">
                  Sin Logo Asignado
                </div>
              )}
              <div className="space-y-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300">
                  <Upload className="w-4 h-4 text-moran-blue" />
                  {logoPath ? 'Cambiar Logo' : 'Subir Imagen de Logo'}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
                <p className="text-[11px] text-slate-400">Formatos recomendados: PNG o JPG con fondo transparente</p>
              </div>
            </div>
          </div>

          {/* Información General */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-navy text-base border-b border-slate-100 pb-3">
              Información Comercial y Fiscal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subtítulo / Actividad</label>
                <input
                  type="text"
                  value={subtitulo}
                  onChange={e => setSubtitulo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">RUC / NIT / Identificación</label>
                <input
                  type="text"
                  value={rucNit}
                  onChange={e => setRucNit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ITBMS por Defecto (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={itbmsDefault}
                  onChange={e => setItbmsDefault(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Términos y Condiciones por Defecto */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-navy text-base">Términos y Condiciones Predeterminados</h2>
                <p className="text-xs text-slate-500">Se incluirán automáticamente al crear nuevos documentos.</p>
              </div>
              <button
                type="button"
                onClick={agregarTermino}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-moran-blue hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Término
              </button>
            </div>

            <div className="space-y-3">
              {terminosDefault.map((term, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    placeholder="Ej: Garantía, Validez"
                    value={term.label}
                    onChange={e => updateTermino(idx, 'label', e.target.value)}
                    className="w-1/3 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-moran-blue"
                  />
                  <input
                    type="text"
                    placeholder="Descripción del término o condición..."
                    value={term.value}
                    onChange={e => updateTermino(idx, 'value', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-moran-blue"
                  />
                  <button
                    type="button"
                    onClick={() => eliminarTermino(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            disabled={guardando}
            className="w-full flex items-center justify-center gap-2 bg-moran-blue hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Guardar Configuración
              </>
            )}
          </button>
        </form>

        {/* ═══ PANEL LATERAL — RESUMEN Y ESTADO ═══ */}
        <div className="space-y-5">
          {/* Estado de Sincronización */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-moran-blue" />
              <h3 className="font-bold text-navy text-sm">Estado del Sistema</h3>
            </div>
            <div className="p-5">
              {isSupabaseConfigured ? (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-1.5">
                    <Cloud className="w-5 h-5 text-emerald-600" />
                    Sincronización en la Nube
                  </div>
                  <p className="text-xs text-emerald-700">
                    Los datos se sincronizan con la base de datos Supabase.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm mb-1.5">
                    <HardDrive className="w-5 h-5 text-moran-blue" />
                    Almacenamiento Local
                  </div>
                  <p className="text-xs text-slate-600">
                    La aplicación está operando en almacenamiento local del navegador.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de Datos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h4 className="font-bold text-navy text-sm border-b border-slate-100 pb-2">
              Ficha del Negocio
            </h4>
            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-medium text-slate-500">RUC / NIT:</span>
                <span className="font-semibold text-navy">{rucNit || 'No registrado'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-medium text-slate-500">Logo:</span>
                <span className={`font-semibold ${logoPath ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {logoPath ? 'Configurado' : 'Sin logo'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-medium text-slate-500">ITBMS Estándar:</span>
                <span className="font-semibold text-navy">{itbmsDefault}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium text-slate-500">Términos Registrados:</span>
                <span className="font-semibold text-navy">{terminosDefault.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
