<?php
// database.php
function getDB() {
    $host = 'localhost';
    $db   = 'moran_app';
    $user = 'root'; // Usuario por defecto de XAMPP
    $pass = '';     // Contraseña por defecto vacía en XAMPP
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (\PDOException $e) {
        // En producción, mejor registrar en log y mostrar un mensaje genérico
        die("Error de conexión a la base de datos: " . $e->getMessage());
    }
}
