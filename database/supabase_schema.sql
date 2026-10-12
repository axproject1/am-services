-- ========================================================
-- SISTEMA DE DOCUMENTOS COMERCIALES - SERVICIOS MORÁN
-- Script de Migración para SUPABASE (PostgreSQL)
-- Copia y pega este script en el "SQL Editor" de tu proyecto Supabase.
-- ========================================================

-- 1. Tabla: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla: empresa (Configuración institucional)
CREATE TABLE IF NOT EXISTS public.empresa (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL DEFAULT 'SERVICIOS MORÁN',
    subtitulo VARCHAR(200) DEFAULT 'Servicios Múltiples Residenciales y Comerciales',
    logo_path TEXT,
    telefono VARCHAR(50) DEFAULT '+507 6000-0000',
    email VARCHAR(150) DEFAULT 'info@serviciosmoran.com',
    direccion VARCHAR(255) DEFAULT 'Panamá, Rep. de Panamá',
    ruc_nit VARCHAR(50) DEFAULT '',
    terminos_default JSONB DEFAULT '[
        {"label": "Condiciones de Pago", "value": "50% de abono inicial al aprobar la propuesta y 50% al finalizar los trabajos."},
        {"label": "Validez de Cotización", "value": "15 días calendario a partir de la fecha de emisión."},
        {"label": "Garantía", "value": "30 días sobre mano de obra calificada."}
    ]'::jsonb,
    itbms_default NUMERIC(5,2) DEFAULT 7.00,
    gmail_app_password TEXT,
    activa BOOLEAN DEFAULT TRUE
);

-- 3. Tabla: clientes (Directorio para autocompletar)
CREATE TABLE IF NOT EXISTS public.clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(50),
    direccion VARCHAR(255),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla: documentos (Cotizaciones, Facturas y Presupuestos)
CREATE TABLE IF NOT EXISTS public.documentos (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cotizacion', 'factura', 'presupuesto')),
    numero VARCHAR(50) UNIQUE NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    valida_hasta DATE,
    cliente_id BIGINT REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nombre_manual VARCHAR(150),
    emisor VARCHAR(150) DEFAULT 'Servicios Morán',
    emisor_cargo VARCHAR(100) DEFAULT 'Gerencia General',
    responsable VARCHAR(150) DEFAULT '',
    responsable_cargo VARCHAR(100) DEFAULT 'Técnico Instalador',
    usuario_id BIGINT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    usar_empresa BOOLEAN DEFAULT TRUE,
    incluir_firmas BOOLEAN DEFAULT TRUE,
    incluir_itbms BOOLEAN DEFAULT TRUE,
    itbms_porcentaje NUMERIC(5,2) DEFAULT 7.00,
    incluir_mano_obra BOOLEAN DEFAULT FALSE,
    mano_obra_monto NUMERIC(12,2) DEFAULT 0.00,
    subtotal_equipos NUMERIC(12,2) DEFAULT 0.00,
    subtotal_materiales NUMERIC(12,2) DEFAULT 0.00,
    subtotal_neto NUMERIC(12,2) DEFAULT 0.00,
    itbms_monto NUMERIC(12,2) DEFAULT 0.00,
    total_general NUMERIC(12,2) DEFAULT 0.00,
    abono_porcentaje NUMERIC(5,2) DEFAULT 0.00,
    abono_base VARCHAR(20) DEFAULT 'total' CHECK (abono_base IN ('total', 'mano_obra')),
    abono_monto NUMERIC(12,2) DEFAULT 0.00,
    saldo_restante NUMERIC(12,2) DEFAULT 0.00,
    incluir_logo BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    seccion_titulo VARCHAR(150) DEFAULT 'DETALLE DE EQUIPOS Y MATERIALES',
    terminos JSONB DEFAULT '[]'::jsonb,
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado', 'aceptado', 'rechazado')),
    docx_path TEXT,
    pdf_path TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla: documento_items
CREATE TABLE IF NOT EXISTS public.documento_items (
    id BIGSERIAL PRIMARY KEY,
    documento_id BIGINT NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
    categoria VARCHAR(30) DEFAULT 'material' CHECK (categoria IN ('mano_obra', 'material', 'equipo', 'servicio', 'transporte', 'otros')),
    cantidad NUMERIC(10,2) DEFAULT 1.00,
    descripcion TEXT NOT NULL,
    precio_unitario NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) DEFAULT 0.00,
    orden INT DEFAULT 0
);

-- 6. Tabla: envios (Log de correos y WhatsApp)
CREATE TABLE IF NOT EXISTS public.envios (
    id BIGSERIAL PRIMARY KEY,
    documento_id BIGINT NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('email', 'whatsapp', 'impresion')),
    destinatario VARCHAR(150),
    enviado_en TIMESTAMPTZ DEFAULT NOW(),
    exitoso BOOLEAN DEFAULT TRUE
);

-- ── Índices para velocidad de búsqueda ──
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON public.documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_estado ON public.documentos(estado);
CREATE INDEX IF NOT EXISTS idx_documentos_fecha ON public.documentos(fecha);
CREATE INDEX IF NOT EXISTS idx_documento_items_doc ON public.documento_items(documento_id);

-- ── Datos Iniciales (Seeds) ──
-- Usuario Administrador por defecto: admin@moran.com / admin123
INSERT INTO public.usuarios (nombre, email, password_hash, rol)
VALUES ('Administrador', 'admin@moran.com', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Configuración Inicial de la Empresa
INSERT INTO public.empresa (id, nombre, subtitulo, telefono, email, direccion, ruc_nit, itbms_default)
VALUES (
    1,
    'SERVICIOS MORÁN',
    'Servicios Múltiples Residenciales y Comerciales',
    '+507 6000-0000',
    'info@serviciosmoran.com',
    'Panamá, Rep. de Panamá',
    '8-765-4321 DV 90',
    7.00
)
ON CONFLICT (id) DO NOTHING;

-- Clientes iniciales para pruebas
INSERT INTO public.clientes (nombre, email, telefono, direccion)
VALUES 
    ('Constructora Del Istmo S.A.', 'proyectos@istmo.com', '+507 6555-1234', 'Costa del Este, Ciudad de Panamá'),
    ('Residencial Punta Barco', 'administracion@puntabarco.com', '+507 6888-4321', 'Punta Barco, Chame'),
    ('Lic. Roberto González', 'rgonzalez@gmail.com', '+507 6111-9988', 'San Francisco, Calle 74')
ON CONFLICT DO NOTHING;

-- Habilitar permisos de lectura/escritura pública (o según clave anon de Supabase)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para clave pública (anon) y servicio
DROP POLICY IF EXISTS "Permitir todo a usuarios anonimos en usuarios" ON public.usuarios;
CREATE POLICY "Permitir todo a usuarios anonimos en usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios anonimos en empresa" ON public.empresa;
CREATE POLICY "Permitir todo a usuarios anonimos en empresa" ON public.empresa FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios anonimos en clientes" ON public.clientes;
CREATE POLICY "Permitir todo a usuarios anonimos en clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios anonimos en documentos" ON public.documentos;
CREATE POLICY "Permitir todo a usuarios anonimos en documentos" ON public.documentos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios anonimos en documento_items" ON public.documento_items;
CREATE POLICY "Permitir todo a usuarios anonimos en documento_items" ON public.documento_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios anonimos en envios" ON public.envios;
CREATE POLICY "Permitir todo a usuarios anonimos en envios" ON public.envios FOR ALL USING (true) WITH CHECK (true);
