'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Receipt,
  ClipboardList,
  DollarSign,
  TrendingUp,
  PlusCircle,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  Loader2,
  Package,
} from 'lucide-react';
import { DataService } from '@/lib/supabase';
import { Documento, EmpresaConfig, TipoDocumento, EstadoDocumento } from '@/lib/types';
import { formatoMoneda } from '@/lib/calculations';
import { ModalPreview } from '@/components/ModalPreview';
import { useAuth } from '@/components/AuthContext';

const TIPO_CONFIG: Record<
  TipoDocumento,
  { label: string; color: string; bgColor: string; icon: React.ElementType; nuevoLabel?: string }
> = {
  cotizacion: { label: 'Cotización', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: FileText, nuevoLabel: 'Nueva Cotización' },
  factura: { label: 'Factura', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: Receipt, nuevoLabel: 'Nueva Factura' },
  presupuesto: { label: 'Presupuesto', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: ClipboardList, nuevoLabel: 'Nuevo Presupuesto' },
  lista_materiales: { label: 'Lista de Materiales', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Package, nuevoLabel: 'Nueva Lista de Materiales' },
};

const ESTADO_CONFIG: Record<EstadoDocumento, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-slate-200 text-slate-700' },
  enviado: { label: 'Enviado', color: 'bg-sky-100 text-sky-800' },
  aceptado: { label: 'Aceptado', color: 'bg-emerald-100 text-emerald-800' },
  rechazado: { label: 'Rechazado', color: 'bg-rose-100 text-rose-800' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { usuario, isAdmin } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);
  const [cargando, setCargando] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/editor');
      return;
    }

    (async () => {
      const [docs, emp] = await Promise.all([DataService.getDocumentos(), DataService.getEmpresa()]);
      setDocumentos(docs);
      setEmpresa(emp);
      setCargando(false);
    })();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-moran-blue" />
        Cargando datos del sistema...
      </div>
    );
  }

  // Filtrar por rol: empleados solo ven sus propios documentos
  const misDocumentos = isAdmin
    ? documentos
    : documentos.filter(d => String(d.usuario_id) === String(usuario?.id));

  // Estadísticas
  const countCot = misDocumentos.filter(d => d.tipo === 'cotizacion').length;
  const countFac = misDocumentos.filter(d => d.tipo === 'factura').length;
  const countPre = misDocumentos.filter(d => d.tipo === 'presupuesto').length;
  const countMat = misDocumentos.filter(d => d.tipo === 'lista_materiales').length;
  const totalAceptado = misDocumentos
    .filter(d => d.estado === 'aceptado')
    .reduce((sum, d) => sum + (d.total_general || 0), 0);

  const recientes = misDocumentos.slice(0, 10);

  const getClienteNombre = (doc: Documento): string => {
    return doc.cliente?.nombre || doc.cliente_nombre_manual || 'Sin cliente';
  };

  const handleEliminar = async (id: number | string) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.')) return;
    await DataService.eliminarDocumento(id);
    setDocumentos(prev => prev.filter(d => String(d.id) !== String(id)));
  };

  const statCards = [
    {
      label: 'Cotizaciones',
      count: countCot,
      icon: FileText,
      color: 'from-blue-500 to-blue-700',
      iconBg: 'bg-blue-400/30',
      visible: true,
    },
    {
      label: 'Facturas',
      count: countFac,
      icon: Receipt,
      color: 'from-emerald-500 to-emerald-700',
      iconBg: 'bg-emerald-400/30',
      visible: true,
    },
    {
      label: 'Presupuestos',
      count: countPre,
      icon: ClipboardList,
      color: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-400/30',
      visible: true,
    },
    {
      label: 'Listas de Materiales',
      count: countMat,
      icon: Package,
      color: 'from-purple-500 to-purple-700',
      iconBg: 'bg-purple-400/30',
      visible: true,
    },
    {
      label: 'Ingresos Aceptados',
      count: `$${formatoMoneda(totalAceptado)}`,
      icon: TrendingUp,
      color: 'from-violet-500 to-violet-700',
      iconBg: 'bg-violet-400/30',
      visible: isAdmin, // Solo admin ve ingresos
    },
  ].filter(c => c.visible);

  return (
    <>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-navy flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-moran-blue" />
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Resumen general de tu actividad comercial</p>
        </div>

        <div className="relative group">
          <button className="inline-flex items-center gap-2 bg-moran-blue hover:bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200/50 transition-all hover:scale-[1.02]">
            <PlusCircle className="w-5 h-5" />
            Nuevo Documento
          </button>
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
            {(['cotizacion', 'factura', 'presupuesto', 'lista_materiales'] as TipoDocumento[]).map(tipo => {
              const cfg = TIPO_CONFIG[tipo];
              const Icon = cfg.icon;
              return (
                <Link
                  key={tipo}
                  href={`/editor?tipo=${tipo}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  {cfg.nuevoLabel || `Nueva ${cfg.label}`}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} text-white p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{card.label}</p>
                  <p className="text-3xl font-black mt-1">{card.count}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              {/* Decoración */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />
            </div>
          );
        })}
      </div>

      {/* Espacio para Crear Lista de Materiales */}
      <div className="mb-8 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-purple-500/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">
              <Package className="w-3.5 h-3.5 text-purple-400" />
              Nuevo Documento Disponible
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              Espacio para Crear Lista de Materiales
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Elabora listas detalladas de insumos, materiales y equipos requeridos para tus obras o proyectos. Controla cantidades, descripciones y costos unitarios con cálculo automático de totales y exportación directa en formato PDF o Word.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/editor?tipo=lista_materiales"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-900/50 transition-all hover:scale-105 active:scale-95 w-full md:w-auto"
            >
              <PlusCircle className="w-5 h-5" />
              Crear Lista de Materiales
            </Link>
          </div>
        </div>
        {/* Glow decorativo de fondo */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-56 h-56 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-44 h-44 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />
      </div>


      {/* Documentos Recientes */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-navy">Documentos Recientes</h2>
          <Link
            href="/historial"
            className="inline-flex items-center text-sm text-moran-blue font-semibold hover:underline"
          >
            Ver Historial Completo <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-sm">No hay documentos aún. ¡Crea tu primer documento!</p>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-moran-blue hover:underline"
            >
              <PlusCircle className="w-4 h-4" /> Crear Documento
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Total</th>}
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recientes.map(doc => {
                  const tipoCfg = TIPO_CONFIG[doc.tipo] || TIPO_CONFIG.cotizacion;
                  const TipoIcon = tipoCfg.icon;
                  const estadoCfg = ESTADO_CONFIG[doc.estado] || ESTADO_CONFIG.borrador;
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tipoCfg.bgColor} ${tipoCfg.color}`}
                        >
                          <TipoIcon className="w-3.5 h-3.5" />
                          {tipoCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-navy">{doc.numero}</td>
                      <td className="px-4 py-3.5 text-slate-700">{getClienteNombre(doc)}</td>
                      <td className="px-4 py-3.5 text-slate-500">{doc.fecha}</td>
                      {isAdmin && (
                        <td className="px-4 py-3.5 text-right font-bold text-navy">
                          ${formatoMoneda(doc.total_general)}
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${estadoCfg.color}`}>
                          {estadoCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            title="Vista Previa PDF"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/editor?id=${doc.id}`}
                            title="Editar"
                            className="p-1.5 rounded-lg text-moran-blue hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEliminar(doc.id!)}
                            title="Eliminar"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Vista Previa */}
      {empresa && (
        <ModalPreview
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          documento={previewDoc}
          empresa={empresa}
        />
      )}
    </>
  );
}
