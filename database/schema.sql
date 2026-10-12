CREATE DATABASE IF NOT EXISTS moran_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moran_app;

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'empleado') DEFAULT 'empleado',
  activo TINYINT(1) DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuración de empresa (fija, editable)
CREATE TABLE IF NOT EXISTS empresa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  subtitulo VARCHAR(200),
  logo_path VARCHAR(255),
  telefono VARCHAR(50),
  email VARCHAR(150),
  direccion VARCHAR(255),
  ruc_nit VARCHAR(50),
  terminos_default TEXT,             -- JSON array de términos predeterminados
  itbms_default DECIMAL(5,2) DEFAULT 7.00,
  gmail_app_password VARCHAR(255),   -- cifrado
  activa TINYINT(1) DEFAULT 1
);

-- Clientes (opcional, para autocompletar)
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  telefono VARCHAR(50),
  direccion VARCHAR(255),
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documentos (cotización / factura / presupuesto)
CREATE TABLE IF NOT EXISTS documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('cotizacion', 'factura', 'presupuesto') NOT NULL,
  numero VARCHAR(30) UNIQUE NOT NULL,    -- COT-2026-001
  fecha DATE NOT NULL,
  valida_hasta DATE,
  cliente_id INT NULL,
  cliente_nombre_manual VARCHAR(150),
  usuario_id INT NOT NULL,
  usar_empresa TINYINT(1) DEFAULT 1,
  incluir_itbms TINYINT(1) DEFAULT 1,
  itbms_porcentaje DECIMAL(5,2) DEFAULT 7.00,
  incluir_mano_obra TINYINT(1) DEFAULT 0,
  mano_obra_monto DECIMAL(10,2) DEFAULT 0,
  subtotal_equipos DECIMAL(10,2) DEFAULT 0,
  subtotal_materiales DECIMAL(10,2) DEFAULT 0,
  subtotal_neto DECIMAL(10,2) DEFAULT 0,
  itbms_monto DECIMAL(10,2) DEFAULT 0,
  total_general DECIMAL(10,2) DEFAULT 0,
  terminos TEXT,                          -- JSON array personalizado
  estado ENUM('borrador','enviado','aceptado','rechazado') DEFAULT 'borrador',
  docx_path VARCHAR(255),
  pdf_path VARCHAR(255),
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Ítems de cada documento
CREATE TABLE IF NOT EXISTS documento_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  documento_id INT NOT NULL,
  categoria ENUM('equipo','material') DEFAULT 'material',
  cantidad VARCHAR(20),
  descripcion VARCHAR(255) NOT NULL,
  precio_unitario DECIMAL(10,2),
  total DECIMAL(10,2),
  orden INT,
  FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE
);

-- Log de envíos (email / whatsapp / impresión)
CREATE TABLE IF NOT EXISTS envios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  documento_id INT NOT NULL,
  canal ENUM('email','whatsapp','impresion') NOT NULL,
  destinatario VARCHAR(150),
  enviado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  exitoso TINYINT(1) DEFAULT 1,
  FOREIGN KEY (documento_id) REFERENCES documentos(id)
);

-- Insertar usuario admin por defecto (admin@moran.com / admin123)
-- El hash se generó usando password_hash('admin123', PASSWORD_DEFAULT)
INSERT INTO usuarios (nombre, email, password_hash, rol) 
VALUES ('Administrador', 'admin@moran.com', '$2y$10$tZ2E/L.51.fT305Mok51/O4Y36hYI901N/.M229z3rV4W6uF1R4Kq', 'admin')
ON DUPLICATE KEY UPDATE id=id;
