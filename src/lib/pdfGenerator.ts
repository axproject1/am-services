import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Documento, EmpresaConfig } from './types';
import { formatoMoneda } from './calculations';

// Paleta corporativa premium
const COLOR_NAVY = [27, 58, 107];       // #1B3A6B - Azul Marino Corporativo
const COLOR_BLUE_ACCENT = [37, 99, 235]; // #2563EB - Azul Eléctrico Acento
const COLOR_LIGHT_BG = [248, 250, 252];  // #F8FAFC - Fondo de tarjetas
const COLOR_BORDER = [226, 232, 240];    // #E2E8F0 - Bordes suaves
const COLOR_TEXT_MAIN = [15, 23, 42];    // #0F172A - Texto oscuro principal
const COLOR_TEXT_MUTED = [100, 116, 139];// #64748B - Texto secundario
const COLOR_SUCCESS = [16, 149, 93];     // #10955D - Verde abonos
const COLOR_AMBER = [217, 119, 6];       // #D97706 - Ámbar saldos

const CATEGORY_NAMES: Record<string, string> = {
  mano_obra: 'Mano de Obra',
  material: 'Material',
  equipo: 'Equipo',
  servicio: 'Servicio',
  transporte: 'Transporte',
  otros: 'Otros',
};

// Formato de fecha legible en español
function formatearFechaEspanol(fechaStr?: string): string {
  if (!fechaStr) return '—';
  try {
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
      ];
      const y = partes[0];
      const m = parseInt(partes[1], 10) - 1;
      const d = parseInt(partes[2], 10);
      if (meses[m]) {
        return `${d} de ${meses[m]} de ${y}`;
      }
    }
    return fechaStr;
  } catch {
    return fechaStr;
  }
}

export async function generarPDFDocumento(
  doc: Documento,
  empresa: EmpresaConfig,
  modo: 'descarga' | 'blob' = 'descarga'
): Promise<string | Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;

  // ── 1. BARRA DECORATIVA SUPERIOR ──
  // Franja azul marino en el borde absoluto superior
  pdf.setFillColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  pdf.rect(0, 0, pageWidth, 4, 'F');

  // Franja secundaria acento
  pdf.setFillColor(COLOR_BLUE_ACCENT[0], COLOR_BLUE_ACCENT[1], COLOR_BLUE_ACCENT[2]);
  pdf.rect(0, 4, pageWidth, 1, 'F');

  let y = 14;

  // ── 2. CABECERA / HEADER CORPORATIVO ──
  const empresaNombre = doc.usar_empresa ? (empresa.nombre || 'SERVICIOS MORÁN') : '';
  const empresaSub = doc.usar_empresa ? (empresa.subtitulo || 'Servicios Múltiples Residenciales y Comerciales') : '';
  const TITULOS_TIPO: Record<string, string> = {
    cotizacion: 'COTIZACIÓN',
    factura: 'FACTURA',
    presupuesto: 'PRESUPUESTO',
    lista_materiales: 'LISTA DE MATERIALES',
  };
  const tipoTitulo = TITULOS_TIPO[doc.tipo] || (doc.tipo || 'DOCUMENTO').toUpperCase();

  const tieneLogo = Boolean(
    doc.usar_empresa &&
    doc.incluir_logo !== false &&
    empresa.logo_path &&
    empresa.logo_path.length > 20
  );

  if (tieneLogo && empresa.logo_path) {
    try {
      // Si el documento incluye logo y la empresa lo tiene configurado
      pdf.addImage(empresa.logo_path, 'PNG', margin, y - 2, 48, 14, undefined, 'FAST');
    } catch {
      // Fallback a texto corporativo si hay error con el formato de imagen
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      pdf.text(empresaNombre, margin, y + 2);
    }
  } else {
    // Documento configurado sin logo (o empresa sin logo)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    pdf.text(empresaNombre, margin, y + 2);
  }

  // Tipo Documento (Derecha) - FACTURA / COTIZACIÓN / ORDEN DE TRABAJO
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(COLOR_BLUE_ACCENT[0], COLOR_BLUE_ACCENT[1], COLOR_BLUE_ACCENT[2]);
  pdf.text(tipoTitulo, pageWidth - margin, y + 2, { align: 'right' });

  y += tieneLogo ? 9 : 7;

  // Subtítulo empresa (Izquierda si no hay logo)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  if (empresaSub && !tieneLogo) {
    pdf.text(empresaSub, margin, y);
  }

  // Número de Documento (Derecha)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  pdf.text(`N° ${doc.numero}`, pageWidth - margin, y, { align: 'right' });

  y += 5.5;

  // Datos de Contacto de la Empresa (Izquierda)
  if (doc.usar_empresa) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    const partesContacto = [
      empresa.ruc_nit ? `RUC/NIT: ${empresa.ruc_nit}` : '',
      empresa.telefono ? `Tel: ${empresa.telefono}` : '',
      empresa.email ? `Email: ${empresa.email}` : '',
      empresa.direccion ? `Dir: ${empresa.direccion}` : '',
    ].filter(Boolean);

    if (partesContacto.length > 0) {
      pdf.text(partesContacto.join('   •   '), margin, y);
      y += 4.5;
    }
  }

  // Línea divisoria elegante
  y += 1.5;
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.setLineWidth(0.4);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 5.5;

  // ── 3. METADATOS: TARJETAS DINÁMICAS (CLIENTE & EMISIÓN) ──
  // Preparamos los datos de cada tarjeta
  const clienteNombre = doc.cliente?.nombre || doc.cliente_nombre_manual || 'Cliente Particular';
  const clienteLines: Array<{ label: string; value: string }> = [
    { label: 'Cliente:', value: clienteNombre },
  ];
  if (doc.cliente?.ruc_nit) {
    clienteLines.push({ label: 'RUC / Cédula:', value: doc.cliente.ruc_nit });
  }
  if (doc.cliente?.telefono) {
    clienteLines.push({ label: 'Teléfono:', value: doc.cliente.telefono });
  }
  if (doc.cliente?.direccion) {
    clienteLines.push({ label: 'Dirección:', value: doc.cliente.direccion });
  }
  if (doc.cliente?.email) {
    clienteLines.push({ label: 'Email:', value: doc.cliente.email });
  }

  const emisionLines: Array<{ label: string; value: string }> = [
    { label: 'Fecha Emisión:', value: formatearFechaEspanol(doc.fecha) },
  ];
  if (doc.valida_hasta) {
    emisionLines.push({ label: 'Válida hasta:', value: formatearFechaEspanol(doc.valida_hasta) });
  }
  if (doc.responsable) {
    const cargo = doc.responsable_cargo ? ` (${doc.responsable_cargo})` : '';
    emisionLines.push({ label: 'Responsable:', value: `${doc.responsable}${cargo}` });
  }
  if (doc.estado) {
    const estadoLabels: Record<string, string> = {
      borrador: 'Borrador',
      emitida: 'Emitida',
      aprobada: 'Aprobada',
      pagada: 'Pagada',
      anulada: 'Anulada',
    };
    emisionLines.push({ label: 'Estado:', value: estadoLabels[doc.estado] || doc.estado });
  }

  // Calculamos la altura dinámica del bloque para que no haya espacios vacíos
  const maxLines = Math.max(clienteLines.length, emisionLines.length);
  const cardLineHeight = 4.4;
  const cardPaddingTop = 8;
  const cardHeight = Math.max(22, cardPaddingTop + maxLines * cardLineHeight + 3);

  const cardGap = 4;
  const cardWidth = (pageWidth - margin * 2 - cardGap) / 2;

  // Tarjeta Izquierda: Cliente
  pdf.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'FD');

  // Tarjeta Derecha: Emisión
  const rightCardX = margin + cardWidth + cardGap;
  pdf.roundedRect(rightCardX, y, cardWidth, cardHeight, 2, 2, 'FD');

  // Encabezado Tarjeta Cliente
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(COLOR_BLUE_ACCENT[0], COLOR_BLUE_ACCENT[1], COLOR_BLUE_ACCENT[2]);
  pdf.text('DATOS DEL CLIENTE', margin + 4.5, y + 5);

  // Encabezado Tarjeta Emisión
  pdf.text('DETALLES DE EMISIÓN', rightCardX + 4.5, y + 5);

  // Contenido Tarjeta Cliente
  let curY = y + cardPaddingTop + 1;
  for (const item of clienteLines) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    pdf.text(item.label, margin + 4.5, curY);

    const lblW = pdf.getTextWidth(item.label) + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
    const maxValW = cardWidth - 9 - lblW;
    const truncatedVal = pdf.splitTextToSize(item.value, maxValW)[0] || item.value;
    pdf.text(truncatedVal, margin + 4.5 + lblW, curY);

    curY += cardLineHeight;
  }

  // Contenido Tarjeta Emisión
  curY = y + cardPaddingTop + 1;
  for (const item of emisionLines) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    pdf.text(item.label, rightCardX + 4.5, curY);

    const lblW = pdf.getTextWidth(item.label) + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
    pdf.text(item.value, rightCardX + 4.5 + lblW, curY);

    curY += cardLineHeight;
  }

  y += cardHeight + 6;

  // ── 4. TÍTULO DE SECCIÓN TABLA ──
  const seccionTitulo = (doc.seccion_titulo || 'DETALLE DE ÍTEMS Y SERVICIOS').toUpperCase();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  pdf.text(seccionTitulo, margin, y);

  // Pequeña línea decorativa bajo el título de sección
  const titleW = pdf.getTextWidth(seccionTitulo);
  pdf.setDrawColor(COLOR_BLUE_ACCENT[0], COLOR_BLUE_ACCENT[1], COLOR_BLUE_ACCENT[2]);
  pdf.setLineWidth(0.6);
  pdf.line(margin, y + 1.2, margin + titleW, y + 1.2);

  y += 4;

  // ── 5. TABLA DE ÍTEMS (AUTOTABLE) ──
  const tableHead = [['Cant.', 'Categoría', 'Descripción del Ítem / Servicio', 'P. Unitario', 'Total']];
  const items = doc.items || [];
  const tableBody = items.map(item => [
    item.cantidad.toString(),
    CATEGORY_NAMES[item.categoria] || item.categoria || 'Servicio',
    item.descripcion,
    `$${formatoMoneda(item.precio_unitario)}`,
    `$${formatoMoneda(item.total)}`,
  ]);

  autoTable(pdf, {
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: [COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 8.2,
      textColor: [COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]],
      cellPadding: { top: 3.2, bottom: 3.2, left: 3, right: 3 },
    },
    alternateRowStyles: {
      fillColor: [COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 26 },
      2: { halign: 'left' },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
    tableLineColor: [COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]],
    tableLineWidth: 0.2,
    margin: { left: margin, right: margin },
  });

  // Posición después de la tabla
  y = (pdf as any).lastAutoTable.finalY + 6;

  // ── 6. TOTALES & TÉRMINOS CON AJUSTE DINÁMICO PERFECTO ──
  const boxWidth = 74;
  const totalsX = pageWidth - margin - boxWidth;

  // Preparamos las líneas que se van a renderizar en la caja de totales
  interface TotalRow {
    label: string;
    amount: number;
    isBold?: boolean;
    color?: number[];
  }

  const preTotalRows: TotalRow[] = [
    { label: 'Subtotal Neto:', amount: doc.subtotal_neto },
  ];

  if (doc.incluir_mano_obra && doc.mano_obra_monto > 0) {
    preTotalRows.push({ label: 'Mano de Obra:', amount: doc.mano_obra_monto });
  }

  if (doc.incluir_itbms) {
    preTotalRows.push({
      label: `ITBMS (${doc.itbms_porcentaje}%):`,
      amount: doc.itbms_monto,
    });
  }

  const postTotalRows: TotalRow[] = [];
  if (doc.abono_porcentaje > 0 && doc.abono_monto) {
    const tag = doc.abono_base === 'mano_obra' ? 'M. Obra' : 'Inicial';
    postTotalRows.push({
      label: `Abono ${tag} (${doc.abono_porcentaje}%):`,
      amount: doc.abono_monto,
      color: COLOR_SUCCESS,
      isBold: true,
    });
    postTotalRows.push({
      label: 'Saldo Restante:',
      amount: doc.saldo_restante || 0,
      color: COLOR_AMBER,
      isBold: true,
    });
  }

  // Calculamos la altura EXACTA requerida para la tarjeta de totales (sin espacio sobrante)
  const lineH = 4.6;
  const barH = 7.5;
  const topPad = 4;
  const botPad = 4;
  const exactTotalsCardHeight =
    topPad +
    preTotalRows.length * lineH +
    1 +
    barH +
    (postTotalRows.length > 0 ? 2 + postTotalRows.length * lineH : 0) +
    botPad;

  // Dibujamos la tarjeta de totales ajustada con precisión milimétrica
  pdf.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(totalsX, y, boxWidth, exactTotalsCardHeight, 2, 2, 'FD');

  let curTotY = y + topPad + 3;

  // Imprimir líneas de subtotal
  for (const row of preTotalRows) {
    pdf.setFont('helvetica', row.isBold ? 'bold' : 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
    pdf.text(row.label, totalsX + 4.5, curTotY);
    pdf.text(`$${formatoMoneda(row.amount)}`, pageWidth - margin - 4.5, curTotY, { align: 'right' });
    curTotY += lineH;
  }

  curTotY += 0.5;

  // Barra de TOTAL GENERAL destacada
  pdf.setFillColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  pdf.rect(totalsX, curTotY - 1, boxWidth, barH, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('TOTAL GENERAL:', totalsX + 4.5, curTotY + 4);
  pdf.text(`$${formatoMoneda(doc.total_general)}`, pageWidth - margin - 4.5, curTotY + 4, { align: 'right' });

  curTotY += barH + 2.5;

  // Imprimir abonos o saldos si existen
  for (const row of postTotalRows) {
    pdf.setFont('helvetica', row.isBold ? 'bold' : 'normal');
    pdf.setFontSize(8);
    if (row.color) {
      pdf.setTextColor(row.color[0], row.color[1], row.color[2]);
    } else {
      pdf.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
    }
    pdf.text(row.label, totalsX + 4.5, curTotY);
    pdf.text(`$${formatoMoneda(row.amount)}`, pageWidth - margin - 4.5, curTotY, { align: 'right' });
    curTotY += lineH;
  }

  // ── 7. CONDICIONES Y TÉRMINOS (IZQUIERDA) ──
  const termsWidth = totalsX - margin - 8;
  let termY = y;

  if (doc.terminos && doc.terminos.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    pdf.text('CONDICIONES Y TÉRMINOS:', margin, termY + 3);

    termY += 7.5;

    for (const term of doc.terminos) {
      if (!term.label && !term.value) continue;

      // Bullet azul
      pdf.setFillColor(COLOR_BLUE_ACCENT[0], COLOR_BLUE_ACCENT[1], COLOR_BLUE_ACCENT[2]);
      pdf.circle(margin + 1.2, termY - 0.9, 0.8, 'F');

      // Título del término
      const labelText = `${term.label}:`;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      pdf.text(labelText, margin + 4, termY);

      // Valor con espacio limpio
      const labelW = pdf.getTextWidth(labelText) + 2;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);

      const splitText = pdf.splitTextToSize(term.value, termsWidth - labelW - 4);
      pdf.text(splitText, margin + 4 + labelW, termY);

      termY += Math.max(splitText.length * 3.6, 4.4) + 1.2;
    }
  }

  // Si hay notas u observaciones adicionales
  if (doc.observaciones) {
    termY += 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    pdf.text('Notas adicionales:', margin, termY);
    termY += 3.5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(COLOR_TEXT_MAIN[0], COLOR_TEXT_MAIN[1], COLOR_TEXT_MAIN[2]);
    const splitNotes = pdf.splitTextToSize(doc.observaciones, termsWidth);
    pdf.text(splitNotes, margin, termY);
    termY += splitNotes.length * 3.2;
  }

  // ── 8. SECCIÓN DE FIRMAS ──
  const finalContentY = Math.max(y + exactTotalsCardHeight, termY) + 6;

  // Calculamos posición de firmas
  let firmaY = finalContentY + 14;
  // Si se pasa de la página, la aseguramos con margen al pie
  if (firmaY > pageHeight - 32) {
    firmaY = pageHeight - 30;
  }

  if (doc.incluir_firmas) {
    const firmaWidth = 62;

    // Firma Emisor
    const firmaEmisorX = margin + 8;
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.setLineWidth(0.5);
    pdf.line(firmaEmisorX, firmaY, firmaEmisorX + firmaWidth, firmaY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
    pdf.text('Firma Emisor / Responsable', firmaEmisorX + firmaWidth / 2, firmaY + 3.8, { align: 'center' });

    // Firma Cliente
    const firmaClienteX = pageWidth - margin - 8 - firmaWidth;
    pdf.line(firmaClienteX, firmaY, firmaClienteX + firmaWidth, firmaY);
    pdf.text('Firma de Aceptación Cliente', firmaClienteX + firmaWidth / 2, firmaY + 3.8, { align: 'center' });
  }

  // ── 9. PIE DE PÁGINA (FOOTER) ──
  const footerY = pageHeight - 8;
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY - 2.5, pageWidth - margin, footerY - 2.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(COLOR_TEXT_MUTED[0], COLOR_TEXT_MUTED[1], COLOR_TEXT_MUTED[2]);
  pdf.text(
    `${empresaNombre || 'SERVICIOS MORÁN'}   •   Documento Comercial emitido digitalmente`,
    margin,
    footerY + 1.5
  );
  pdf.text('Página 1 de 1', pageWidth - margin, footerY + 1.5, { align: 'right' });

  // ── 10. RETORNO O DESCARGA ──
  if (modo === 'blob') {
    return pdf.output('blob');
  }

  pdf.save(`${doc.numero}.pdf`);
  return `${doc.numero}.pdf`;
}
