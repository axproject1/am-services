-- ========================================================
-- MIGRACIÓN PARA SUPABASE: Permitir 'lista_materiales'
-- Copia y pega este script en el SQL Editor de tu panel de Supabase
-- ========================================================

-- 1. Eliminar cualquier restricción CHECK previa en la columna 'tipo'
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.documentos'::regclass 
        AND contype = 'c' 
        AND pg_get_constraintdef(oid) LIKE '%tipo%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.documentos DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2. Crear la nueva restricción CHECK con 'lista_materiales' incluida
ALTER TABLE public.documentos 
ADD CONSTRAINT documentos_tipo_check 
CHECK (tipo IN ('cotizacion', 'factura', 'presupuesto', 'lista_materiales'));

-- 3. Agregar columnas específicas de Obra / Entrega y Unidades de medida (si no existen)
ALTER TABLE public.documentos 
ADD COLUMN IF NOT EXISTS proyecto_obra VARCHAR(200),
ADD COLUMN IF NOT EXISTS lugar_entrega VARCHAR(250),
ADD COLUMN IF NOT EXISTS solicitado_por VARCHAR(150);

ALTER TABLE public.documento_items 
ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(30) DEFAULT 'und';

-- ¡Listo! Supabase ahora admite guardar Listas de Materiales con todos sus campos.
