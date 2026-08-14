<?php
/**
 * SISTEMA FORMAL DE CONTROL DE ACCESO RESIDENCIAL
 * Configuración de Conexión a Base de Datos MySQL (PDO)
 */

$host = "localhost";
$db_name = "control_fraccionamiento";
$username = "root";
$password = "";

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "No se pudo establecer conexión con la base de datos MySQL.",
        "detalle" => $e->getMessage()
    ]);
    exit();
}
?>
