'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History,
  FileText,
  Receipt,
  ClipboardList,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Mail,
  MessageSquare,
  Share2,
  Search,
  Filter,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { DataService } from '@/lib/supabase';
import { Documento, EmpresaConfig, TipoDocumento, EstadoDocumento } from '@/lib/types';
import { formatoMoneda } from '@/lib/calculations';
import { ModalPreview } from '@/components/ModalPreview';
import { ModalEmail } from '@/components/ModalEmail';
import { ModalWhatsApp } from '@/components/ModalWhatsApp';

const TIPO_CONFIG: Record<TipoDocumento, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  cotizacion: { label: 'Cotización', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: FileText },
  factura: { label: 'Factura', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: Receipt },
  presupuesto: { label: 'Presupuesto', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: ClipboardList },
};

const ESTADO_CONFIG: Record<EstadoDocumento, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-slate-200 text-slate-700' },
  enviado: { label: 'Enviado', color: 'bg-sky-100 text-sky-800' },
  aceptado: { label: 'Aceptado', color: 'bg-emerald-100 text-emerald-800' },
  rechazado: { label: 'Rechazado', color: 'bg-rose-100 text-rose-800' },
};

const ESTADOS: EstadoDocumento[] = ['borrador', 'enviado', 'aceptado', 'rechazado'];

export default function HistorialPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);
  const [emailDoc, setEmailDoc] = useState<Documento | null>(null);
  const [whatsappDoc, setWhatsappDoc] = useState<Documento | null>(null);
  const [estadoDropdown, setEstadoDropdown] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [docs, emp] = await Promise.all([DataService.getDocumentos(), DataService.getEmpresa()]);
      setDocumentos(docs);
      setEmpresa(emp);
      setCargando(false);
    })();
  }, []);

  const recargar = async () => {
    const docs = await DataService.getDocumentos();
    setDocumentos(docs);
  };

  // Filtrar
  const docsFiltrados = documentos.filter(d => {
    if (filtroTipo !== 'todos' && d.tipo !== filtroTipo) return false;
    if (filtroEstado !== 'todos' && d.estado !== filtroEstado) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const nombre = d.cliente?.nombre || d.cliente_nombre_manual || '';
      return (
        d.numero.toLowerCase().includes(q) ||
        nombre.toLowerCase().includes(q) ||
        d.tipo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleEliminar = async (id: number | string) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.')) return;
    await DataService.eliminarDocumento(id);
    setDocumentos(prev => prev.filter(d => String(d.id) !== String(id)));
  };

  const handleCambiarEstado = async (id: number | string, estado: EstadoDocumento) => {
    await DataService.cambiarEstado(id, estado);
    setDocumentos(prev => prev.map(d => (String(d.id) === String(id) ? { ...d, estado } : d)));
    setEstadoDropdown(null);
  };

  const handleDuplicar = async (id: number | string) => {
    try {
      await DataService.duplicarDocumento(id);
      await recargar();
    } catch (err: any) {
      alert(`Error al duplicar: ${err.message}`);
    }
  };

  const getClienteNombre = (doc: Documento): string => {
    return doc.cliente?.nombre || doc.cliente_nombre_manual || 'Sin cliente';
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-moran-blue" />
        Cargando historial...
      </div>
    );
  }

  return (
    <>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-navy flex items-center gap-3">
            <History className="w-8 h-8 text-moran-blue" />
            Historial de Documentos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {documentos.length} documentos registrados en el sistema
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número, cliente o tipo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue outline-none"
          >
            <option value="todos">Todos los tipos</option>
            <option value="cotizacion">Cotizaciones</option>
            <option value="factura">Facturas</option>
            <option value="presupuesto">Presupuestos</option>
          </select>
        </div>

        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue outline-none"
        >
          <option value="todos">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="enviado">Enviado</option>
          <option value="aceptado">Aceptado</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {docsFiltrados.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-sm">No se encontraron documentos con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docsFiltrados.map(doc => {
                  const tipoCfg = TIPO_CONFIG[doc.tipo] || TIPO_CONFIG.cotizacion;
                  const TipoIcon = tipoCfg.icon;
                  const estadoCfg = ESTADO_CONFIG[doc.estado] || ESTADO_CONFIG.borrador;
                  const isDropdownOpen = estadoDropdown === String(doc.id);

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
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
                      <td className="px-4 py-3.5 text-right font-bold text-navy">
                        ${formatoMoneda(doc.total_general)}
                      </td>
                      <td className="px-4 py-3.5 text-center relative">
                        <button
                          onClick={() => setEstadoDropdown(isDropdownOpen ? null : String(doc.id))}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${estadoCfg.color}`}
                        >
                          {estadoCfg.label}
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute z-20 mt-1 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden w-36">
                            {ESTADOS.map(est => (
                              <button
                                key={est}
                                onClick={() => handleCambiarEstado(doc.id!, est)}
                                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${
                                  doc.estado === est ? 'bg-moran-lightBlue font-bold' : ''
                                }`}
                              >
                                {ESTADO_CONFIG[est].label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            title="Vista Previa"
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
                            onClick={() => setEmailDoc(doc)}
                            title="Enviar por Email"
                            className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setWhatsappDoc(doc)}
                            title="Enviar por WhatsApp"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicar(doc.id!)}
                            title="Duplicar"
                            className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
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

      {/* Modales */}
      {empresa && (
        <>
          <ModalPreview
            isOpen={!!previewDoc}
            onClose={() => setPreviewDoc(null)}
            documento={previewDoc}
            empresa={empresa}
          />
          <ModalEmail
            isOpen={!!emailDoc}
            onClose={() => setEmailDoc(null)}
            documento={emailDoc}
            empresa={empresa}
            onEnviadoExitoso={recargar}
          />
          <ModalWhatsApp
            isOpen={!!whatsappDoc}
            onClose={() => setWhatsappDoc(null)}
            documento={whatsappDoc}
            empresa={empresa}
            onEnviadoExitoso={recargar}
          />
        </>
      )}
    </>
  );
}
