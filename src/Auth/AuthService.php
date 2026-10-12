<?php
namespace App\Auth;

use PDO;

class AuthService {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function login(string $email, string $password): bool {
        $stmt = $this->db->prepare("SELECT id, nombre, password_hash, rol, activo FROM usuarios WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && $user['activo'] == 1 && password_verify($password, $user['password_hash'])) {
            // Prevent session fixation
            session_regenerate_id(true);

            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['nombre'] = $user['nombre'];
            $_SESSION['rol'] = $user['rol'];
            
            return true;
        }

        return false;
    }

    public function logout(): void {
        session_unset();
        session_destroy();
    }

    public function isLoggedIn(): bool {
        return isset($_SESSION['usuario_id']);
    }

    public function requireLogin(): void {
        if (!$this->isLoggedIn()) {
            header("Location: " . BASE_URL . "login.php");
            exit;
        }
    }
}
