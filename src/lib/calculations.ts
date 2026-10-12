import { DocumentoItem, CategoriaItem } from './types';

export interface CalculoResultado {
  subtotal_equipos: number;
  subtotal_materiales: number;
  mano_obra_monto: number;
  subtotal_neto: number;
  itbms_monto: number;
  total_general: number;
  abono_porcentaje: number;
  abono_monto: number;
  saldo_restante: number;
  por_categoria: Record<CategoriaItem, number>;
}

export function calcularTotales(
  items: DocumentoItem[],
  incluirManoObra: boolean,
  manoObraMonto: number,
  incluirItbms: boolean,
  itbmsPorcentaje: number,
  abonoPorcentaje: number = 0,
  abonoBase: 'total' | 'mano_obra' = 'total'
): CalculoResultado {
  const porCategoria: Record<CategoriaItem, number> = {
    mano_obra: 0,
    material: 0,
    equipo: 0,
    servicio: 0,
    transporte: 0,
    otros: 0,
  };

  let subtotalNeto = 0;

  for (const item of items) {
    const cant = Number(item.cantidad) || 0;
    const pu = Number(item.precio_unitario) || 0;
    const totalItem = Math.round(cant * pu * 100) / 100;
    const cat = (item.categoria || 'material') as CategoriaItem;

    if (porCategoria[cat] !== undefined) {
      porCategoria[cat] = Math.round((porCategoria[cat] + totalItem) * 100) / 100;
    } else {
      porCategoria.otros = Math.round((porCategoria.otros + totalItem) * 100) / 100;
    }
    subtotalNeto += totalItem;
  }

  // Mano de obra manual (toggle adicional)
  const manoObraManual = incluirManoObra ? Math.max(0, Number(manoObraMonto) || 0) : 0;
  subtotalNeto = Math.round((subtotalNeto + manoObraManual) * 100) / 100;

  // ITBMS
  const itbmsPct = Number(itbmsPorcentaje) || 0;
  const itbmsMonto = incluirItbms ? Math.round(subtotalNeto * (itbmsPct / 100) * 100) / 100 : 0;
  const totalGeneral = Math.round((subtotalNeto + itbmsMonto) * 100) / 100;

  // Subtotales por categoría
  const subtotalEquipos = porCategoria.equipo || 0;
  const subtotalMateriales = porCategoria.material || 0;
  const manoObraCat = porCategoria.mano_obra || 0;
  const manoObraTotal = Math.round((manoObraCat + manoObraManual) * 100) / 100;

  // Abono y Saldo restante
  const abonoPct = Math.max(0, Math.min(100, Number(abonoPorcentaje) || 0));
  const baseCalc = abonoBase === 'mano_obra' ? manoObraTotal : totalGeneral;
  const abonoMonto = abonoPct > 0 ? Math.round(baseCalc * (abonoPct / 100) * 100) / 100 : 0;
  const saldoRestante = Math.round((totalGeneral - abonoMonto) * 100) / 100;

  return {
    subtotal_equipos: subtotalEquipos,
    subtotal_materiales: subtotalMateriales,
    mano_obra_monto: manoObraManual,
    subtotal_neto: subtotalNeto,
    itbms_monto: itbmsMonto,
    total_general: totalGeneral,
    abono_porcentaje: abonoPct,
    abono_monto: abonoMonto,
    saldo_restante: saldoRestante,
    por_categoria: porCategoria,
  };
}

export function formatoMoneda(valor: number): string {
  return (Number(valor) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
