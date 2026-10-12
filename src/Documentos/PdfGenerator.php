<?php
namespace App\Documentos;

use Dompdf\Dompdf;
use Dompdf\Options;

class PdfGenerator {
    private const BRAND_BLUE   = '#1B3A6B';
    private const ACCENT_BLUE  = '#2E6DB4';
    private const LIGHT_BLUE   = '#EAF1FB';
    private const MID_GRAY     = '#F2F5F9';
    private const WHITE        = '#FFFFFF';
    private const BORDER_COLOR = '#D0D8E8';

    public function generar(array $datos): string {
        $empresaNombre = $datos['usar_empresa'] ? ($datos['empresa']['nombre']   ?? 'SERVICIOS MORÁN') : '';
        $empresaSub    = $datos['usar_empresa'] ? ($datos['empresa']['subtitulo'] ?? 'Servicios Múltiples') : '';
        $empresaTel    = $datos['usar_empresa'] ? ($datos['empresa']['telefono']  ?? '') : '';

        $emisor  = !empty($datos['emisor'])  ? $datos['emisor']  : ($empresaNombre ?: 'Servicios Morán');
        $cliente = !empty($datos['cliente_nombre']) ? $datos['cliente_nombre'] : 'Sin cliente';

        // Fecha formateada en español
        $fechaFmt      = $this->fechaEspanol($datos['fecha']);
        $validaFmt     = !empty($datos['valida_hasta']) ? $this->fechaEspanol($datos['valida_hasta']) : '—';
        $tipoLabel     = $this->tipoLabel($datos['tipo']);
        $seccionTitulo = !empty($datos['seccion_titulo']) ? strtoupper($datos['seccion_titulo']) : 'DETALLE DE EQUIPOS Y MATERIALES';

        // Totales
        $subtotalManoObra = (float)($datos['mano_obra_monto']  ?? 0);
        $subtotalEquipos  = (float)($datos['subtotal_equipos'] ?? 0);
        $subtotalMat      = (float)($datos['subtotal_materiales'] ?? 0);
        $subtotalNeto     = (float)($datos['subtotal_neto']    ?? 0);
        $itbmsMonto       = (float)($datos['itbms_monto']      ?? 0);
        $totalGeneral     = (float)($datos['total_general']    ?? 0);
        $abonoPct         = (float)($datos['abono_porcentaje'] ?? 0);
        $abonoMonto       = ($abonoPct > 0) ? round($totalGeneral * ($abonoPct / 100), 2) : 0;
        $saldoRestante    = round($totalGeneral - $abonoMonto, 2);

        ob_start();
        ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: "DejaVu Sans", "Helvetica", "Arial", sans-serif;
            font-size: 11px;
            color: #1A1A1A;
            margin: 0;
            padding: 0;
        }

        /* ── FOOTER FIJO ── */
        .page-footer {
            position: fixed;
            bottom: -20px;
            left: 0; right: 0;
            height: 28px;
            border-top: 1px solid <?= self::ACCENT_BLUE ?>;
            padding-top: 5px;
            color: #5A5A5A;
            font-size: 9px;
        }
        .footer-empresa { float: left; }
        .footer-pagina  { float: right; }
        .page-number:after { content: counter(page); }

        /* ── HEADER ── */
        .doc-header {
            width: 100%;
            border-bottom: 3px solid <?= self::ACCENT_BLUE ?>;
            margin-bottom: 18px;
            padding-bottom: 10px;
        }
        .header-left  { width: 60%; float: left; }
        .header-right { width: 40%; float: right; text-align: right; }
        .brand-name   { color: <?= self::BRAND_BLUE ?>; font-size: 20px; font-weight: bold; margin: 0 0 2px 0; }
        .brand-sub    { color: #5A5A5A; font-size: 10px; margin: 0; }
        .doc-type     { color: <?= self::ACCENT_BLUE ?>; font-size: 26px; font-weight: bold; margin: 0; }
        .clear        { clear: both; }

        /* ── META INFO ── */
        .meta-table   { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .meta-table td { padding: 3px 4px; font-size: 11px; }
        .meta-label   { color: <?= self::ACCENT_BLUE ?>; font-weight: bold; }

        /* ── SECTION TITLE ── */
        .section-title {
            color: <?= self::BRAND_BLUE ?>;
            font-size: 12px;
            font-weight: bold;
            border-bottom: 2px solid <?= self::ACCENT_BLUE ?>;
            padding-bottom: 5px;
            margin-bottom: 10px;
            margin-top: 0;
        }

        /* ── ITEMS TABLE ── */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            border: 1px solid <?= self::BORDER_COLOR ?>;
        }
        .items-table th {
            background-color: <?= self::BRAND_BLUE ?>;
            color: <?= self::WHITE ?>;
            padding: 7px 8px;
            border: 1px solid <?= self::BORDER_COLOR ?>;
            font-size: 10px;
        }
        .items-table th.c { text-align: center; }
        .items-table th.r { text-align: right; }
        .items-table td {
            padding: 7px 8px;
            border: 1px solid <?= self::BORDER_COLOR ?>;
            font-size: 10.5px;
        }
        .items-table td.c { text-align: center; }
        .items-table td.r { text-align: right; }
        .row-even { background-color: <?= self::WHITE ?>; }
        .row-odd  { background-color: <?= self::MID_GRAY ?>; }

        /* ── TOTALS TABLE ── */
        .totals-wrap  { width: 100%; margin-bottom: 20px; }
        .totals-table { width: 55%; float: right; border-collapse: collapse; }
        .totals-table td { padding: 5px 8px; font-size: 10.5px; }
        .totals-table td.r { text-align: right; }
        .tot-subtotal  { background-color: <?= self::WHITE ?>; }
        .tot-abono     { background-color: <?= self::MID_GRAY ?>; }
        .tot-saldo     { background-color: <?= self::WHITE ?>; }
        .tot-itbms     { background-color: <?= self::MID_GRAY ?>; }
        .tot-final {
            background-color: <?= self::BRAND_BLUE ?>;
            color: <?= self::WHITE ?>;
            font-weight: bold;
            font-size: 12px;
        }

        /* ── CONDICIONES BOXES ── */
        .condicion-box {
            background-color: <?= self::LIGHT_BLUE ?>;
            border: 1px solid <?= self::BORDER_COLOR ?>;
            border-radius: 4px;
            padding: 10px 12px;
            margin-bottom: 10px;
            font-size: 10.5px;
            line-height: 1.5;
        }
        .condicion-label {
            color: <?= self::ACCENT_BLUE ?>;
            font-weight: bold;
        }

        /* ── SIGNATURES ── */
        .sig-table { width: 100%; margin-top: 45px; border-collapse: collapse; }
        .sig-cell  {
            width: 45%;
            border-top: 2px solid <?= self::BRAND_BLUE ?>;
            padding-top: 5px;
            color: #5A5A5A;
            font-size: 10px;
        }
        .sig-space { width: 10%; }
    </style>
</head>
<body>

    <!-- FOOTER FIJO -->
    <div class="page-footer">
        <span class="footer-empresa"><?= htmlspecialchars($empresaNombre ?: 'Empresa') ?> &bull; Este documento es confidencial</span>
        <span class="footer-pagina">Página <span class="page-number"></span> de 1</span>
        <div class="clear"></div>
    </div>

    <!-- ENCABEZADO -->
    <div class="doc-header">
        <div class="header-left">
            <?php 
            $logo = !empty($datos['empresa']['logo_path']) ? dirname(__DIR__, 2) . '/public/' . $datos['empresa']['logo_path'] : '';
            if ($logo && file_exists($logo)): 
                $ext = pathinfo($logo, PATHINFO_EXTENSION);
                $b64 = base64_encode(file_get_contents($logo));
            ?>
                <img src="data:image/<?= $ext ?>;base64,<?= $b64 ?>" style="max-height: 60px; max-width: 250px;">
            <?php else: ?>
                <p class="brand-name"><?= htmlspecialchars($empresaNombre) ?></p>
                <p class="brand-sub"><?= htmlspecialchars($empresaSub) ?></p>
            <?php endif; ?>
        </div>
        <div class="header-right">
            <p class="doc-type"><?= strtoupper($tipoLabel) ?></p>
        </div>
        <div class="clear"></div>
    </div>

    <!-- META-INFO: 8 campos, 2 columnas -->
    <table class="meta-table">
        <tr>
            <td width="50%"><span class="meta-label">No. <?= ucfirst($tipoLabel) ?>:</span> <?= htmlspecialchars($datos['numero']) ?></td>
            <td width="50%"><span class="meta-label">Fecha:</span> <?= $fechaFmt ?></td>
        </tr>
        <tr>
            <td><span class="meta-label">Cliente:</span> <?= htmlspecialchars($cliente) ?></td>
            <td><span class="meta-label">Válida hasta:</span> <?= $validaFmt ?></td>
        </tr>
        <tr>
            <td><span class="meta-label">Emisor:</span> <?= htmlspecialchars($emisor) ?></td>
            <td><?php if ($empresaTel): ?><span class="meta-label">Contacto:</span> <?= htmlspecialchars($empresaTel) ?><?php endif; ?></td>
        </tr>
        <?php if (!empty($datos['responsable'])): ?>
        <tr>
            <td><span class="meta-label">Responsable:</span> <?= htmlspecialchars($datos['responsable']) ?><?= !empty($datos['responsable_cargo']) ? ' (' . htmlspecialchars($datos['responsable_cargo']) . ')' : '' ?></td>
            <td></td>
        </tr>
        <?php endif; ?>
    </table>

    <!-- SECCIÓN TÍTULO -->
    <div class="section-title"><?= htmlspecialchars($seccionTitulo) ?></div>

    <!-- TABLA DE ÍTEMS -->
    <table class="items-table">
        <thead>
            <tr>
                <th class="c" style="width:10%">Cant.</th>
                <th style="width:55%">Descripción</th>
                <th class="r" style="width:17%">P. Unitario</th>
                <th class="r" style="width:18%">Total</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($datos['items'] as $idx => $item): ?>
            <tr class="<?= $idx % 2 === 0 ? 'row-even' : 'row-odd' ?>">
                <td class="c"><?= htmlspecialchars($item['cantidad']) ?></td>
                <td><?= htmlspecialchars($item['descripcion']) ?></td>
                <td class="r">$<?= number_format((float)$item['precio_unitario'], 2) ?></td>
                <td class="r">$<?= number_format((float)$item['total'], 2) ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <!-- TOTALES -->
    <div class="totals-wrap">
        <table class="totals-table">
            <?php
            // Agrupar y sumar por categoría
            $subtotales = [];
            foreach ($datos['items'] as $item) {
                $cat = $item['categoria'] ?? 'material';
                $cant = (float)($item['cantidad'] ?? 0);
                $pu = (float)($item['precio_unitario'] ?? 0);
                if (!isset($subtotales[$cat])) {
                    $subtotales[$cat] = 0;
                }
                $subtotales[$cat] += $cant * $pu;
            }

            $categoryLabels = [
                'mano_obra'  => 'Subtotal Mano de Obra',
                'material'   => 'Subtotal Materiales',
                'equipo'     => 'Subtotal Equipos',
                'servicio'   => 'Subtotal Servicios',
                'transporte' => 'Subtotal Transporte',
                'otros'      => 'Subtotal Otros',
            ];

            $rows = [];
            $order = ['mano_obra', 'material', 'equipo', 'servicio', 'transporte', 'otros'];
            $cIdx = 0;
            foreach ($order as $cat) {
                if (!empty($subtotales[$cat]) && $subtotales[$cat] > 0) {
                    $label = $categoryLabels[$cat] ?? 'Subtotal ' . ucfirst($cat);
                    $cls = ($cIdx % 2 === 0) ? 'tot-subtotal' : 'tot-abono';
                    $rows[] = ['cls' => $cls, 'label' => $label, 'val' => '$' . number_format($subtotales[$cat], 2)];
                    $cIdx++;
                }
            }

            // Mano de Obra manual (toggle)
            if ($datos['incluir_mano_obra'] && $subtotalManoObra > 0) {
                $cls = ($cIdx % 2 === 0) ? 'tot-subtotal' : 'tot-abono';
                $rows[] = ['cls' => $cls, 'label' => 'Mano de Obra (manual)', 'val' => '$' . number_format($subtotalManoObra, 2)];
                $cIdx++;
            }

            // Abono inicial si aplica
            if ($abonoMonto > 0) {
                $isManoObraBase = ($datos['abono_base'] ?? '') === 'mano_obra';
                $abonoTag       = $isManoObraBase ? 'Abono Mano de Obra' : 'Abono inicial';
                $rows[] = ['cls' => 'tot-abono', 'label' => "{$abonoTag} ({$abonoPct}%)",   'val' => '$' . number_format($abonoMonto, 2)];
                $rows[] = ['cls' => 'tot-saldo', 'label' => "Saldo restante (" . (100 - $abonoPct) . "%)", 'val' => '$' . number_format($saldoRestante, 2)];
            }

            // ITBMS si aplica
            if ($datos['incluir_itbms'] && $itbmsMonto > 0) {
                $rows[] = ['cls' => 'tot-itbms', 'label' => "ITBMS ({$datos['itbms_porcentaje']}%)", 'val' => '$' . number_format($itbmsMonto, 2)];
            }

            foreach ($rows as $row):
            ?>
            <tr>
                <td class="<?= $row['cls'] ?>"><?= htmlspecialchars($row['label']) ?></td>
                <td class="<?= $row['cls'] ?> r"><?= htmlspecialchars($row['val']) ?></td>
            </tr>
            <?php endforeach; ?>
            <!-- TOTAL GENERAL -->
            <tr>
                <td class="tot-final">TOTAL, GENERAL</td>
                <td class="tot-final r">$<?= number_format($totalGeneral, 2) ?></td>
            </tr>
        </table>
        <div class="clear"></div>
    </div>

    <!-- TÉRMINOS / CONDICIONES -->
    <?php
    $termsArr = [];
    if (!empty($datos['terminos'])) {
        $termsArr = is_string($datos['terminos']) ? json_decode($datos['terminos'], true) : $datos['terminos'];
        if (!is_array($termsArr)) $termsArr = [];
    }
    foreach ($termsArr as $term):
        if (empty($term['value'])) continue;
    ?>
    <div class="condicion-box">
        <span class="condicion-label"><?= htmlspecialchars($term['label'] ?? '') ?>:</span>
        <?= htmlspecialchars($term['value'] ?? '') ?>
    </div>
    <?php endforeach; ?>

    <!-- FIRMAS -->
    <?php if (!isset($datos['incluir_firmas']) || $datos['incluir_firmas']): ?>
    <table class="sig-table">
        <tr>
            <td class="sig-cell">
                Autorizado por: <?= htmlspecialchars($emisor) ?>
            </td>
            <td class="sig-space"></td>
            <td class="sig-cell">
                Aceptado por: ___________________________
            </td>
        </tr>
    </table>
    <?php endif; ?>

</body>
</html>
        <?php
        $html = ob_get_clean();

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('letter', 'portrait');
        $dompdf->render();

        $fileName = $datos['numero'] . '.pdf';
        $filePath = OUTPUT_PATH . $fileName;
        file_put_contents($filePath, $dompdf->output());

        return $filePath;
    }

    /** Convierte fecha Y-m-d al formato "10 de julio de 2026" */
    private function fechaEspanol(string $fecha): string {
        $meses = [
            1  => 'enero', 2  => 'febrero', 3  => 'marzo',
            4  => 'abril', 5  => 'mayo',    6  => 'junio',
            7  => 'julio', 8  => 'agosto',  9  => 'septiembre',
            10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre',
        ];
        $ts  = strtotime($fecha);
        $d   = (int)date('j', $ts);
        $m   = (int)date('n', $ts);
        $y   = date('Y', $ts);
        return "$d de {$meses[$m]} de $y";
    }

    /** Devuelve el label en español del tipo de documento */
    private function tipoLabel(string $tipo): string {
        return [
            'cotizacion'  => 'Cotización',
            'factura'     => 'Factura',
            'presupuesto' => 'Presupuesto',
        ][$tipo] ?? ucfirst($tipo);
    }
}
