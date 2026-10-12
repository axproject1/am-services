<?php
namespace App\Documentos;

use PDO;

class NumeracionService {
    private PDO $db;

    public function __construct(PDO $db) { 
        $this->db = $db; 
    }

    public function generarNumero(string $tipo): string {
        $prefijos = [
            'cotizacion' => 'COT', 
            'factura' => 'FAC', 
            'presupuesto' => 'PRE'
        ];
        
        if (!isset($prefijos[$tipo])) {
            throw new \InvalidArgumentException("Tipo de documento inválido");
        }
        
        $prefijo = $prefijos[$tipo];
        $año = date('Y');

        $stmt = $this->db->prepare(
            "SELECT numero FROM documentos WHERE tipo = ? AND numero LIKE ? ORDER BY id DESC LIMIT 1"
        );
        $stmt->execute([$tipo, "{$prefijo}-{$año}-%"]);
        $ultimo = $stmt->fetchColumn();

        $siguiente = 1;
        if ($ultimo) {
            $partes = explode('-', $ultimo);
            $siguiente = (int)end($partes) + 1;
        }

        return sprintf('%s-%s-%03d', $prefijo, $año, $siguiente);
    }
}
