<?php
// src/Envio/WhatsAppService.php
namespace App\Envio;

class WhatsAppService {
    public function generarLink(string $numero, string $mensaje): string {
        $numeroLimpio = preg_replace('/\D/', '', $numero); // Solo dígitos
        return "https://wa.me/{$numeroLimpio}?text=" . urlencode($mensaje);
    }
}
