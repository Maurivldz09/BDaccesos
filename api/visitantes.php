<?php
/**
 * API DE GESTIÓN DE VISITANTES
 * Operaciones CRUD para el catálogo de visitantes.
 */

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $conn->query("SELECT id, nombre, identificacion, telefono, tipo_visitante, fecha_registro FROM visitantes ORDER BY nombre ASC");
            $visitantes = $stmt->fetchAll();
            echo json_encode(["status" => "success", "data" => $visitantes]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'POST':
        try {
            $data = json_decode(file_get_contents("php://input"), true);

            if (empty($data['nombre'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "El nombre del visitante es obligatorio."]);
                exit();
            }

            $sql = "INSERT INTO visitantes (nombre, identificacion, telefono, tipo_visitante) VALUES (:nombre, :identificacion, :telefono, :tipo_visitante)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':nombre' => trim($data['nombre']),
                ':identificacion' => $data['identificacion'] ?? 'Sin ID',
                ':telefono' => $data['telefono'] ?? '',
                ':tipo_visitante' => $data['tipo_visitante'] ?? 'Visita General'
            ]);

            echo json_encode(["status" => "success", "message" => "Visitante registrado correctamente.", "id" => $conn->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['id'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ID no especificado."]);
                exit();
            }

            $sql = "UPDATE visitantes SET nombre = :nombre, identificacion = :identificacion, telefono = :telefono, tipo_visitante = :tipo_visitante WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':nombre' => trim($data['nombre']),
                ':identificacion' => $data['identificacion'] ?? 'Sin ID',
                ':telefono' => $data['telefono'] ?? '',
                ':tipo_visitante' => $data['tipo_visitante'] ?? 'Visita General',
                ':id' => $data['id']
            ]);

            echo json_encode(["status" => "success", "message" => "Datos de visitante actualizados correctamente."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ID no especificado."]);
                exit();
            }

            $stmt = $conn->prepare("DELETE FROM visitantes WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode(["status" => "success", "message" => "Visitante eliminado correctamente."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;
}
?>
