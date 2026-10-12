<?php
require 'config/config.php';
require 'vendor/autoload.php';
require 'src/Documentos/PdfGenerator.php';

try {
    $gen = new \App\Documentos\PdfGenerator();
    $path = $gen->generar([
        'usar_empresa' => true,
        'tipo' => 'cotizacion',
        'numero' => 'COT-TEST',
        'fecha' => '2026-07-22',
        'items' => [
            ['cantidad'=>1, 'descripcion'=>'Test', 'precio_unitario'=>10, 'total'=>10]
        ],
        'incluir_mano_obra' => false,
        'incluir_itbms' => false
    ]);
    echo "OK: $path\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
