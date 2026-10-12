import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Servicios Morán - Sistema de Documentos Comerciales',
  description:
    'Sistema de gestión de cotizaciones, facturas y presupuestos para Servicios Morán. Genera PDFs y DOCX profesionales, envía por email y WhatsApp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
