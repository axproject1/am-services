<?php
// src/Envio/EmailService.php
namespace App\Envio;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use EmpresaRepository;

class EmailService {
    private EmpresaRepository $empresaRepo;

    public function __construct(EmpresaRepository $empresaRepo) {
        $this->empresaRepo = $empresaRepo;
    }

    public function enviar(string $destinatario, string $asunto, string $cuerpo, string $pdfPath): bool {
        $empresa = $this->empresaRepo->getEmpresa();
        
        if (!$empresa || empty($empresa['email']) || empty($empresa['gmail_app_password'])) {
            error_log("Error: No hay empresa configurada, email o contraseña de aplicación.");
            return false;
        }

        $password = $this->empresaRepo->getDecryptedPassword();
        if (!$password) {
            error_log("Error: No se pudo descifrar la contraseña de la aplicación.");
            return false;
        }

        $mail = new PHPMailer(true);
        try {
            // Configuración del servidor
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $empresa['email'];
            $mail->Password   = $password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;
            
            $mail->CharSet = 'UTF-8';

            // Remitente y destinatario
            $mail->setFrom($empresa['email'], $empresa['nombre']);
            $mail->addAddress($destinatario);

            // Adjuntos
            if (file_exists($pdfPath)) {
                $mail->addAttachment($pdfPath);
            } else {
                error_log("Error: El archivo PDF a adjuntar no existe: $pdfPath");
                return false;
            }

            // Contenido
            $mail->isHTML(true);
            $mail->Subject = $asunto;
            // Convertir saltos de línea a <br> si es necesario
            $mail->Body    = nl2br(htmlspecialchars($cuerpo));
            $mail->AltBody = $cuerpo;

            return $mail->send();
        } catch (Exception $e) {
            error_log("Error enviando email: {$mail->ErrorInfo}");
            return false;
        }
    }
}
