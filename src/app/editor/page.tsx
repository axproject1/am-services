'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  Eye,
  FileDown,
  FileText,
  Mail,
  MessageSquare,
  HardHat,
  Box,
  Cpu,
  Wrench,
  Truck,
  MoreHorizontal,
  Share2,
  Loader2,
  Copy,
  CheckCircle2,
  Package,
  MapPin,
  Building2,
  UserCheck,
  ClipboardList,
} from 'lucide-react';
import {
  Documento,
  DocumentoItem,
  EmpresaConfig,
  Cliente,
  TipoDocumento,
  CategoriaItem,
  TerminoCondicion,
} from '@/lib/types';
import { calcularTotales, formatoMoneda, CalculoResultado } from '@/lib/calculations';
import { generarNumeroSiguiente } from '@/lib/numeracion';
import { DataService } from '@/lib/supabase';
import { generarPDFDocumento } from '@/lib/pdfGenerator';
import { generarDOCXDocumento } from '@/lib/docxGenerator';
import { ModalEmail } from '@/components/ModalEmail';
import { ModalWhatsApp } from '@/components/ModalWhatsApp';
import { ModalPreview } from '@/components/ModalPreview';
import { useAuth } from '@/components/AuthContext';

const TIPO_NOMBRES: Record<TipoDocumento, string> = {
  cotizacion: 'Cotización',
  factura: 'Factura',
  presupuesto: 'Presupuesto',
  lista_materiales: 'Lista de Materiales',
};

const CATEGORIAS: { value: CategoriaItem; label: string; icon: React.ElementType }[] = [
  { value: 'mano_obra', label: 'Mano de Obra', icon: HardHat },
  { value: 'material', label: 'Material', icon: Box },
  { value: 'equipo', label: 'Equipo', icon: Cpu },
  { value: 'servicio', label: 'Servicio', icon: Wrench },
  { value: 'transporte', label: 'Transporte', icon: Truck },
  { value: 'otros', label: 'Otros', icon: MoreHorizontal },
];

const CARGOS_RESPONSABLE = ['Contratista', 'Técnico Instalador', 'Responsable', 'Ingeniero', 'Supervisor'];

const UNIDADES_MEDIDA = [
  { value: 'und', label: 'und (Unidades)' },
  { value: 'mts', label: 'mts (Metros)' },
  { value: 'rollos', label: 'rollos (Rollos)' },
  { value: 'gal', label: 'gal (Galones)' },
  { value: 'sacos', label: 'sacos (Sacos)' },
  { value: 'cajas', label: 'cajas (Cajas)' },
  { value: 'piezas', label: 'piezas (Piezas)' },
  { value: 'barras', label: 'barras (Barras)' },
  { value: 'lbs', label: 'lbs (Libras)' },
  { value: 'pares', label: 'pares (Pares)' },
  { value: 'jgos', label: 'jgos (Juegos)' },
];

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();
  const docId = searchParams.get('id');
  const tipoParam = (searchParams.get('tipo') as TipoDocumento) || 'cotizacion';

  // Estado principal
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Campos del documento
  const [tipo, setTipo] = useState<TipoDocumento>(tipoParam);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [validaHasta, setValidaHasta] = useState('');
  const [clienteId, setClienteId] = useState<string>('');
  const [clienteNombreManual, setClienteNombreManual] = useState('');
  const [proyectoObra, setProyectoObra] = useState('');
  const [lugarEntrega, setLugarEntrega] = useState('');
  const [solicitadoPor, setSolicitadoPor] = useState('');
  const [emisor, setEmisor] = useState('');
  const [responsable, setResponsable] = useState('');
  const [responsableCargo, setResponsableCargo] = useState('');
  const [usarEmpresa, setUsarEmpresa] = useState(true);
  const [incluirLogo, setIncluirLogo] = useState(true);
  const [incluirFirmas, setIncluirFirmas] = useState(true);
  const [incluirItbms, setIncluirItbms] = useState(true);
  const [itbmsPorcentaje, setItbmsPorcentaje] = useState(7.0);
  const [incluirManoObra, setIncluirManoObra] = useState(false);
  const [manoObraMonto, setManoObraMonto] = useState(0);
  const [abonoPorcentaje, setAbonoPorcentaje] = useState(0);
  const [abonoBase, setAbonoBase] = useState<'total' | 'mano_obra'>('total');
  const [toggleAbono, setToggleAbono] = useState(false);
  const [seccionTitulo, setSeccionTitulo] = useState(
    tipoParam === 'lista_materiales' ? 'LISTA DE MATERIALES E INSUMOS' : ''
  );

  // Ítems
  const [items, setItems] = useState<DocumentoItem[]>([
    { categoria: 'material', unidad_medida: 'und', cantidad: 1, descripcion: '', precio_unitario: 0, total: 0 },
  ]);

  // Términos
  const [terminos, setTerminos] = useState<TerminoCondicion[]>([
    { label: 'Condiciones de Pago', value: '' },
    { label: 'Validez de Cotización', value: '' },
  ]);

  // Documento cargado (si existe)
  const [docCargado, setDocCargado] = useState<Documento | null>(null);
  const [numero, setNumero] = useState('');

  // Modales
  const [modalEmail, setModalEmail] = useState(false);
  const [modalWhatsApp, setModalWhatsApp] = useState(false);
  const [modalPreview, setModalPreview] = useState(false);

  // Carga inicial
  useEffect(() => {
    (async () => {
      const [emp, cls] = await Promise.all([DataService.getEmpresa(), DataService.getClientes()]);
      setEmpresa(emp);
      setClientes(cls);

      if (docId) {
        const doc = await DataService.getDocumentoById(docId);
        if (doc) {
          setDocCargado(doc);
          setTipo(doc.tipo);
          setNumero(doc.numero);
          setFecha(doc.fecha);
          setValidaHasta(doc.valida_hasta || '');
          setClienteId(doc.cliente_id ? String(doc.cliente_id) : '');
          setClienteNombreManual(doc.cliente_nombre_manual || '');
          setProyectoObra(doc.proyecto_obra || doc.cliente_nombre_manual || '');
          setLugarEntrega(doc.lugar_entrega || doc.observaciones || '');
          setSolicitadoPor(doc.solicitado_por || doc.responsable || '');
          setEmisor(doc.emisor || '');
          setResponsable(doc.responsable || '');
          setResponsableCargo(doc.responsable_cargo || '');
          setUsarEmpresa(doc.usar_empresa);
          setIncluirLogo(doc.incluir_logo !== false);
          setIncluirFirmas(doc.incluir_firmas);
          setIncluirItbms(doc.incluir_itbms);
          setItbmsPorcentaje(doc.itbms_porcentaje);
          setIncluirManoObra(doc.incluir_mano_obra);
          setManoObraMonto(doc.mano_obra_monto);
          setAbonoPorcentaje(doc.abono_porcentaje);
          setAbonoBase(doc.abono_base);
          setToggleAbono(doc.abono_porcentaje > 0);
          setSeccionTitulo(doc.seccion_titulo || '');
          setItems(
            doc.items && doc.items.length > 0
              ? doc.items.map(it => ({ ...it, unidad_medida: it.unidad_medida || 'und' }))
              : [{ categoria: 'material', unidad_medida: 'und', cantidad: 1, descripcion: '', precio_unitario: 0, total: 0 }]
          );
          setTerminos(
            doc.terminos && doc.terminos.length > 0
              ? doc.terminos
              : emp.terminos_default || [{ label: 'Condiciones de Pago', value: '' }]
          );
        }
      } else {
        // Nuevo documento: cargar términos por defecto según tipo
        if (tipoParam === 'lista_materiales') {
          setTerminos([
            { label: 'Lugar de Entrega', value: 'En sitio de obra / almacén' },
            { label: 'Plazo / Prioridad', value: 'Requerido para inicio de fase' },
            { label: 'Proveedor Sugerido', value: 'Cochez / Do It Center / Discovery' },
          ]);
        } else if (emp.terminos_default && emp.terminos_default.length > 0) {
          setTerminos(emp.terminos_default);
        }
      }

      setCargando(false);
    })();
  }, [docId]);

  // Cálculos reactivos
  const totales: CalculoResultado = calcularTotales(
    items,
    incluirManoObra,
    manoObraMonto,
    incluirItbms,
    itbmsPorcentaje,
    toggleAbono ? abonoPorcentaje : 0,
    abonoBase
  );

  // Gestión de ítems
  const agregarItem = () => {
    setItems(prev => [
      ...prev,
      {
        categoria: 'material',
        unidad_medida: 'und',
        cantidad: 1,
        descripcion: '',
        precio_unitario: 0,
        total: 0,
      },
    ]);
  };

  const eliminarItem = (index: number) => {
    if (items.length <= 1) {
      alert('El documento debe tener al menos un ítem.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DocumentoItem, value: any) => {
    setItems(prev => {
      const copia = [...prev];
      (copia[index] as any)[field] = value;
      copia[index].total = (Number(copia[index].cantidad) || 0) * (Number(copia[index].precio_unitario) || 0);
      return [...copia];
    });
  };

  // Gestión de términos
  const agregarTermino = () => {
    setTerminos(prev => [...prev, { label: '', value: '' }]);
  };

  const eliminarTermino = (index: number) => {
    setTerminos(prev => prev.filter((_, i) => i !== index));
  };

  const updateTermino = (index: number, field: 'label' | 'value', val: string) => {
    setTerminos(prev => {
      const copia = [...prev];
      copia[index][field] = val;
      return [...copia];
    });
  };

  // ── GUARDAR ──
  const handleGuardar = async () => {
    if (items.every(it => !it.descripcion.trim())) {
      alert('Agrega al menos un ítem con descripción.');
      return;
    }

    setGuardando(true);

    try {
      // Generar número correlativo si es nuevo
      let docNumero = numero;
      if (!docCargado) {
        const todos = await DataService.getDocumentos();
        docNumero = generarNumeroSiguiente(tipo, todos.map(d => d.numero));
      }

      const esMateriales = tipo === 'lista_materiales';
      const clienteSeleccionado = clientes.find(c => String(c.id) === clienteId) || null;

      const docPayload: Documento = {
        id: docCargado?.id,
        tipo,
        numero: docNumero,
        fecha,
        valida_hasta: validaHasta || undefined,
        cliente_id: esMateriales ? null : (clienteId ? Number(clienteId) : null),
        cliente_nombre_manual: esMateriales
          ? (proyectoObra || clienteNombreManual || 'Obra General')
          : (clienteNombreManual || clienteSeleccionado?.nombre || ''),
        proyecto_obra: esMateriales ? (proyectoObra || clienteNombreManual) : undefined,
        lugar_entrega: esMateriales ? lugarEntrega : undefined,
        solicitado_por: esMateriales ? (solicitadoPor || responsable) : undefined,
        cliente: esMateriales ? undefined : (clienteSeleccionado || undefined),
        emisor,
        emisor_cargo: '',
        responsable: esMateriales ? (solicitadoPor || responsable) : responsable,
        responsable_cargo: esMateriales ? 'Técnico / Encargado' : responsableCargo,
        usuario_id: usuario ? usuario.id : 1,
        usar_empresa: usarEmpresa,
        incluir_logo: incluirLogo,
        incluir_firmas: incluirFirmas,
        incluir_itbms: incluirItbms,
        itbms_porcentaje: itbmsPorcentaje,
        incluir_mano_obra: esMateriales ? false : incluirManoObra,
        mano_obra_monto: esMateriales ? 0 : totales.mano_obra_monto,
        subtotal_equipos: totales.subtotal_equipos,
        subtotal_materiales: totales.subtotal_materiales,
        subtotal_neto: totales.subtotal_neto,
        itbms_monto: totales.itbms_monto,
        total_general: totales.total_general,
        abono_porcentaje: esMateriales ? 0 : (toggleAbono ? abonoPorcentaje : 0),
        abono_base: abonoBase,
        abono_monto: esMateriales ? 0 : totales.abono_monto,
        saldo_restante: esMateriales ? 0 : totales.saldo_restante,
        seccion_titulo: seccionTitulo || (esMateriales ? 'LISTA DE MATERIALES E INSUMOS' : undefined),
        terminos,
        estado: docCargado?.estado || 'borrador',
        creado_en: docCargado?.creado_en,
      };

      const itemsLimpios = items
        .filter(it => it.descripcion.trim())
        .map((it, idx) => ({
          ...it,
          categoria: esMateriales ? 'material' : it.categoria,
          unidad_medida: it.unidad_medida || 'und',
          total: (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0),
          orden: idx,
        }));

      const saved = await DataService.saveDocumento(docPayload, itemsLimpios);

      setDocCargado(saved);
      setNumero(saved.numero);
      setMensajeExito(`Documento ${saved.numero} guardado exitosamente.`);

      // Redirigir al editor con el ID si era nuevo
      if (!docId && saved.id) {
        router.replace(`/editor?id=${saved.id}`);
      }

      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // Construir el documento completo para modales y generadores
  const buildDocCompleto = (): Documento => {
    const esMateriales = tipo === 'lista_materiales';
    const clienteSeleccionado = clientes.find(c => String(c.id) === clienteId) || null;
    return {
      ...(docCargado || ({} as any)),
      tipo,
      numero: numero || 'BORRADOR',
      fecha,
      valida_hasta: validaHasta,
      cliente_id: esMateriales ? null : (clienteId ? Number(clienteId) : null),
      cliente_nombre_manual: esMateriales
        ? (proyectoObra || clienteNombreManual || 'Obra General')
        : (clienteNombreManual || clienteSeleccionado?.nombre || ''),
      proyecto_obra: esMateriales ? (proyectoObra || clienteNombreManual) : undefined,
      lugar_entrega: esMateriales ? lugarEntrega : undefined,
      solicitado_por: esMateriales ? (solicitadoPor || responsable) : undefined,
      cliente: esMateriales ? undefined : (clienteSeleccionado || undefined),
      emisor,
      responsable: esMateriales ? (solicitadoPor || responsable) : responsable,
      responsable_cargo: esMateriales ? 'Técnico / Encargado' : responsableCargo,
      usar_empresa: usarEmpresa,
      incluir_firmas: incluirFirmas,
      incluir_itbms: incluirItbms,
      itbms_porcentaje: itbmsPorcentaje,
      incluir_mano_obra: esMateriales ? false : incluirManoObra,
      mano_obra_monto: esMateriales ? 0 : totales.mano_obra_monto,
      subtotal_equipos: totales.subtotal_equipos,
      subtotal_materiales: totales.subtotal_materiales,
      subtotal_neto: totales.subtotal_neto,
      itbms_monto: totales.itbms_monto,
      total_general: totales.total_general,
      abono_porcentaje: esMateriales ? 0 : (toggleAbono ? abonoPorcentaje : 0),
      abono_base: abonoBase,
      abono_monto: esMateriales ? 0 : totales.abono_monto,
      saldo_restante: esMateriales ? 0 : totales.saldo_restante,
      seccion_titulo: seccionTitulo || (esMateriales ? 'LISTA DE MATERIALES E INSUMOS' : undefined),
      terminos,
      estado: docCargado?.estado || 'borrador',
      items: items.filter(it => it.descripcion.trim()).map(it => ({
        ...it,
        categoria: esMateriales ? 'material' : it.categoria,
        unidad_medida: it.unidad_medida || 'und',
      })),
    };
  };

  // ── CATEGORÍA ICONOS ──
  const catIconMap: Record<string, React.ElementType> = {
    mano_obra: HardHat,
    material: Box,
    equipo: Cpu,
    servicio: Wrench,
    transporte: Truck,
    otros: MoreHorizontal,
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-moran-blue" />
        Cargando editor...
      </div>
    );
  }

  return (
    <>
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-navy flex items-center gap-2.5">
          {tipo === 'lista_materiales' ? (
            <Package className="w-7 h-7 text-purple-600" />
          ) : (
            <FileText className="w-7 h-7 text-moran-blue" />
          )}
          {docCargado
            ? `Editar ${TIPO_NOMBRES[tipo] || tipo} #${numero}`
            : tipo === 'lista_materiales'
            ? 'Nueva Lista de Materiales'
            : 'Nuevo Documento'}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {docCargado && (
            <>
              <div className="relative group">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                  Compartir
                </button>
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <button
                    onClick={() => setModalEmail(true)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-moran-blue" /> Por Email
                  </button>
                  <button
                    onClick={() => setModalWhatsApp(true)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" /> Por WhatsApp
                  </button>
                </div>
              </div>
              <button
                onClick={() => setModalPreview(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Vista Previa
              </button>
              <button
                onClick={() => empresa && generarPDFDocumento(buildDocCompleto(), empresa)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={() => empresa && generarDOCXDocumento(buildDocCompleto(), empresa)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-moran-blue hover:bg-navy text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" /> Word
              </button>
            </>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver
          </Link>
        </div>
      </div>

      {/* MENSAJE DE ÉXITO */}
      {mensajeExito && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-sm font-medium animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {mensajeExito}
        </div>
      )}

      {/* ESPACIO LISTA DE MATERIALES - BANNER INFORMATIVO */}
      {tipo === 'lista_materiales' && (
        <div className="mb-5 p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-3 text-purple-900 text-sm shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-purple-950">Espacio de Creación: Lista de Materiales</p>
              <p className="text-xs text-purple-700">Registra todos los insumos, materiales y equipos requeridos para tu proyecto con cantidades, precios unitarios y cálculos automáticos.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ COLUMNA PRINCIPAL (2/3) ═══ */}
        <div className="lg:col-span-2 space-y-5">
          {/* Detalles Principales */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-bold text-navy text-sm">Detalles Principales</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo de Documento</label>
                <select
                  value={tipo}
                  onChange={e => {
                    const nuevoTipo = e.target.value as TipoDocumento;
                    setTipo(nuevoTipo);
                    if (nuevoTipo === 'lista_materiales' && !seccionTitulo) {
                      setSeccionTitulo('LISTA DE MATERIALES E INSUMOS');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
                >
                  <option value="cotizacion">Cotización</option>
                  <option value="factura">Factura</option>
                  <option value="presupuesto">Presupuesto</option>
                  <option value="lista_materiales">Lista de Materiales</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fecha de Emisión</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Validez (Opcional)</label>
                <input
                  type="date"
                  value={validaHasta}
                  onChange={e => setValidaHasta(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
                />
              </div>
            </div>
          </div>

          {/* Datos del Cliente y Emisor (O Datos de la Obra y Entrega para Lista de Materiales) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
              tipo === 'lista_materiales' ? 'bg-purple-50/70 border-purple-100' : 'border-slate-100'
            }`}>
              <h3 className="font-bold text-navy text-sm flex items-center gap-2">
                {tipo === 'lista_materiales' ? (
                  <>
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Datos del Proyecto y Entrega</span>
                  </>
                ) : (
                  <span>Datos del Cliente y Emisor</span>
                )}
              </h3>
              {tipo === 'lista_materiales' && (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                  Formulario Especializado de Materiales
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              {tipo === 'lista_materiales' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600" /> Proyecto / Obra / Ubicación *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Remodelación PH Costa del Este / Residencia Lote 14"
                        value={proyectoObra}
                        onChange={e => {
                          setProyectoObra(e.target.value);
                          if (!clienteNombreManual) setClienteNombreManual(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Solicitado por (Técnico / Encargado)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Ing. Mario Gómez / Maestro de Obra"
                        value={solicitadoPor}
                        onChange={e => {
                          setSolicitadoPor(e.target.value);
                          if (!responsable) setResponsable(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" /> Punto o Lugar de Entrega
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. En sitio de obra, Portón Principal, Bodega #2"
                        value={lugarEntrega}
                        onChange={e => setLugarEntrega(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Comprador / Emisor de la Orden
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Andrés Morán"
                        value={emisor}
                        onChange={e => setEmisor(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Asignar a cliente existente opcional */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Cliente Asociado (Opcional):</span>
                    <select
                      value={clienteId}
                      onChange={e => {
                        setClienteId(e.target.value);
                        const cl = clientes.find(c => String(c.id) === e.target.value);
                        if (cl) {
                          if (!proyectoObra) setProyectoObra(`Obra de ${cl.nombre}`);
                          setClienteNombreManual(cl.nombre);
                        }
                      }}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">— Ninguno / Obra Propia —</option>
                      {clientes.map(cl => (
                        <option key={cl.id} value={String(cl.id)}>
                          {cl.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Cliente Existente</label>
                      <select
                        value={clienteId}
                        onChange={e => {
                          setClienteId(e.target.value);
                          const cl = clientes.find(c => String(c.id) === e.target.value);
                          if (cl) setClienteNombreManual(cl.nombre);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
                      >
                        <option value="">— Cliente Casual —</option>
                        {clientes.map(cl => (
                          <option key={cl.id} value={String(cl.id)}>
                            {cl.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre Manual</label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Pérez"
                        value={clienteNombreManual}
                        onChange={e => setClienteNombreManual(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Emisor</label>
                      <input
                        type="text"
                        placeholder="Ej. Andrés Morán"
                        value={emisor}
                        onChange={e => setEmisor(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Responsable</label>
                      <input
                        type="text"
                        placeholder="Ej. Carlos Mendoza"
                        value={responsable}
                        onChange={e => setResponsable(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Cargo del Responsable</label>
                      <div className="flex gap-1.5">
                        <select
                          value={CARGOS_RESPONSABLE.includes(responsableCargo) ? responsableCargo : 'custom'}
                          onChange={e => {
                            if (e.target.value !== 'custom') setResponsableCargo(e.target.value);
                            else setResponsableCargo('');
                          }}
                          className="flex-1 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
                        >
                          <option value="">— Seleccionar —</option>
                          {CARGOS_RESPONSABLE.map(c => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="custom">✏️ Otro...</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Cargo"
                          value={responsableCargo}
                          onChange={e => setResponsableCargo(e.target.value)}
                          className="flex-1 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabla de Ítems / Materiales */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-navy text-sm flex items-center gap-2">
                  {tipo === 'lista_materiales' ? (
                    <>
                      <Package className="w-4 h-4 text-purple-600" />
                      <span>Lista de Insumos y Materiales de Obra</span>
                    </>
                  ) : (
                    <span>Ítems / Servicios</span>
                  )}
                </h3>
                {tipo === 'lista_materiales' && (
                  <p className="text-xs text-slate-500 mt-0.5">Especifica cantidades, unidades de medida y costos estimados por material</p>
                )}
              </div>
              <button
                type="button"
                onClick={agregarItem}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                  tipo === 'lista_materiales'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-moran-blue hover:bg-navy'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> {tipo === 'lista_materiales' ? 'Añadir Material' : 'Añadir Fila'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {tipo === 'lista_materiales' ? (
                      <>
                        <th className="px-3 py-2.5 text-center" style={{ width: '10%' }}>
                          Cant.
                        </th>
                        <th className="px-2 py-2.5 text-left" style={{ width: '15%' }}>
                          Unidad (Udm)
                        </th>
                        <th className="px-2 py-2.5 text-left" style={{ width: '45%' }}>
                          Descripción del Material / Insumo
                        </th>
                        <th className="px-2 py-2.5 text-left" style={{ width: '15%' }}>
                          P. Unitario
                        </th>
                        <th className="px-2 py-2.5 text-right" style={{ width: '15%' }}>
                          Total
                        </th>
                        <th className="px-3 py-2.5" style={{ width: '5%' }} />
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2.5 text-left" style={{ width: '18%' }}>
                          Categoría
                        </th>
                        <th className="px-2 py-2.5 text-left" style={{ width: '10%' }}>
                          Cant.
                        </th>
                        <th className="px-2 py-2.5 text-left" style={{ width: '37%' }}>
                          Descripción
                        </th>
                        <th className="px-2 py-2.5 text-left" style={{ width: '15%' }}>
                          P. Unitario
                        </th>
                        <th className="px-2 py-2.5 text-right" style={{ width: '14%' }}>
                          Total
                        </th>
                        <th className="px-3 py-2.5" style={{ width: '6%' }} />
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      {tipo === 'lista_materiales' ? (
                        <>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.cantidad}
                              onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-center font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.unidad_medida || 'und'}
                              onChange={e => updateItem(idx, 'unidad_medida', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                              {UNIDADES_MEDIDA.map(u => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              placeholder="Ej. Cemento Gris 42.5kg, Tubo PVC 1/2 pulg, Disco Mil Hojas..."
                              value={item.descripcion}
                              onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
                              <span className="px-2 py-1.5 bg-slate-50 text-xs text-slate-500 border-r border-slate-300">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.precio_unitario}
                                onChange={e => updateItem(idx, 'precio_unitario', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right font-bold text-navy text-xs">
                            ${formatoMoneda((Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0))}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => eliminarItem(idx)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2">
                            <select
                              value={item.categoria}
                              onChange={e => updateItem(idx, 'categoria', e.target.value as CategoriaItem)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-moran-blue outline-none"
                            >
                              {CATEGORIAS.map(c => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.cantidad}
                              onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-moran-blue outline-none"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              placeholder="Descripción del ítem"
                              value={item.descripcion}
                              onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-moran-blue outline-none"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-moran-blue">
                              <span className="px-2 py-1.5 bg-slate-50 text-xs text-slate-500 border-r border-slate-300">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.precio_unitario}
                                onChange={e => updateItem(idx, 'precio_unitario', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right font-bold text-navy text-xs">
                            ${formatoMoneda((Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0))}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => eliminarItem(idx)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Términos y Condiciones / Notas de Compra */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-navy text-sm">
                  {tipo === 'lista_materiales' ? 'Notas de Compra y Observaciones de Entrega' : 'Condiciones y Términos'}
                </h3>
                {tipo === 'lista_materiales' && (
                  <p className="text-xs text-slate-500 mt-0.5">Indicaciones de proveedores, marcas sugeridas o logística</p>
                )}
              </div>
              <button
                type="button"
                onClick={agregarTermino}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                  tipo === 'lista_materiales'
                    ? 'border-purple-600 text-purple-700 hover:bg-purple-50'
                    : 'border-moran-blue text-moran-blue hover:bg-blue-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Añadir
              </button>
            </div>
            <div className="p-5 space-y-2.5">
              {terminos.map((term, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder={tipo === 'lista_materiales' ? 'Ej. Proveedor sugerido' : 'Ej. Garantía'}
                      value={term.label}
                      onChange={e => updateTermino(idx, 'label', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-moran-blue outline-none"
                    />
                  </div>
                  <div className="col-span-8">
                    <input
                      type="text"
                      placeholder={tipo === 'lista_materiales' ? 'Detalle o indicación de compra/entrega' : 'Detalle de la condición'}
                      value={term.value}
                      onChange={e => updateTermino(idx, 'value', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-moran-blue outline-none"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => eliminarTermino(idx)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ COLUMNA LATERAL — RESUMEN (1/3) ═══ */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
            {/* Cabecera */}
            <div className={`text-white px-5 py-3.5 ${tipo === 'lista_materiales' ? 'bg-purple-900' : 'bg-navy'}`}>
              <h3 className="font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-200" /> Resumen {tipo === 'lista_materiales' ? 'de Materiales' : ''}
              </h3>
            </div>

            <div className="p-5 bg-slate-50/50 space-y-4">
              {/* Badge resumen para Lista de Materiales */}
              {tipo === 'lista_materiales' && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs text-purple-900 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Total de renglones:</span>
                    <span>{items.length} materiales</span>
                  </div>
                  <div className="flex justify-between text-purple-700">
                    <span>Cantidad total de unidades:</span>
                    <span>{items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)}</span>
                  </div>
                </div>
              )}

              {/* ITBMS */}
              <div className="pb-3 border-b border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirItbms}
                    onChange={e => setIncluirItbms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">Aplicar ITBMS</span>
                </label>
                {incluirItbms && (
                  <div className="mt-2 flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                    <input
                      type="number"
                      step="0.1"
                      value={itbmsPorcentaje}
                      onChange={e => setItbmsPorcentaje(Number(e.target.value))}
                      className="flex-1 px-3 py-1.5 text-sm outline-none"
                    />
                    <span className="px-3 py-1.5 bg-slate-50 text-sm text-slate-500 border-l border-slate-300">%</span>
                  </div>
                )}
              </div>

              {/* Abono - Solo para cotizaciones/facturas, se oculta en lista de materiales */}
              {tipo !== 'lista_materiales' && (
                <div className="pb-3 border-b border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={toggleAbono}
                      onChange={e => setToggleAbono(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-moran-blue focus:ring-moran-blue"
                    />
                    <span className="text-sm font-semibold text-slate-700">Abono Inicial</span>
                  </label>
                  {toggleAbono && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={abonoPorcentaje}
                          onChange={e => setAbonoPorcentaje(Number(e.target.value))}
                          className="flex-1 px-3 py-1.5 text-sm outline-none"
                        />
                        <span className="px-3 py-1.5 bg-slate-50 text-sm text-slate-500 border-l border-slate-300">
                          %
                        </span>
                      </div>
                      <select
                        value={abonoBase}
                        onChange={e => setAbonoBase(e.target.value as 'total' | 'mano_obra')}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue outline-none"
                      >
                        <option value="total">Aplicar al Total General</option>
                        <option value="mano_obra">Aplicar solo a Mano de Obra</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Mano de Obra manual - Se oculta en lista de materiales */}
              {tipo !== 'lista_materiales' && (
                <div className="pb-3 border-b border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirManoObra}
                      onChange={e => setIncluirManoObra(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <HardHat className="w-4 h-4 text-emerald-600" /> Mano de Obra
                    </span>
                  </label>
                  {incluirManoObra && (
                    <div className="mt-2 flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                      <span className="px-3 py-1.5 bg-slate-50 text-sm text-slate-500 border-r border-slate-300">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={manoObraMonto}
                        onChange={e => setManoObraMonto(Number(e.target.value))}
                        className="flex-1 px-3 py-1.5 text-sm outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Desglose por Categoría (solo si no es lista de materiales pura) */}
              {tipo !== 'lista_materiales' && (
                <div className="space-y-1.5">
                  {Object.entries(totales.por_categoria)
                    .filter(([, val]) => val > 0)
                    .map(([cat, val]) => {
                      const CatIcon = catIconMap[cat] || Box;
                      const labels: Record<string, string> = {
                        mano_obra: 'Mano de Obra',
                        material: 'Materiales',
                        equipo: 'Equipos',
                        servicio: 'Servicios',
                        transporte: 'Transporte',
                        otros: 'Otros',
                      };
                      return (
                        <div key={cat} className="flex items-center justify-between text-xs text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <CatIcon className="w-3.5 h-3.5 text-slate-400" />
                            {labels[cat] || cat}:
                          </span>
                          <span className="font-semibold">${formatoMoneda(val)}</span>
                        </div>
                      );
                    })}
                </div>
              )}

              <hr className="border-slate-200" />

              {/* Totales */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-800">
                  <span>{tipo === 'lista_materiales' ? 'Subtotal Materiales:' : 'Subtotal Neto:'}</span>
                  <span>${formatoMoneda(totales.subtotal_neto)}</span>
                </div>
                {incluirItbms && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>ITBMS ({itbmsPorcentaje}%):</span>
                    <span className="font-semibold">${formatoMoneda(totales.itbms_monto)}</span>
                  </div>
                )}
                {tipo !== 'lista_materiales' && toggleAbono && abonoPorcentaje > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-emerald-700">
                      <span>
                        Abono {abonoBase === 'mano_obra' ? 'M. Obra' : 'inicial'} ({abonoPorcentaje}%):
                      </span>
                      <span className="font-semibold">${formatoMoneda(totales.abono_monto)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-amber-700 font-semibold">
                      <span>Saldo restante ({100 - abonoPorcentaje}%):</span>
                      <span>${formatoMoneda(totales.saldo_restante)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Total General Destacado */}
              <div className={`bg-white rounded-xl border-2 p-4 ${
                tipo === 'lista_materiales' ? 'border-purple-300' : 'border-moran-blue/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-navy font-extrabold text-base">
                    {tipo === 'lista_materiales' ? 'Total Materiales' : 'Total General'}
                  </span>
                  <span className={`font-black text-2xl ${
                    tipo === 'lista_materiales' ? 'text-purple-700' : 'text-moran-blue'
                  }`}>
                    ${formatoMoneda(totales.total_general)}
                  </span>
                </div>
              </div>

              {/* Opciones extra */}
              <div className="space-y-2 text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarEmpresa}
                    onChange={e => setUsarEmpresa(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-moran-blue focus:ring-moran-blue"
                  />
                  Usar membrete de empresa
                </label>
                {usarEmpresa && (
                  <label className="flex items-center gap-2 cursor-pointer pl-4 text-slate-700">
                    <input
                      type="checkbox"
                      checked={incluirLogo}
                      onChange={e => setIncluirLogo(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-moran-blue focus:ring-moran-blue"
                    />
                    <span>Incluir logo de la empresa</span>
                  </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirFirmas}
                    onChange={e => setIncluirFirmas(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-moran-blue focus:ring-moran-blue"
                  />
                  Incluir sección de firmas
                </label>
              </div>
            </div>

            {/* Botón GUARDAR */}
            <div className="p-5 border-t border-slate-200">
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando}
                className="w-full inline-flex items-center justify-center gap-2 bg-moran-blue hover:bg-navy text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-200/50 transition-all hover:scale-[1.01] disabled:opacity-60"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Guardar y Generar Documentos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {empresa && (
        <>
          <ModalEmail
            isOpen={modalEmail}
            onClose={() => setModalEmail(false)}
            documento={buildDocCompleto()}
            empresa={empresa}
            onEnviadoExitoso={() => {}}
          />
          <ModalWhatsApp
            isOpen={modalWhatsApp}
            onClose={() => setModalWhatsApp(false)}
            documento={buildDocCompleto()}
            empresa={empresa}
            onEnviadoExitoso={() => {}}
          />
          <ModalPreview
            isOpen={modalPreview}
            onClose={() => setModalPreview(false)}
            documento={buildDocCompleto()}
            empresa={empresa}
          />
        </>
      )}
    </>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mr-3 text-moran-blue" />
          Cargando editor...
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
