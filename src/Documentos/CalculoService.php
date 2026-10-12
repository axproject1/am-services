<?php
namespace App\Documentos;

class CalculoService {
    /**
     * Recalcula los totales agrupando automáticamente por categoría.
     * Categorías soportadas: mano_obra, material, equipo, servicio, transporte, otros
     */
    public function calcular(
        array  $items,
        bool   $incluirManoObra,
        float  $manoObra,
        bool   $incluirItbms,
        float  $itbmsPorcentaje,
        float  $abonoPorcentaje = 0,
        string $abonoBase = 'total'
    ): array {
        $porCategoria = [];
        $subtotalNeto = 0;

        foreach ($items as $item) {
            $cantidad       = (float)($item['cantidad']       ?? 0);
            $precioUnitario = (float)($item['precio_unitario'] ?? 0);
            $totalItem      = $cantidad * $precioUnitario;
            $cat            = $item['categoria'] ?? 'material';

            if (!isset($porCategoria[$cat])) {
                $porCategoria[$cat] = 0;
            }
            $porCategoria[$cat] += $totalItem;
            $subtotalNeto       += $totalItem;
        }

        // Mano de Obra manual (toggle)
        $manoObraManual = $incluirManoObra ? max(0, $manoObra) : 0;
        $subtotalNeto  += $manoObraManual;

        $itbmsMonto    = $incluirItbms ? $subtotalNeto * ($itbmsPorcentaje / 100) : 0;
        $totalGeneral  = $subtotalNeto + $itbmsMonto;

        // Para compatibilidad con los PDF/DOCX generators:
        $subtotalEquipos    = round($porCategoria['equipo']    ?? 0, 2);
        $subtotalMateriales = round($porCategoria['material']  ?? 0, 2);
        $manoObraCat        = round($porCategoria['mano_obra'] ?? 0, 2);
        $manoObraTotal      = round($manoObraCat + $manoObraManual, 2);

        // Abono inicial y saldo restante
        $abonoPorcentaje = max(0, min(100, $abonoPorcentaje));
        $baseCalc        = ($abonoBase === 'mano_obra') ? $manoObraTotal : $totalGeneral;
        $abonoMonto      = ($abonoPorcentaje > 0) ? round($baseCalc * ($abonoPorcentaje / 100), 2) : 0;
        $saldoRestante   = round($totalGeneral - $abonoMonto, 2);

        return [
            'subtotal_equipos'    => $subtotalEquipos,
            'subtotal_materiales' => $subtotalMateriales,
            'mano_obra_monto'     => $manoObraManual,
            'subtotal_neto'       => round($subtotalNeto, 2),
            'itbms_monto'         => round($itbmsMonto, 2),
            'total_general'       => round($totalGeneral, 2),
            'abono_porcentaje'    => round($abonoPorcentaje, 2),
            'abono_monto'         => $abonoMonto,
            'saldo_restante'      => $saldoRestante,
            'por_categoria'       => array_map(fn($v) => round($v, 2), $porCategoria),
        ];
    }
}
