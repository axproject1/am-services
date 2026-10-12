'use client';

import React, { useEffect, useState } from 'react';
import { Eye, Download, X, Loader2, FileDown } from 'lucide-react';
import { Documento, EmpresaConfig } from '@/lib/types';
import { generarPDFDocumento } from '@/lib/pdfGenerator';
import { generarDOCXDocumento } from '@/lib/docxGenerator';

interface ModalPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  documento: Documento | null;
  empresa: EmpresaConfig;
}

export function ModalPreview({ isOpen, onClose, documento, empresa }: ModalPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    if (isOpen && documento) {
      setCargando(true);
      generarPDFDocumento(documento, empresa, 'blob')
        .then(blob => {
          url = URL.createObjectURL(blob as Blob);
          setPdfUrl(url);
          setCargando(false);
        })
        .catch(err => {
          console.error('Error generando preview PDF:', err);
          setCargando(false);
        });
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [isOpen, documento, empresa]);

  if (!isOpen || !documento) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Cabecera modal */}
        <div className="bg-navy px-6 py-3.5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <Eye className="w-5 h-5 text-amber-400" />
            <span>Vista Previa: {documento.tipo.toUpperCase()} #{documento.numero}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generarPDFDocumento(documento, empresa, 'descarga')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar PDF
            </button>
            <button
              onClick={() => generarDOCXDocumento(documento, empresa)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-moran-blue hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              Descargar Word
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visor PDF iframe */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-2 overflow-hidden">
          {cargando ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-moran-blue" />
              <span className="text-sm">Generando vista previa del documento...</span>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={`Vista previa ${documento.numero}`}
              className="w-full h-full rounded border border-slate-300 bg-white shadow-inner"
            />
          ) : (
            <div className="text-sm text-slate-500">No se pudo cargar la vista previa.</div>
          )}
        </div>
      </div>
    </div>
  );
}
