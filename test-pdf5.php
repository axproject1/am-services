<?php
require 'config/config.php';
require 'config/database.php';
require 'vendor/autoload.php';
require 'src/Documentos/PdfGenerator.php';
require 'src/Documentos/DocumentoRepository.php';

try {
    $db = getDB();
    $repo = new \App\Documentos\DocumentoRepository($db);
    $doc = $repo->obtenerPorId(5);
    $items = $repo->obtenerItems(5);
    
    if (!$doc) {
        die("Doc 5 no encontrado\n");
    }
    
    // Preparar para generator
    $doc['items'] = $items;
    
    // Cargar empresa
    $empresa = $db->query("SELECT * FROM empresa WHERE activa = 1 LIMIT 1")->fetch();
    $doc['empresa'] = $empresa ?: [];
    
    $gen = new \App\Documentos\PdfGenerator();
    $path = $gen->generar($doc);
    echo "OK: $path\n";
    
    // Update path
    $stmtUpdate = $db->prepare('UPDATE documentos SET pdf_path = ? WHERE id = 5');
    $stmtUpdate->execute([$path]);
    
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
