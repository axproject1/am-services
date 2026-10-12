import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Documento, EmpresaConfig, Cliente, EnvioLog, TipoDocumento, Usuario } from './types';
import { generarNumeroSiguiente } from './numeracion';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('tu-proyecto')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ========================================================
// REPOSITORIO UNIFICADO (Supabase con Fallback a Local Storage)
// ========================================================

const DEFAULT_EMPRESA: EmpresaConfig = {
  id: 1,
  nombre: 'SERVICIOS MORÁN',
  subtitulo: 'Servicios Múltiples Residenciales y Comerciales',
  logo_path: '/uploads/logos/logo_1787021270.png',
  telefono: '+507 6000-0000',
  email: 'info@serviciosmoran.com',
  direccion: 'Panamá, Rep. de Panamá',
  ruc_nit: '8-765-4321 DV 90',
  terminos_default: [
    { label: 'Condiciones de Pago', value: '50% de abono inicial al aprobar y 50% contra entrega a satisfacción.' },
    { label: 'Validez de Cotización', value: '15 días hábiles a partir de la fecha de emisión.' },
    { label: 'Garantía', value: '30 días calendario sobre mano de obra especializada.' },
  ],
  itbms_default: 7.0,
  activa: true,
};

const DEFAULT_CLIENTES: Cliente[] = [
  { id: 1, nombre: 'Constructora Del Istmo S.A.', email: 'proyectos@istmo.com', telefono: '+507 6555-1234', direccion: 'Costa del Este, Ciudad de Panamá' },
  { id: 2, nombre: 'Residencial Punta Barco', email: 'admin@puntabarco.com', telefono: '+507 6888-4321', direccion: 'Punta Barco, Chame' },
  { id: 3, nombre: 'Lic. Roberto González', email: 'rgonzalez@gmail.com', telefono: '+507 6111-9988', direccion: 'San Francisco, Calle 74' },
];

const DEFAULT_DOCUMENTOS: Documento[] = [
  {
    id: 1,
    tipo: 'cotizacion',
    numero: 'COT-2026-001',
    fecha: new Date().toISOString().slice(0, 10),
    valida_hasta: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    cliente_id: 1,
    cliente_nombre_manual: 'Constructora Del Istmo S.A.',
    emisor: 'Andrés Morán',
    emisor_cargo: 'Gerente General',
    responsable: 'Carlos Mendoza',
    responsable_cargo: 'Técnico Instalador',
    usar_empresa: true,
    incluir_firmas: true,
    incluir_itbms: true,
    itbms_porcentaje: 7.0,
    incluir_mano_obra: true,
    mano_obra_monto: 150.0,
    subtotal_equipos: 450.0,
    subtotal_materiales: 220.0,
    subtotal_neto: 820.0,
    itbms_monto: 57.4,
    total_general: 877.4,
    abono_porcentaje: 50.0,
    abono_base: 'total',
    abono_monto: 438.7,
    saldo_restante: 438.7,
    seccion_titulo: 'DETALLE DE EQUIPOS Y MATERIALES',
    terminos: [
      { label: 'Condiciones de Pago', value: '50% abono inicial y 50% al finalizar' },
      { label: 'Tiempo de Entrega', value: '3 a 5 días laborables tras aprobación' },
    ],
    estado: 'aceptado',
    items: [
      { id: 1, categoria: 'equipo', cantidad: 1, descripcion: 'Aire Acondicionado Inverter 18,000 BTU', precio_unitario: 450.0, total: 450.0, orden: 0 },
      { id: 2, categoria: 'material', cantidad: 4, descripcion: 'Tubería de Cobre 3/8 y 5/8 (rollos)', precio_unitario: 35.0, total: 140.0, orden: 1 },
      { id: 3, categoria: 'material', cantidad: 1, descripcion: 'Cable eléctrico 3x12 AWG y aislantes', precio_unitario: 80.0, total: 80.0, orden: 2 },
    ],
    creado_en: new Date().toISOString(),
  },
  {
    id: 2,
    tipo: 'factura',
    numero: 'FAC-2026-001',
    fecha: new Date().toISOString().slice(0, 10),
    cliente_id: 2,
    cliente_nombre_manual: 'Residencial Punta Barco',
    emisor: 'Servicios Morán',
    emisor_cargo: 'Administración',
    responsable: 'Andrés Morán',
    responsable_cargo: 'Contratista',
    usar_empresa: true,
    incluir_firmas: true,
    incluir_itbms: true,
    itbms_porcentaje: 7.0,
    incluir_mano_obra: false,
    mano_obra_monto: 0,
    subtotal_equipos: 0,
    subtotal_materiales: 350.0,
    subtotal_neto: 350.0,
    itbms_monto: 24.5,
    total_general: 374.5,
    abono_porcentaje: 0,
    abono_base: 'total',
    abono_monto: 0,
    saldo_restante: 374.5,
    terminos: [
      { label: 'Garantía', value: 'Garantía de 3 meses en piezas suministradas' },
    ],
    estado: 'enviado',
    items: [
      { id: 4, categoria: 'material', cantidad: 2, descripcion: 'Bomba de agua sumergible 1/2 HP', precio_unitario: 175.0, total: 350.0, orden: 0 },
    ],
    creado_en: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Helper para leer/escribir en localStorage en cliente
function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(`moran_${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`moran_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error(`Error guardando ${key} en localStorage:`, err);
  }
}

export const DataService = {
  // ── Empresa ──
  async getEmpresa(): Promise<EmpresaConfig> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('empresa').select('*').limit(1).single();
      if (!error && data) return data;
    }
    return getLocal<EmpresaConfig>('empresa', DEFAULT_EMPRESA);
  },

  async saveEmpresa(config: EmpresaConfig): Promise<EmpresaConfig> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('empresa')
        .upsert({ id: config.id || 1, ...config })
        .select()
        .single();
      if (!error && data) return data;
    }
    setLocal('empresa', config);
    return config;
  },

  // ── Clientes ──
  async getClientes(): Promise<Cliente[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre');
      if (!error && data) return data;
    }
    return getLocal<Cliente[]>('clientes', DEFAULT_CLIENTES);
  },

  async saveCliente(cliente: Partial<Cliente>): Promise<Cliente> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .upsert(cliente)
        .select()
        .single();
      if (!error && data) return data;
    }
    const list = getLocal<Cliente[]>('clientes', DEFAULT_CLIENTES);
    const id = cliente.id || Date.now();
    const index = list.findIndex(c => c.id === id);
    const nuevo = { ...cliente, id } as Cliente;
    if (index >= 0) {
      list[index] = nuevo;
    } else {
      list.push(nuevo);
    }
    setLocal('clientes', list);
    return nuevo;
  },

  // ── Documentos ──
  async getDocumentos(): Promise<Documento[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('documentos')
        .select(`
          *,
          cliente:clientes(id, nombre, email, telefono, direccion),
          items:documento_items(*)
        `)
        .order('creado_en', { ascending: false });
      if (!error && data) return data;
    }
    return getLocal<Documento[]>('documentos', DEFAULT_DOCUMENTOS);
  },

  async getDocumentoById(id: number | string): Promise<Documento | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('documentos')
        .select(`
          *,
          cliente:clientes(id, nombre, email, telefono, direccion),
          items:documento_items(*)
        `)
        .eq('id', id)
        .single();
      if (!error && data) return data;
    }
    const list = getLocal<Documento[]>('documentos', DEFAULT_DOCUMENTOS);
    return list.find(d => String(d.id) === String(id)) || null;
  },

  async saveDocumento(doc: Documento, items: any[]): Promise<Documento> {
    if (isSupabaseConfigured && supabase) {
      const { items: _, cliente: __, ...docPayload } = doc;
      const idExistente = docPayload.id ? Number(docPayload.id) : null;
      delete (docPayload as any).id;

      let savedId: number | null = null;
      let dbError: any = null;

      if (idExistente) {
        // Actualizar existente
        const { data, error } = await supabase
          .from('documentos')
          .update(docPayload)
          .eq('id', idExistente)
          .select()
          .single();

        if (error) {
          console.error('Error al actualizar documento en Supabase:', error);
          dbError = error;
        } else if (data) {
          savedId = data.id;
        }
      } else {
        // Insertar nuevo documento
        const { data, error } = await supabase
          .from('documentos')
          .insert(docPayload)
          .select()
          .single();

        if (error) {
          console.error('Error al insertar documento en Supabase:', error);
          dbError = error;
        } else if (data) {
          savedId = data.id;
        }
      }

      if (!dbError && savedId) {
        // Eliminar y reinsertar items
        await supabase.from('documento_items').delete().eq('documento_id', savedId);
        if (items && items.length > 0) {
          const itemsPayload = items.map((it, idx) => ({
            documento_id: savedId,
            categoria: it.categoria || 'material',
            cantidad: Number(it.cantidad) || 1,
            descripcion: it.descripcion,
            precio_unitario: Number(it.precio_unitario) || 0,
            total: (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0),
            orden: idx,
          }));
          const { error: itemsError } = await supabase.from('documento_items').insert(itemsPayload);
          if (itemsError) console.error('Error al insertar items en Supabase:', itemsError);
        }
        const docActualizado = await this.getDocumentoById(savedId);
        if (docActualizado) return docActualizado;
      } else if (dbError) {
        throw new Error(`Error en Supabase: ${dbError.message || 'No se pudo guardar el documento'}`);
      }
    }

    const list = getLocal<Documento[]>('documentos', DEFAULT_DOCUMENTOS);
    const id = doc.id || Date.now();
    const docCompleto: Documento = {
      ...doc,
      id,
      items: items.map((it, idx) => ({
        ...it,
        id: it.id || `${id}_${idx}`,
        documento_id: id,
        total: (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0),
      })),
      actualizado_en: new Date().toISOString(),
      creado_en: doc.creado_en || new Date().toISOString(),
    };

    const index = list.findIndex(d => String(d.id) === String(id));
    if (index >= 0) {
      list[index] = docCompleto;
    } else {
      list.unshift(docCompleto);
    }
    setLocal('documentos', list);
    return docCompleto;
  },

  async cambiarEstado(id: number | string, nuevoEstado: Documento['estado']): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('documentos').update({ estado: nuevoEstado }).eq('id', id);
    }
    const list = getLocal<Documento[]>('documentos', DEFAULT_DOCUMENTOS);
    const item = list.find(d => String(d.id) === String(id));
    if (item) {
      item.estado = nuevoEstado;
      setLocal('documentos', list);
    }
  },

  async eliminarDocumento(id: number | string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('documentos').delete().eq('id', id);
    }
    let list = getLocal<Documento[]>('documentos', DEFAULT_DOCUMENTOS);
    list = list.filter(d => String(d.id) !== String(id));
    setLocal('documentos', list);
  },

  async duplicarDocumento(id: number | string): Promise<Documento> {
    const original = await this.getDocumentoById(id);
    if (!original) throw new Error('Documento original no encontrado');

    const todos = await this.getDocumentos();
    const numeros = todos.map(d => d.numero);
    const nuevoNumero = generarNumeroSiguiente(original.tipo, numeros);

    const copia: Documento = {
      ...original,
      id: undefined,
      numero: nuevoNumero,
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'borrador',
      creado_en: new Date().toISOString(),
    };

    return await this.saveDocumento(copia, original.items || []);
  },

  // ── Envíos ──
  async registrarEnvio(envio: EnvioLog): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('envios').insert(envio);
    }
    const envios = getLocal<EnvioLog[]>('envios', []);
    envios.unshift({ ...envio, id: Date.now() });
    setLocal('envios', envios);
  },

  async getEnvios(documentoId?: number | string): Promise<EnvioLog[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('envios').select('*').order('enviado_en', { ascending: false });
      if (documentoId) query = query.eq('documento_id', documentoId);
      const { data } = await query;
      if (data) return data;
    }
    const envios = getLocal<EnvioLog[]>('envios', []);
    return documentoId ? envios.filter(e => String(e.documento_id) === String(documentoId)) : envios;
  },

  // ── Autenticación y Usuarios ──
  async login(email: string, password: string): Promise<Usuario | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, activo, creado_en')
        .eq('email', email)
        .eq('password_hash', password)
        .eq('activo', true)
        .single();
      if (!error && data) return data as Usuario;
      return null;
    }
    // Fallback local: admin por defecto
    if (email === 'admin@moran.com' && password === 'admin123') {
      return { id: 1, nombre: 'Administrador', email: 'admin@moran.com', rol: 'admin', activo: true };
    }
    return null;
  },

  async getUsuarios(): Promise<Usuario[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, activo, creado_en')
        .order('creado_en', { ascending: false });
      if (!error && data) return data as Usuario[];
    }
    return [{ id: 1, nombre: 'Administrador', email: 'admin@moran.com', rol: 'admin', activo: true }];
  },

  async crearUsuario(nombre: string, email: string, password: string, rol: 'admin' | 'empleado'): Promise<Usuario | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .insert({ nombre, email, password_hash: password, rol, activo: true })
        .select('id, nombre, email, rol, activo, creado_en')
        .single();
      if (error) throw new Error(error.message);
      if (data) return data as Usuario;
    }
    return null;
  },

  async actualizarUsuario(id: number | string, datos: { nombre?: string; email?: string; rol?: string; activo?: boolean; password_hash?: string }): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('usuarios').update(datos).eq('id', id);
      if (error) throw new Error(error.message);
    }
  },

  async eliminarUsuario(id: number | string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
  },
};
