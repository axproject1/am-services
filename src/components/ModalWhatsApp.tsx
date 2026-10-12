'use client';

import React, { useState } from 'react';
import { MessageSquare, ExternalLink, X } from 'lucide-react';
import { Documento, EmpresaConfig } from '@/lib/types';
import { DataService } from '@/lib/supabase';

interface ModalWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  documento: Documento | null;
  empresa: EmpresaConfig;
  onEnviadoExitoso?: () => void;
}

export function ModalWhatsApp({ isOpen, onClose, documento, empresa, onEnviadoExitoso }: ModalWhatsAppProps) {
  if (!isOpen || !documento) return null;

  const [telefono, setTelefono] = useState(documento.cliente?.telefono || '');
  const [mensaje, setMensaje] = useState(
    `Hola ${documento.cliente?.nombre || documento.cliente_nombre_manual || ''},\n\n` +
    `Le compartimos la *${documento.tipo.toUpperCase()} N° ${documento.numero}* por un monto total de *$${(documento.total_general || 0).toFixed(2)}* emitida por *${empresa.nombre}*.\n\n` +
    `Quedamos a su entera disposición ante cualquier duda o consulta.\n\n` +
    `¡Saludos cordiales!`
  );

  const handleCompartir = async (e: React.FormEvent) => {
    e.preventDefault();
    const soloNumeros = telefono.replace(/\D/g, '');
    if (!soloNumeros) {
      alert('Por favor introduce un número de teléfono con código de país (ej. 50760000000)');
      return;
    }

    // Registrar en log de envíos y actualizar estado a 'enviado'
    await DataService.registrarEnvio({
      documento_id: documento.id!,
      canal: 'whatsapp',
      destinatario: soloNumeros,
      enviado_en: new Date().toISOString(),
      exitoso: true,
    });
    await DataService.cambiarEstado(documento.id!, 'enviado');

    const url = `https://wa.me/${soloNumeros}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    onEnviadoExitoso?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-emerald-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <MessageSquare className="w-5 h-5 text-emerald-200" />
            Compartir {documento.tipo.toUpperCase()} #{documento.numero} por WhatsApp
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCompartir} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Número de WhatsApp (con código de país) *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. 50761234567"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Para Panamá inicia con 507 seguido de los 8 dígitos del celular.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Mensaje Pre-redactado
            </label>
            <textarea
              rows={6}
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none resize-none font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir en WhatsApp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
