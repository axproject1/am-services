'use client';

import React, { useState } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Documento, EmpresaConfig } from '@/lib/types';
import { DataService } from '@/lib/supabase';
import { generarPDFDocumento } from '@/lib/pdfGenerator';

interface ModalEmailProps {
  isOpen: boolean;
  onClose: () => void;
  documento: Documento | null;
  empresa: EmpresaConfig;
  onEnviadoExitoso?: () => void;
}

export function ModalEmail({ isOpen, onClose, documento, empresa, onEnviadoExitoso }: ModalEmailProps) {
  if (!isOpen || !documento) return null;

  const [destinatario, setDestinatario] = useState(documento.cliente?.email || '');
  const [asunto, setAsunto] = useState(`Envío de ${documento.tipo.toUpperCase()} - ${documento.numero}`);
  const [cuerpo, setCuerpo] = useState(
    `Estimado/a ${documento.cliente?.nombre || documento.cliente_nombre_manual || 'Cliente'},\n\n` +
    `Adjunto le enviamos el documento ${documento.tipo.toUpperCase()} N° ${documento.numero} por un total de $${(documento.total_general || 0).toFixed(2)}.\n\n` +
    `Quedamos a su disposición para cualquier consulta.\n\n` +
    `Atentamente,\n${empresa.nombre}`
  );
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinatario.trim()) {
      setMensaje({ tipo: 'error', texto: 'Por favor ingresa un correo destinatario válido.' });
      return;
    }

    setEnviando(true);
    setMensaje(null);

    try {
      // Generar PDF como Blob y Base64
      const pdfBlob = (await generarPDFDocumento(documento, empresa, 'blob')) as Blob;
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;

        // Enviar a la API route
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinatario,
            asunto,
            cuerpo,
            pdfBase64: base64data,
            filename: `${documento.numero}.pdf`,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          // Registrar en log de envíos y cambiar estado a 'enviado'
          await DataService.registrarEnvio({
            documento_id: documento.id!,
            canal: 'email',
            destinatario,
            enviado_en: new Date().toISOString(),
            exitoso: true,
          });
          await DataService.cambiarEstado(documento.id!, 'enviado');

          setMensaje({
            tipo: 'ok',
            texto: data.mensaje || `Correo enviado exitosamente a ${destinatario}`,
          });

          setTimeout(() => {
            onEnviadoExitoso?.();
            onClose();
          }, 1500);
        } else {
          setMensaje({ tipo: 'error', texto: data.error || 'No se pudo enviar el correo.' });
        }
        setEnviando(false);
      };

      reader.readAsDataURL(pdfBlob);
    } catch (err: any) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: err.message || 'Error al procesar el documento PDF.' });
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-navy px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Mail className="w-5 h-5 text-blue-300" />
            Enviar {documento.tipo.toUpperCase()} #{documento.numero} por Email
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mensaje && (
            <div
              className={`p-3 rounded-lg flex items-start gap-2.5 text-sm ${
                mensaje.tipo === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {mensaje.tipo === 'ok' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{mensaje.texto}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Correo Destinatario *
            </label>
            <input
              type="email"
              required
              placeholder="cliente@ejemplo.com"
              value={destinatario}
              onChange={e => setDestinatario(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Asunto
            </label>
            <input
              type="text"
              required
              value={asunto}
              onChange={e => setAsunto(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Mensaje del Correo
            </label>
            <textarea
              rows={5}
              value={cuerpo}
              onChange={e => setCuerpo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-moran-blue focus:border-moran-blue outline-none resize-none"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">Adjunto automático:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-700">
              {documento.numero}.pdf
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-moran-blue hover:bg-navy text-white rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Correo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
