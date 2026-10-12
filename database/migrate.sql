-- Migración: Agregar columnas para abono, sección y emisor
-- Ejecutar una sola vez sobre la base de datos existente moran_app

USE moran_app;

-- Agregar columna de abono inicial (porcentaje)
ALTER TABLE documentos
    ADD COLUMN IF NOT EXISTS abono_porcentaje DECIMAL(5,2) DEFAULT 0 AFTER total_general,
    ADD COLUMN IF NOT EXISTS seccion_titulo VARCHAR(255) DEFAULT '' AFTER abono_porcentaje,
    ADD COLUMN IF NOT EXISTS emisor VARCHAR(150) DEFAULT '' AFTER seccion_titulo;

-- También actualizar el schema para nuevas instalaciones (ya incluido en schema.sql)
SELECT 'Migración completada exitosamente.' AS resultado;
