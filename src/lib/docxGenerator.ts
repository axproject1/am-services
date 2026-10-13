import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeightRule,
} from 'docx';
import { saveAs } from 'file-saver';
import { Documento, EmpresaConfig } from './types';
import { formatoMoneda } from './calculations';

const BRAND_BLUE = '1B3A6B';       // #1B3A6B Azul marino corporativo
const ACCENT_BLUE = '2E6DB4';      // #2E6DB4 Azul acento
const LIGHT_BG = 'F8FAFC';         // #F8FAFC Fondo tarjetas
const BORDER_COLOR = 'E2E8F0';     // #E2E8F0 Bordes suaves
const TEXT_DARK = '0F172A';        // #0F172A Texto oscuro principal
const TEXT_MUTED = '64748B';       // #64748B Texto secundario
const GREEN_SUCCESS = '10955D';    // #10955D Verde abonos
const AMBER_COLOR = 'D97706';      // #D97706 Ámbar saldos

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const TABLE_NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

const CATEGORY_NAMES: Record<string, string> = {
  mano_obra: 'Mano de Obra',
  material: 'Material',
  equipo: 'Equipo',
  servicio: 'Servicio',
  transporte: 'Transporte',
  otros: 'Otros',
};

// Formato de fecha legible en español
function formatearFecha(fechaStr?: string): string {
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

function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const pure = base64.includes(',') ? base64.split(',')[1] : base64;
    const binary = atob(pure);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return new Uint8Array(0);
  }
}

export async function generarDOCXDocumento(doc: Documento, empresa: EmpresaConfig): Promise<void> {
  const empresaNombre = doc.usar_empresa ? (empresa.nombre || 'SERVICIOS MORÁN') : '';
  const empresaSub = doc.usar_empresa ? (empresa.subtitulo || 'Servicios Múltiples Residenciales y Comerciales') : '';
  const TITULOS_TIPO: Record<string, string> = {
    cotizacion: 'COTIZACIÓN',
    factura: 'FACTURA',
    presupuesto: 'PRESUPUESTO',
    lista_materiales: 'LISTA DE MATERIALES',
  };
  const tipoTitulo = TITULOS_TIPO[doc.tipo] || (doc.tipo || 'DOCUMENTO').toUpperCase();
  const clienteNombre = doc.cliente?.nombre || doc.cliente_nombre_manual || 'Cliente Particular';

  const tieneLogo = Boolean(
    doc.usar_empresa &&
    doc.incluir_logo !== false &&
    empresa.logo_path &&
    empresa.logo_path.length > 20
  );

  let logoImageRun: ImageRun | null = null;
  if (tieneLogo && empresa.logo_path) {
    try {
      logoImageRun = new ImageRun({
        data: empresa.logo_path,
        transformation: {
          width: 170,
          height: 50,
        },
        type: 'png',
      });
    } catch {
      logoImageRun = null;
    }
  }

  const docx = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        children: [
          // ── 1. CABECERA SIN BORDES NEGROS ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_NO_BORDERS,
            rows: [
              new TableRow({
                children: [
                  // Columna Izquierda: Empresa
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    borders: {
                      ...TABLE_NO_BORDERS,
                      bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT_BLUE },
                    },
                    margins: { bottom: 120 },
                    children: [
                      ...(logoImageRun
                        ? [new Paragraph({ children: [logoImageRun] })]
                        : [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: empresaNombre,
                                  bold: true,
                                  size: 32,
                                  color: BRAND_BLUE,
                                }),
                              ],
                            }),
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: empresaSub,
                                  size: 18,
                                  color: TEXT_MUTED,
                                }),
                              ],
                            }),
                          ]),
                      new Paragraph({
                        spacing: { before: 60 },
                        children: [
                          new TextRun({
                            text: [
                              empresa.ruc_nit ? `RUC: ${empresa.ruc_nit}` : '',
                              empresa.telefono ? `Tel: ${empresa.telefono}` : '',
                              empresa.email ? `Email: ${empresa.email}` : '',
                            ].filter(Boolean).join('   •   '),
                            size: 15,
                            color: TEXT_MUTED,
                          }),
                        ],
                      }),
                    ],
                  }),
                  // Columna Derecha: Tipo y Número
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: {
                      ...TABLE_NO_BORDERS,
                      bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT_BLUE },
                    },
                    margins: { bottom: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: tipoTitulo,
                            bold: true,
                            size: 36,
                            color: ACCENT_BLUE,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 40 },
                        children: [
                          new TextRun({
                            text: `N° ${doc.numero}`,
                            bold: true,
                            size: 22,
                            color: BRAND_BLUE,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Espaciador
          new Paragraph({ text: '', spacing: { before: 200 } }),

          // ── 2. DATOS DEL CLIENTE Y DETALLES DE EMISIÓN (TARJETAS GEMELAS) ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              insideHorizontal: NO_BORDER,
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
            },
            rows: [
              new TableRow({
                children: [
                  // Columna Izquierda: Cliente u Obra
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    shading: { fill: LIGHT_BG },
                    margins: { top: 140, bottom: 140, left: 160, right: 160 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: doc.tipo === 'lista_materiales' ? 'DATOS DE LA OBRA / PROYECTO' : 'DATOS DEL CLIENTE',
                            bold: true,
                            color: ACCENT_BLUE,
                            size: 17,
                          }),
                        ],
                      }),
                      ...(doc.tipo === 'lista_materiales'
                        ? [
                            new Paragraph({
                              spacing: { before: 80 },
                              children: [
                                new TextRun({ text: 'Proyecto / Obra: ', bold: true, color: TEXT_MUTED, size: 17 }),
                                new TextRun({ text: doc.proyecto_obra || clienteNombre, bold: true, color: TEXT_DARK, size: 18 }),
                              ],
                            }),
                            ...(doc.solicitado_por || doc.responsable
                              ? [
                                  new Paragraph({
                                    spacing: { before: 40 },
                                    children: [
                                      new TextRun({ text: 'Solicitado por: ', bold: true, color: TEXT_MUTED, size: 16 }),
                                      new TextRun({ text: doc.solicitado_por || doc.responsable || '', color: TEXT_DARK, size: 16 }),
                                    ],
                                  }),
                                ]
                              : []),
                            ...(doc.lugar_entrega || doc.cliente?.direccion
                              ? [
                                  new Paragraph({
                                    spacing: { before: 40 },
                                    children: [
                                      new TextRun({ text: 'Lugar de Entrega: ', bold: true, color: TEXT_MUTED, size: 16 }),
                                      new TextRun({ text: doc.lugar_entrega || doc.cliente?.direccion || 'En sitio', color: TEXT_DARK, size: 16 }),
                                    ],
                                  }),
                                ]
                              : []),
                            ...(doc.cliente?.nombre && doc.cliente.nombre !== doc.proyecto_obra
                              ? [
                                  new Paragraph({
                                    spacing: { before: 40 },
                                    children: [
                                      new TextRun({ text: 'Cliente Asociado: ', bold: true, color: TEXT_MUTED, size: 16 }),
                                      new TextRun({ text: doc.cliente.nombre, color: TEXT_DARK, size: 16 }),
                                    ],
                                  }),
                                ]
                              : []),
                          ]
                        : [
                            new Paragraph({
                              spacing: { before: 80 },
                              children: [
                                new TextRun({ text: 'Cliente: ', bold: true, color: TEXT_MUTED, size: 17 }),
                                new TextRun({ text: clienteNombre, bold: true, color: TEXT_DARK, size: 18 }),
                              ],
                            }),
                            ...(doc.cliente?.ruc_nit
                              ? [
                                  new Paragraph({
                                    spacing: { before: 40 },
                                    children: [
                                      new TextRun({ text: 'RUC / Cédula: ', bold: true, color: TEXT_MUTED, size: 16 }),
                                      new TextRun({ text: doc.cliente.ruc_nit, color: TEXT_DARK, size: 16 }),
                                    ],
                                  }),
                                ]
                              : []),
                            ...(doc.cliente?.telefono
                              ? [
                                  new Paragraph({
                                    spacing: { before: 40 },
                                    children: [
                                      new TextRun({ text: 'Teléfono: ', bold: true, color: TEXT_MUTED, size: 16 }),
                                      new TextRun({ text: doc.cliente.telefono, color: TEXT_DARK, size: 16 }),
                                    ],
                                  }),
                                ]
                              : []),
                            ...(doc.cliente?.direccion
                              ? [
                                  new Paragraph({
                                    spacing: { before: 40 },
                                    children: [
                                      new TextRun({ text: 'Dirección: ', bold: true, color: TEXT_MUTED, size: 16 }),
                                      new TextRun({ text: doc.cliente.direccion, color: TEXT_DARK, size: 16 }),
                                    ],
                                  }),
                                ]
                              : []),
                          ]),
                    ],
                  }),
                  // Columna Derecha: Emisión
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    shading: { fill: LIGHT_BG },
                    margins: { top: 140, bottom: 140, left: 160, right: 160 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'DETALLES DE EMISIÓN',
                            bold: true,
                            color: ACCENT_BLUE,
                            size: 17,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 80 },
                        children: [
                          new TextRun({ text: 'Fecha Emisión: ', bold: true, color: TEXT_MUTED, size: 16 }),
                          new TextRun({ text: formatearFecha(doc.fecha), color: TEXT_DARK, size: 16 }),
                        ],
                      }),
                      ...(doc.valida_hasta
                        ? [
                            new Paragraph({
                              spacing: { before: 40 },
                              children: [
                                new TextRun({
                                  text: doc.tipo === 'lista_materiales' ? 'Requerido para: ' : 'Válida hasta: ',
                                  bold: true,
                                  color: ACCENT_BLUE,
                                  size: 16,
                                }),
                                new TextRun({ text: formatearFecha(doc.valida_hasta), bold: true, color: TEXT_DARK, size: 16 }),
                              ],
                            }),
                          ]
                        : []),
                      ...(doc.emisor
                        ? [
                            new Paragraph({
                              spacing: { before: 40 },
                              children: [
                                new TextRun({
                                  text: doc.tipo === 'lista_materiales' ? 'Comprador: ' : 'Emisor: ',
                                  bold: true,
                                  color: TEXT_MUTED,
                                  size: 16,
                                }),
                                new TextRun({ text: doc.emisor, color: TEXT_DARK, size: 16 }),
                              ],
                            }),
                          ]
                        : doc.responsable
                        ? [
                            new Paragraph({
                              spacing: { before: 40 },
                              children: [
                                new TextRun({ text: 'Responsable: ', bold: true, color: TEXT_MUTED, size: 16 }),
                                new TextRun({
                                  text: `${doc.responsable}${doc.responsable_cargo ? ` (${doc.responsable_cargo})` : ''}`,
                                  color: TEXT_DARK,
                                  size: 16,
                                }),
                              ],
                            }),
                          ]
                        : []),
                      ...(doc.estado
                        ? [
                            new Paragraph({
                              spacing: { before: 40 },
                              children: [
                                new TextRun({ text: 'Estado: ', bold: true, color: TEXT_MUTED, size: 16 }),
                                new TextRun({ text: doc.estado.toUpperCase(), bold: true, color: ACCENT_BLUE, size: 15 }),
                              ],
                            }),
                          ]
                        : []),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Espaciador
          new Paragraph({ text: '', spacing: { before: 240 } }),

          // Título de Sección
          new Paragraph({
            children: [
              new TextRun({
                text: (doc.seccion_titulo || (doc.tipo === 'lista_materiales' ? 'LISTA DE MATERIALES E INSUMOS' : 'DETALLE DE ÍTEMS Y SERVICIOS')).toUpperCase(),
                bold: true,
                color: BRAND_BLUE,
                size: 18,
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 100 } }),

          // ── 3. TABLA DE ÍTEMS (ESTILO PROFESIONAL) ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: BRAND_BLUE },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
              left: NO_BORDER,
              right: NO_BORDER,
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              insideVertical: NO_BORDER,
            },
            rows: [
              // Encabezado
              new TableRow({
                tableHeader: true,
                children: doc.tipo === 'lista_materiales'
                  ? [
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cant.', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 12, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Udm', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 52, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ children: [new TextRun({ text: 'Descripción del Material / Insumo', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 13, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'P. Unit', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 13, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Total', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                    ]
                  : [
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cant.', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ children: [new TextRun({ text: 'Categoría', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 44, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ children: [new TextRun({ text: 'Descripción del Ítem / Servicio', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 13, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'P. Unit', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                      new TableCell({
                        shading: { fill: BRAND_BLUE },
                        width: { size: 13, type: WidthType.PERCENTAGE },
                        margins: { top: 120, bottom: 120, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Total', bold: true, color: 'FFFFFF', size: 16 })] })],
                      }),
                    ],
              }),
              // Filas de Items
              ...(doc.items || []).map((it, idx) =>
                new TableRow({
                  children: doc.tipo === 'lista_materiales'
                    ? [
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(it.cantidad), size: 16 })] })],
                        }),
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: it.unidad_medida || 'und', size: 16, color: TEXT_MUTED })] })],
                        }),
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ children: [new TextRun({ text: it.descripcion, size: 16, color: TEXT_DARK })] })],
                        }),
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(it.precio_unitario)}`, size: 16 })] })],
                        }),
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(it.total)}`, bold: true, size: 16, color: TEXT_DARK })] })],
                        }),
                      ]
                    : [
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(it.cantidad), size: 16 })] })],
                        }),
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ children: [new TextRun({ text: CATEGORY_NAMES[it.categoria] || it.categoria, size: 16, color: TEXT_MUTED })] })],
                        }),
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ children: [new TextRun({ text: it.descripcion, size: 16, color: TEXT_DARK })] })],
                        }),
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(it.precio_unitario)}`, size: 16 })] })],
                        }),
                        new TableCell({
                          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : LIGHT_BG },
                          margins: { top: 100, bottom: 100, left: 100, right: 100 },
                          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(it.total)}`, bold: true, size: 16, color: TEXT_DARK })] })],
                        }),
                      ],
                })
              ),
            ],
          }),

          // Espaciador
          new Paragraph({ text: '', spacing: { before: 240 } }),

          // ── 4. CONDICIONES (IZQUIERDA) Y RESUMEN DE TOTALES (DERECHA) ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_NO_BORDERS,
            rows: [
              new TableRow({
                children: [
                  // Columna Izquierda: Condiciones y Términos / Notas
                  new TableCell({
                    width: { size: 52, type: WidthType.PERCENTAGE },
                    borders: TABLE_NO_BORDERS,
                    margins: { right: 140 },
                    children: [
                      ...(doc.terminos && doc.terminos.length > 0
                        ? [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: doc.tipo === 'lista_materiales' ? 'OBSERVACIONES Y NOTAS DE COMPRA:' : 'CONDICIONES Y TÉRMINOS:',
                                  bold: true,
                                  color: BRAND_BLUE,
                                  size: 17,
                                }),
                              ],
                            }),
                            ...doc.terminos.map(
                              term =>
                                new Paragraph({
                                  spacing: { before: 60 },
                                  children: [
                                    new TextRun({ text: `• ${term.label}: `, bold: true, color: ACCENT_BLUE, size: 16 }),
                                    new TextRun({ text: term.value, size: 16, color: TEXT_DARK }),
                                  ],
                                })
                            ),
                          ]
                        : []),
                      ...(doc.observaciones
                        ? [
                            new Paragraph({
                              spacing: { before: 100 },
                              children: [
                                new TextRun({ text: 'Notas adicionales:', bold: true, color: TEXT_MUTED, size: 15 }),
                              ],
                            }),
                            new Paragraph({
                              spacing: { before: 40 },
                              children: [
                                new TextRun({ text: doc.observaciones, size: 15, color: TEXT_DARK }),
                              ],
                            }),
                          ]
                        : []),
                    ],
                  }),

                  // Columna Derecha: Tarjeta de Totales estructurada en tabla
                  new TableCell({
                    width: { size: 48, type: WidthType.PERCENTAGE },
                    borders: TABLE_NO_BORDERS,
                    children: [
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
                          bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
                          left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
                          right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
                          insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: BORDER_COLOR },
                          insideVertical: NO_BORDER,
                        },
                        rows: [
                          // Subtotal Neto
                          new TableRow({
                            children: [
                              new TableCell({
                                shading: { fill: LIGHT_BG },
                                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                children: [new Paragraph({ children: [new TextRun({ text: doc.tipo === 'lista_materiales' ? 'Subtotal Materiales:' : 'Subtotal Neto:', size: 16, color: TEXT_DARK })] })],
                              }),
                              new TableCell({
                                shading: { fill: LIGHT_BG },
                                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(doc.subtotal_neto)}`, size: 16, color: TEXT_DARK })] })],
                              }),
                            ],
                          }),
                          // Mano de Obra (si aplica y no es lista de materiales)
                          ...(doc.tipo !== 'lista_materiales' && doc.incluir_mano_obra && doc.mano_obra_monto > 0
                            ? [
                                new TableRow({
                                  children: [
                                    new TableCell({
                                      shading: { fill: LIGHT_BG },
                                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                      children: [new Paragraph({ children: [new TextRun({ text: 'Mano de Obra:', size: 16, color: TEXT_DARK })] })],
                                    }),
                                    new TableCell({
                                      shading: { fill: LIGHT_BG },
                                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(doc.mano_obra_monto)}`, size: 16, color: TEXT_DARK })] })],
                                    }),
                                  ],
                                }),
                              ]
                            : []),
                          // ITBMS (si aplica)
                          ...(doc.incluir_itbms
                            ? [
                                new TableRow({
                                  children: [
                                    new TableCell({
                                      shading: { fill: LIGHT_BG },
                                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                      children: [new Paragraph({ children: [new TextRun({ text: `ITBMS (${doc.itbms_porcentaje}%):`, size: 16, color: TEXT_DARK })] })],
                                    }),
                                    new TableCell({
                                      shading: { fill: LIGHT_BG },
                                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(doc.itbms_monto)}`, size: 16, color: TEXT_DARK })] })],
                                    }),
                                  ],
                                }),
                              ]
                            : []),
                          // TOTAL GENERAL / MATERIALES (Barra Azul Destacada)
                          new TableRow({
                            children: [
                              new TableCell({
                                shading: { fill: BRAND_BLUE },
                                margins: { top: 120, bottom: 120, left: 100, right: 100 },
                                children: [new Paragraph({ children: [new TextRun({ text: doc.tipo === 'lista_materiales' ? 'TOTAL MATERIALES:' : 'TOTAL GENERAL:', bold: true, color: 'FFFFFF', size: 18 })] })],
                              }),
                              new TableCell({
                                shading: { fill: BRAND_BLUE },
                                margins: { top: 120, bottom: 120, left: 100, right: 100 },
                                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(doc.total_general)}`, bold: true, color: 'FFFFFF', size: 18 })] })],
                              }),
                            ],
                          }),
                          // Abono Inicial (solo si aplica y no es lista de materiales)
                          ...(doc.tipo !== 'lista_materiales' && doc.abono_porcentaje > 0 && doc.abono_monto
                            ? [
                                new TableRow({
                                  children: [
                                    new TableCell({
                                      shading: { fill: LIGHT_BG },
                                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                      children: [new Paragraph({ children: [new TextRun({ text: `Abono (${doc.abono_porcentaje}%):`, bold: true, color: GREEN_SUCCESS, size: 15 })] })],
                                    }),
                                    new TableCell({
                                      shading: { fill: LIGHT_BG },
                                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(doc.abono_monto)}`, bold: true, color: GREEN_SUCCESS, size: 15 })] })],
                                    }),
                                  ],
                                }),
                                new TableRow({
                                  children: [
                                    new TableCell({
                                      shading: { fill: LIGHT_BG },
                                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                      children: [new Paragraph({ children: [new TextRun({ text: 'Saldo Restante:', bold: true, color: AMBER_COLOR, size: 15 })] })],
                                    }),
                                    new TableCell({
                                      shading: { fill: LIGHT_BG },
                                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${formatoMoneda(doc.saldo_restante || 0)}`, bold: true, color: AMBER_COLOR, size: 15 })] })],
                                    }),
                                  ],
                                }),
                              ]
                            : []),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Espaciador para firmas
          new Paragraph({ text: '', spacing: { before: 500 } }),

          // ── 5. FIRMAS LIMPIAS (SIN RECUADROS NEGROS) ──
          ...(doc.incluir_firmas
            ? [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: TABLE_NO_BORDERS,
                  rows: [
                    new TableRow({
                      children: [
                        // Firma Emisor
                        new TableCell({
                          width: { size: 42, type: WidthType.PERCENTAGE },
                          borders: {
                            ...TABLE_NO_BORDERS,
                            top: { style: BorderStyle.SINGLE, size: 8, color: '94A3B8' },
                          },
                          margins: { top: 80 },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text: 'Firma Emisor / Responsable', size: 16, color: TEXT_MUTED })],
                            }),
                          ],
                        }),
                        // Espacio central
                        new TableCell({
                          width: { size: 16, type: WidthType.PERCENTAGE },
                          borders: TABLE_NO_BORDERS,
                          children: [new Paragraph({ text: '' })],
                        }),
                        // Firma Cliente
                        new TableCell({
                          width: { size: 42, type: WidthType.PERCENTAGE },
                          borders: {
                            ...TABLE_NO_BORDERS,
                            top: { style: BorderStyle.SINGLE, size: 8, color: '94A3B8' },
                          },
                          margins: { top: 80 },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text: 'Firma de Aceptación Cliente', size: 16, color: TEXT_MUTED })],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ]
            : []),

          // Espacio antes del footer
          new Paragraph({ text: '', spacing: { before: 400 } }),

          // ── 6. PIE DE PÁGINA CORPORATIVO ──
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${empresaNombre || 'SERVICIOS MORÁN'}   •   Documento Comercial emitido digitalmente`,
                size: 14,
                color: '94A3B8',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(docx);
  saveAs(blob, `${doc.numero}.docx`);
}
