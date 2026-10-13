export type TipoDocumento = 'cotizacion' | 'factura' | 'presupuesto' | 'lista_materiales';

export type EstadoDocumento = 'borrador' | 'enviado' | 'aceptado' | 'rechazado';

export type CategoriaItem = 'mano_obra' | 'material' | 'equipo' | 'servicio' | 'transporte' | 'otros';

export interface DocumentoItem {
  id?: number | string;
  documento_id?: number | string;
  categoria: CategoriaItem;
  cantidad: number;
  descripcion: string;
  precio_unitario: number;
  total: number;
  orden?: number;
}

export interface TerminoCondicion {
  label: string;
  value: string;
}

export interface EmpresaConfig {
  id?: number | string;
  nombre: string;
  subtitulo: string;
  logo_path?: string;
  telefono: string;
  email: string;
  direccion: string;
  ruc_nit: string;
  terminos_default: TerminoCondicion[];
  itbms_default: number;
  gmail_app_password?: string;
  activa: boolean;
}

export interface Cliente {
  id: number | string;
  nombre: string;
  ruc_nit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  creado_en?: string;
}

export interface Documento {
  id?: number | string;
  tipo: TipoDocumento;
  numero: string;
  fecha: string;
  valida_hasta?: string;
  cliente_id?: number | string | null;
  cliente_nombre_manual?: string;
  cliente?: Cliente;
  emisor?: string;
  emisor_cargo?: string;
  responsable?: string;
  responsable_cargo?: string;
  usuario_id?: number | string;
  usar_empresa: boolean;
  incluir_logo?: boolean;
  incluir_firmas: boolean;
  incluir_itbms: boolean;
  itbms_porcentaje: number;
  incluir_mano_obra: boolean;
  mano_obra_monto: number;
  subtotal_equipos: number;
  subtotal_materiales: number;
  subtotal_neto: number;
  itbms_monto: number;
  total_general: number;
  abono_porcentaje: number;
  abono_base: 'total' | 'mano_obra';
  abono_monto?: number;
  saldo_restante?: number;
  seccion_titulo?: string;
  terminos: TerminoCondicion[];
  observaciones?: string;
  notas?: string;
  estado: EstadoDocumento;
  docx_path?: string;
  pdf_path?: string;
  items?: DocumentoItem[];
  creado_en?: string;
  actualizado_en?: string;
}

export interface EnvioLog {
  id?: number | string;
  documento_id: number | string;
  canal: 'email' | 'whatsapp' | 'impresion';
  destinatario: string;
  enviado_en: string;
  exitoso: boolean;
}

export type RolUsuario = 'admin' | 'empleado';

export interface Usuario {
  id: number | string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  creado_en?: string;
}
