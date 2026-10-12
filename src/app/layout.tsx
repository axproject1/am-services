import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Servicios Morán - Sistema de Documentos Comerciales',
  description:
    'Sistema de gestión de cotizaciones, facturas y presupuestos para Servicios Morán. Genera PDFs y DOCX profesionales, envía por email y WhatsApp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
