import { TipoDocumento } from './types';

export function generarNumeroSiguiente(tipo: TipoDocumento, numerosExistentes: string[]): string {
  const prefijos: Record<TipoDocumento, string> = {
    cotizacion: 'COT',
    factura: 'FAC',
    presupuesto: 'PRE',
  };

  const prefijo = prefijos[tipo] || 'DOC';
  const anio = new Date().getFullYear();
  const patron = new RegExp(`^${prefijo}-${anio}-(\\d+)$`);

  let maxNum = 0;
  for (const num of numerosExistentes) {
    const match = num.match(patron);
    if (match) {
      const correlativo = parseInt(match[1], 10);
      if (correlativo > maxNum) {
        maxNum = correlativo;
      }
    }
  }

  const siguiente = maxNum + 1;
  return `${prefijo}-${anio}-${String(siguiente).padStart(3, '0')}`;
}
