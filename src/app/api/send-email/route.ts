import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { destinatario, asunto, cuerpo, pdfBase64, filename } = await req.json();

    if (!destinatario) {
      return NextResponse.json({ error: 'El correo destinatario es obligatorio.' }, { status: 400 });
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      // Si aún no se han configurado credenciales SMTP, retornamos un mensaje descriptivo pero simulamos el éxito para demo
      return NextResponse.json({
        ok: true,
        simulado: true,
        mensaje: 'Modo demostración: Las credenciales SMTP (SMTP_USER y SMTP_PASS) no están configuradas en .env.local todavía, pero el registro de envío se guardó correctamente.',
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const mailOptions: any = {
      from: `"Servicios Morán" <${user}>`,
      to: destinatario,
      subject: asunto || 'Envío de Documento - Servicios Morán',
      text: cuerpo || '',
      html: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #1B3A6B;">Servicios Morán</h2>
        <p>${(cuerpo || '').replace(/\n/g, '<br/>')}</p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;"/>
        <small style="color: #777;">Este correo fue generado automáticamente por el Sistema de Documentos Comerciales de Servicios Morán.</small>
      </div>`,
    };

    if (pdfBase64 && filename) {
      mailOptions.attachments = [
        {
          filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
          content: pdfBase64.split('base64,')[1] || pdfBase64,
          encoding: 'base64',
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ ok: true, mensaje: `Correo enviado exitosamente a ${destinatario}` });
  } catch (error: any) {
    console.error('Error enviando correo:', error);
    return NextResponse.json({ error: error.message || 'Error al enviar el correo.' }, { status: 500 });
  }
}
