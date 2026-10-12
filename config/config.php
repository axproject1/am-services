<?php
// config.php
session_start();

// Configuración de errores para desarrollo (desactivar en producción)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Constantes de rutas
define('BASE_URL', 'http://localhost/am-services/public/'); // Ajusta según tu configuración
define('ROOT_PATH', dirname(__DIR__) . '/');
define('UPLOAD_PATH', ROOT_PATH . 'public/uploads/');
define('OUTPUT_PATH', ROOT_PATH . 'output/documentos/');
define('APP_ENCRYPTION_KEY', 'MoranAppSecretKey2026!#$'); // Cambiar en producción

// Asegurar que existan los directorios necesarios
if (!is_dir(UPLOAD_PATH . 'logos')) {
    mkdir(UPLOAD_PATH . 'logos', 0777, true);
}
if (!is_dir(OUTPUT_PATH)) {
    mkdir(OUTPUT_PATH, 0777, true);
}

// Zona horaria por defecto
date_default_timezone_set('America/Panama');

// Cargar dependencias de Composer si existe
$autoloadPath = ROOT_PATH . 'vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
}
