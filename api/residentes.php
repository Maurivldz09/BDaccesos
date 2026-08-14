<?php
/**
 * API DE GESTIÓN DE RESIDENTES
 * Operaciones CRUD para el catálogo de propietarios / inquilinos.
 */

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $conn->query("SELECT id, nombre, numero_casa, telefono, correo, fecha_registro FROM residentes ORDER BY numero_casa ASC");
            $residentes = $stmt->fetchAll();
            echo json_encode(["status" => "success", "data" => $residentes]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'POST':
        try {
            $data = json_decode(file_get_contents("php://input"), true);

            if (empty($data['nombre']) || empty($data['numero_casa'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Nombre y número de casa son obligatorios."]);
                exit();
            }

            $sql = "INSERT INTO residentes (nombre, numero_casa, telefono, correo) VALUES (:nombre, :numero_casa, :telefono, :correo)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':nombre' => trim($data['nombre']),
                ':numero_casa' => trim($data['numero_casa']),
                ':telefono' => $data['telefono'] ?? '',
                ':correo' => $data['correo'] ?? ''
            ]);

            echo json_encode(["status" => "success", "message" => "Residente registrado con éxito.", "id" => $conn->lastInsertId()]);
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

            $sql = "UPDATE residentes SET nombre = :nombre, numero_casa = :numero_casa, telefono = :telefono, correo = :correo WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':nombre' => trim($data['nombre']),
                ':numero_casa' => trim($data['numero_casa']),
                ':telefono' => $data['telefono'] ?? '',
                ':correo' => $data['correo'] ?? '',
                ':id' => $data['id']
            ]);

            echo json_encode(["status" => "success", "message" => "Datos de residente actualizados correctamente."]);
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

            $stmt = $conn->prepare("DELETE FROM residentes WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode(["status" => "success", "message" => "Residente eliminado correctamente de la base de datos."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;
}
?>
