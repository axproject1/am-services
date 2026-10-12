# Servicios Morán - Sistema de Documentos Comerciales (Web App)

Sistema moderno para la creación y gestión de **Facturas**, **Cotizaciones** y **Órdenes de Trabajo**, migrado a **Next.js 14**, **TypeScript**, **Tailwind CSS** y soporte dual (**Supabase** en la nube / **LocalStorage** sin conexión).

---

## 🚀 Características Principales

- **Gestión de Documentos:** Creación, edición, duplicado y anulación de Facturas, Cotizaciones y Órdenes de Trabajo.
- **Cálculo Automático en Tiempo Real:** Subtotales, descuentos, cálculo de ITBMS (7% configurable) y montos totales.
- **Generación de PDF Idéntica al Original:** Motor `jsPDF` en el cliente con la paleta de colores oficial azul marino (#1a365d), tablas con formato profesional, numeración automática y términos de servicio.
- **Historial Completo:** Búsqueda rápida, filtros por tipo y estado, vista previa de documentos.
- **Envío por Correo Electrónico:** Envío directo mediante API de Next.js (`/api/send-email`) con Nodemailer (soporte para Gmail / SMTP).
- **Compartir por WhatsApp:** Generación instantánea de mensajes formateados con detalles del documento.
- **Base de Datos Flexible:**
  - **Supabase (PostgreSQL):** Sincronización en la nube en tiempo real.
  - **Modo Local:** Funciona inmediatamente en el navegador usando LocalStorage si aún no configuras Supabase.

---

## 🛠️ Requisitos Previos

- **Node.js** v18 o superior.
- **npm** o **yarn**.

---

## 💻 Ejecución Local

1. Instalar las dependencias (si aún no están instaladas):
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abrir en el navegador:
   ```
   http://localhost:3000
   ```

---

## 🗄️ Configuración con Supabase (Opcional pero recomendado)

1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. En el panel de Supabase, ve a **SQL Editor** y ejecuta todo el script ubicado en:
   ```
   database/supabase_schema.sql
   ```
3. Copia tus credenciales en el archivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```
4. Reinicia la aplicación (`npm run dev`). La barra de navegación mostrará automáticamente el indicador **"Supabase Conectado"**.

---

## ☁️ Despliegue en Producción

### Opción 1: Despliegue en Vercel (Recomendado)

1. Sube este repositorio a **GitHub**, **GitLab** o **Bitbucket**.
2. Entra en [Vercel](https://vercel.com) y haz clic en **"Add New... -> Project"**.
3. Importa el repositorio.
4. En la sección **Environment Variables**, añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *(Opcional)* `SMTP_EMAIL` y `SMTP_PASSWORD` si vas a usar el envío de correos.
5. Haz clic en **Deploy**. ¡Listo en menos de 2 minutos!

### Opción 2: Despliegue en Firebase Hosting (con Cloud Functions o App Hosting)

1. Instala Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Inicia sesión e inicializa el proyecto:
   ```bash
   firebase login
   firebase init apphosting
   ```
3. Sigue el asistente para enlazar tu repositorio y desplegar en Firebase App Hosting.

---

## 📁 Estructura del Proyecto

```
am-services/
├── database/
│   └── supabase_schema.sql    # Script SQL para tablas y políticas RLS
├── public/                    # Archivos estáticos
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── send-email/    # Endpoint para envío de correo
│   │   ├── configuracion/     # Configuración de empresa y términos
│   │   ├── editor/            # Editor y creador de documentos
│   │   ├── historial/         # Historial y filtros de documentos
│   │   ├── globals.css        # Estilos globales con Tailwind CSS
│   │   ├── layout.tsx         # Layout principal con Navbar persistente
│   │   └── page.tsx           # Dashboard con estadísticas
│   ├── components/
│   │   └── Navbar.tsx         # Barra de navegación interactiva
│   └── lib/
│       ├── calculations.ts    # Lógica de cálculo monetario e ITBMS
│       ├── pdfGenerator.ts    # Generador de PDF en el navegador (jsPDF)
│       ├── supabase.ts        # Cliente Supabase y capa de persistencia dual
│       └── types.ts           # Definiciones de tipos TypeScript
├── .env.example               # Plantilla de variables de entorno
├── next.config.mjs            # Configuración de Next.js
├── package.json               # Dependencias y scripts
└── tailwind.config.ts         # Configuración de colores y temas
```
