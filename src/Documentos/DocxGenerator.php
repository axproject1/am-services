<?php
namespace App\Documentos;

use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\Style\Table;

class DocxGenerator {
    private const BRAND_BLUE   = '1B3A6B';
    private const ACCENT_BLUE  = '2E6DB4';
    private const LIGHT_BLUE   = 'EAF1FB';
    private const MID_GRAY     = 'F2F5F9';
    private const WHITE        = 'FFFFFF';
    private const BORDER_COLOR = 'D0D8E8';
    private const TEXT_DARK    = '1A1A1A';
    private const TEXT_MID     = '5A5A5A';

    public function generar(array $datos): string {
        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Calibri');
        $phpWord->setDefaultFontSize(10);

        $section = $phpWord->addSection([
            'marginTop'    => 1080,
            'marginBottom' => 1080,
            'marginLeft'   => 1080,
            'marginRight'  => 1080,
            'pageSizeW'    => 12240,
            'pageSizeH'    => 15840,
        ]);

        $empresaNombre = $datos['usar_empresa'] ? ($datos['empresa']['nombre']    ?? 'SERVICIOS MORÁN') : '';
        $empresaSub    = $datos['usar_empresa'] ? ($datos['empresa']['subtitulo'] ?? 'Servicios Múltiples') : '';
        $empresaTel    = $datos['usar_empresa'] ? ($datos['empresa']['telefono']  ?? '') : '';
        $emisor        = !empty($datos['emisor']) ? $datos['emisor'] : ($empresaNombre ?: 'Servicios Morán');
        $cliente       = !empty($datos['cliente_nombre']) ? $datos['cliente_nombre'] : 'Sin cliente';

        $tipoLabel     = $this->tipoLabel($datos['tipo']);
        $seccionTitulo = !empty($datos['seccion_titulo']) ? strtoupper($datos['seccion_titulo']) : 'DETALLE DE EQUIPOS Y MATERIALES';
        $fechaFmt      = $this->fechaEspanol($datos['fecha']);
        $validaFmt     = !empty($datos['valida_hasta']) ? $this->fechaEspanol($datos['valida_hasta']) : '—';

        $totalGeneral  = (float)($datos['total_general']    ?? 0);
        $abonoPct      = (float)($datos['abono_porcentaje'] ?? 0);
        $abonoMonto    = ($abonoPct > 0) ? round($totalGeneral * ($abonoPct / 100), 2) : 0;
        $saldoRestante = round($totalGeneral - $abonoMonto, 2);
        $subtotalManoObra = (float)($datos['mano_obra_monto']     ?? 0);
        $subtotalEquipos  = (float)($datos['subtotal_equipos']    ?? 0);
        $subtotalMat      = (float)($datos['subtotal_materiales'] ?? 0);
        $itbmsMonto       = (float)($datos['itbms_monto']         ?? 0);

        // ── HEADER ──────────────────────────────────────────────
        $header = $section->addHeader();
        $hTable = $header->addTable([
            'unit'              => 'pct',
            'width'             => 5000,
            'borderBottomSize'  => 8,
            'borderBottomColor' => self::ACCENT_BLUE,
        ]);
        $hTable->addRow();
        $cellL = $hTable->addCell(5000);
        $logo = !empty($datos['empresa']['logo_path']) ? dirname(__DIR__, 2) . '/public/' . $datos['empresa']['logo_path'] : '';
        if ($logo && file_exists($logo)) {
            $cellL->addImage($logo, ['height' => 50]);
        } else {
            if ($empresaNombre) $cellL->addText($empresaNombre, ['bold' => true, 'size' => 14, 'color' => self::BRAND_BLUE]);
            if ($empresaSub)    $cellL->addText($empresaSub,    ['size' => 8,  'color' => self::TEXT_MID]);
        }
        $cellR = $hTable->addCell(5000, ['valign' => 'bottom']);
        $cellR->addText(strtoupper($tipoLabel), ['bold' => true, 'size' => 18, 'color' => self::ACCENT_BLUE], ['alignment' => Jc::RIGHT]);
        $header->addTextBreak(1);

        // ── FOOTER ───────────────────────────────────────────────
        $footer   = $section->addFooter();
        $fTable   = $footer->addTable([
            'borderTopSize'  => 4,
            'borderTopColor' => self::ACCENT_BLUE,
            'width'          => 5000,
            'unit'           => 'pct',
        ]);
        $fTable->addRow();
        $pie = $empresaNombre ?: 'Empresa';
        $fTable->addCell(5000)->addText("$pie  •  Este documento es confidencial", ['size' => 8, 'color' => self::TEXT_MID]);
        $fTable->addCell(5000)->addPreserveText('Página {PAGE} de {NUMPAGES}', ['size' => 8, 'color' => self::TEXT_MID], ['alignment' => Jc::RIGHT]);

        // ── META-INFO 6 campos + responsable opcional ────────────
        $infoTable = $section->addTable(['unit' => 'pct', 'width' => 5000]);
        $infoData  = [
            ['label' => "No. $tipoLabel:", 'value' => $datos['numero']],
            ['label' => 'Fecha:',          'value' => $fechaFmt],
            ['label' => 'Cliente:',        'value' => $cliente],
            ['label' => 'Válida hasta:',   'value' => $validaFmt],
            ['label' => 'Emisor:',         'value' => $emisor],
            ['label' => 'Contacto:',       'value' => $empresaTel],
        ];
        if (!empty($datos['responsable'])) {
            $respVal = $datos['responsable'] . (!empty($datos['responsable_cargo']) ? ' (' . $datos['responsable_cargo'] . ')' : '');
            $infoData[] = ['label' => 'Responsable:', 'value' => $respVal];
        }

        for ($i = 0; $i < count($infoData); $i += 2) {
            $infoTable->addRow();
            $c1 = $infoTable->addCell(5000);
            $t1 = $c1->addTextRun();
            $t1->addText($infoData[$i]['label'] . ' ', ['bold' => true, 'size' => 9, 'color' => self::ACCENT_BLUE]);
            $t1->addText($infoData[$i]['value'],        ['size' => 9]);
            $c2 = $infoTable->addCell(5000);
            if (isset($infoData[$i + 1])) {
                $t2 = $c2->addTextRun();
                $t2->addText($infoData[$i + 1]['label'] . ' ', ['bold' => true, 'size' => 9, 'color' => self::ACCENT_BLUE]);
                $t2->addText($infoData[$i + 1]['value'],         ['size' => 9]);
            }
        }
        $section->addTextBreak(1, ['size' => 4]);

        // ── SECCIÓN TÍTULO ───────────────────────────────────────
        $section->addText($seccionTitulo, ['bold' => true, 'size' => 11, 'color' => self::BRAND_BLUE], [
            'borderBottomSize' => 6, 'borderBottomColor' => self::ACCENT_BLUE, 'spaceAfter' => 80
        ]);
        $section->addTextBreak(1, ['size' => 4]);

        // ── TABLA DE ÍTEMS ───────────────────────────────────────
        $phpWord->addTableStyle('ItemsTable', ['borderSize' => 4, 'borderColor' => self::BORDER_COLOR, 'cellMargin' => 80]);
        $iTable = $section->addTable('ItemsTable');
        $iTable->addRow();
        $hStyle = ['bold' => true, 'size' => 9, 'color' => self::WHITE];
        $iTable->addCell(1000, ['bgColor' => self::BRAND_BLUE])->addText('Cant.',       $hStyle, ['alignment' => Jc::CENTER]);
        $iTable->addCell(5360, ['bgColor' => self::BRAND_BLUE])->addText('Descripción', $hStyle);
        $iTable->addCell(1500, ['bgColor' => self::BRAND_BLUE])->addText('P. Unitario', $hStyle, ['alignment' => Jc::RIGHT]);
        $iTable->addCell(1500, ['bgColor' => self::BRAND_BLUE])->addText('Total',       $hStyle, ['alignment' => Jc::RIGHT]);

        foreach ($datos['items'] as $idx => $item) {
            $fill = ($idx % 2 === 0) ? self::WHITE : self::MID_GRAY;
            $iTable->addRow();
            $iTable->addCell(1000, ['bgColor' => $fill])->addText($item['cantidad'],                               ['size' => 9], ['alignment' => Jc::CENTER]);
            $iTable->addCell(5360, ['bgColor' => $fill])->addText($item['descripcion'],                            ['size' => 9]);
            $iTable->addCell(1500, ['bgColor' => $fill])->addText('$' . number_format((float)$item['precio_unitario'], 2), ['size' => 9], ['alignment' => Jc::RIGHT]);
            $iTable->addCell(1500, ['bgColor' => $fill])->addText('$' . number_format((float)$item['total'],            2), ['size' => 9], ['alignment' => Jc::RIGHT]);
        }
        $section->addTextBreak(1);

        // ── TOTALES ──────────────────────────────────────────────
        $totalsTable = $section->addTable(['alignment' => Jc::RIGHT]);

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

        $totRows = [];
        $order = ['mano_obra', 'material', 'equipo', 'servicio', 'transporte', 'otros'];
        foreach ($order as $cat) {
            if (!empty($subtotales[$cat]) && $subtotales[$cat] > 0) {
                $label = $categoryLabels[$cat] ?? 'Subtotal ' . ucfirst($cat);
                $totRows[] = ['label' => $label, 'val' => '$' . number_format($subtotales[$cat], 2), 'final' => false];
            }
        }

        // Mano de Obra manual (toggle)
        if ($datos['incluir_mano_obra'] && $subtotalManoObra > 0) {
            $totRows[] = ['label' => 'Mano de Obra (manual)', 'val' => '$' . number_format($subtotalManoObra, 2), 'final' => false];
        }

        if ($abonoMonto > 0) {
            $isManoObraBase = ($datos['abono_base'] ?? '') === 'mano_obra';
            $abonoTag       = $isManoObraBase ? 'Abono Mano de Obra' : 'Abono inicial';
            $totRows[] = ['label' => "{$abonoTag} ({$abonoPct}%)",           'val' => '$' . number_format($abonoMonto, 2),    'final' => false];
            $totRows[] = ['label' => "Saldo restante (" . (100 - $abonoPct) . "%)", 'val' => '$' . number_format($saldoRestante, 2), 'final' => false];
        }
        if ($datos['incluir_itbms'] && $itbmsMonto > 0) {
            $totRows[] = ['label' => "ITBMS ({$datos['itbms_porcentaje']}%)", 'val' => '$' . number_format($itbmsMonto, 2), 'final' => false];
        }
        $totRows[] = ['label' => 'TOTAL, GENERAL', 'val' => '$' . number_format($totalGeneral, 2), 'final' => true];

        foreach ($totRows as $idx => $row) {
            $fill  = $row['final'] ? self::BRAND_BLUE : (($idx % 2 === 0) ? self::WHITE : self::MID_GRAY);
            $color = $row['final'] ? self::WHITE : self::TEXT_DARK;
            $totalsTable->addRow();
            $totalsTable->addCell(3000, ['bgColor' => $fill])->addText($row['label'], ['bold' => $row['final'], 'size' => 9, 'color' => $color]);
            $totalsTable->addCell(2000, ['bgColor' => $fill])->addText($row['val'],   ['bold' => $row['final'], 'size' => 9, 'color' => $color], ['alignment' => Jc::RIGHT]);
        }
        $section->addTextBreak(2);

        // ── CONDICIONES / TÉRMINOS ───────────────────────────────
        $termsArr = [];
        if (!empty($datos['terminos'])) {
            $termsArr = is_string($datos['terminos']) ? json_decode($datos['terminos'], true) : $datos['terminos'];
            if (!is_array($termsArr)) $termsArr = [];
        }
        foreach ($termsArr as $term) {
            if (empty($term['value'])) continue;
            $cTable = $section->addTable(['unit' => 'pct', 'width' => 5000, 'cellMargin' => 100]);
            $cTable->addRow();
            $cCell  = $cTable->addCell(10000, ['bgColor' => self::LIGHT_BLUE]);
            $tr     = $cCell->addTextRun();
            $tr->addText(($term['label'] ?? '') . ': ', ['bold' => true, 'size' => 9, 'color' => self::ACCENT_BLUE]);
            $tr->addText($term['value'] ?? '', ['size' => 9]);
            $section->addTextBreak(1, ['size' => 4]);
        }

        // ── FIRMA ────────────────────────────────────────────────
        if (!isset($datos['incluir_firmas']) || $datos['incluir_firmas']) {
            $section->addTextBreak(3);
            $sigTable = $section->addTable(['unit' => 'pct', 'width' => 5000]);
            $sigTable->addRow();
            $emisorFirm = "Autorizado por: " . $emisor;
            $sigTable->addCell(4500)->addText($emisorFirm, ['size' => 8, 'color' => self::TEXT_MID], ['borderTopSize' => 4, 'borderTopColor' => self::BRAND_BLUE]);
            $sigTable->addCell(1000);
            $sigTable->addCell(4500)->addText('Aceptado por: ___________________________', ['size' => 8, 'color' => self::TEXT_MID], ['borderTopSize' => 4, 'borderTopColor' => self::BRAND_BLUE]);
        }

        // ── GUARDAR ──────────────────────────────────────────────
        $fileName = $datos['numero'] . '.docx';
        $filePath = OUTPUT_PATH . $fileName;
        $writer   = IOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($filePath);
        return $filePath;
    }

    private function fechaEspanol(string $fecha): string {
        $meses = [1=>'enero',2=>'febrero',3=>'marzo',4=>'abril',5=>'mayo',6=>'junio',
                  7=>'julio',8=>'agosto',9=>'septiembre',10=>'octubre',11=>'noviembre',12=>'diciembre'];
        $ts = strtotime($fecha);
        return (int)date('j', $ts) . ' de ' . $meses[(int)date('n', $ts)] . ' de ' . date('Y', $ts);
    }

    private function tipoLabel(string $tipo): string {
        return ['cotizacion'=>'Cotización','factura'=>'Factura','presupuesto'=>'Presupuesto'][$tipo] ?? ucfirst($tipo);
    }
}
