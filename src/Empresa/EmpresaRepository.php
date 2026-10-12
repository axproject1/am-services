<?php
// src/Empresa/EmpresaRepository.php

class EmpresaRepository {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getEmpresa(): ?array {
        $stmt = $this->db->query("SELECT * FROM empresa ORDER BY id DESC LIMIT 1");
        $empresa = $stmt->fetch();
        if ($empresa && isset($empresa['terminos_default'])) {
            $empresa['terminos_default'] = json_decode($empresa['terminos_default'], true) ?: [];
        }
        return $empresa ?: null;
    }

    public function guardar(array $datos): bool {
        $empresa = $this->getEmpresa();
        
        $terminos = json_encode($datos['terminos_default'] ?? []);
        
        if ($empresa) {
            $sql = "UPDATE empresa SET 
                    nombre = :nombre,
                    subtitulo = :subtitulo,
                    logo_path = COALESCE(:logo_path, logo_path),
                    telefono = :telefono,
                    email = :email,
                    direccion = :direccion,
                    ruc_nit = :ruc_nit,
                    terminos_default = :terminos_default,
                    itbms_default = :itbms_default,
                    gmail_app_password = COALESCE(:gmail_app_password, gmail_app_password),
                    activa = :activa
                    WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $datos['id'] = $empresa['id'];
        } else {
            $sql = "INSERT INTO empresa (nombre, subtitulo, logo_path, telefono, email, direccion, ruc_nit, terminos_default, itbms_default, gmail_app_password, activa) 
                    VALUES (:nombre, :subtitulo, :logo_path, :telefono, :email, :direccion, :ruc_nit, :terminos_default, :itbms_default, :gmail_app_password, :activa)";
            $stmt = $this->db->prepare($sql);
        }

        $gmail_pass = null;
        if (!empty($datos['gmail_app_password_plain'])) {
            $gmail_pass = $this->cifrar($datos['gmail_app_password_plain']);
        } else if (isset($datos['remove_gmail_password']) && $datos['remove_gmail_password'] == '1') {
            // Si queremos borrarla
            // Para eso, habría que cambiar el COALESCE arriba o manejarlo de otra forma.
            // Por simplicidad, asumimos que si envían vacío no se borra.
        }
        
        $params = [
            ':nombre' => $datos['nombre'] ?? '',
            ':subtitulo' => $datos['subtitulo'] ?? '',
            ':logo_path' => $datos['logo_path'] ?? null,
            ':telefono' => $datos['telefono'] ?? '',
            ':email' => $datos['email'] ?? '',
            ':direccion' => $datos['direccion'] ?? '',
            ':ruc_nit' => $datos['ruc_nit'] ?? '',
            ':terminos_default' => $terminos,
            ':itbms_default' => $datos['itbms_default'] ?? 7.00,
            ':gmail_app_password' => $gmail_pass,
            ':activa' => isset($datos['activa']) ? 1 : 0
        ];
        
        if ($empresa) {
            $params[':id'] = $datos['id'];
        }

        return $stmt->execute($params);
    }
    
    public function getDecryptedPassword(): ?string {
        $empresa = $this->getEmpresa();
        if ($empresa && !empty($empresa['gmail_app_password'])) {
            return $this->descifrar($empresa['gmail_app_password']);
        }
        return null;
    }

    private function getEncryptionKey(): string {
        if (defined('APP_ENCRYPTION_KEY')) {
            return APP_ENCRYPTION_KEY;
        }
        $key = getenv('APP_ENCRYPTION_KEY');
        return $key ?: 'MoranAppSecretKey2026!#$';
    }

    private function cifrar(string $plano): string {
        $clave = $this->getEncryptionKey();
        return openssl_encrypt($plano, 'AES-256-CBC', $clave, 0, substr($clave, 0, 16));
    }

    private function descifrar(string $cifrado): string {
        $clave = $this->getEncryptionKey();
        return openssl_decrypt($cifrado, 'AES-256-CBC', $clave, 0, substr($clave, 0, 16));
    }
}
