<?php
/**
 * API DE GESTIÓN DE ACCESOS (ENTRADAS Y SALIDAS)
 * Operaciones CRUD completas para la bitácora de accesos.
 */

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    
    // ------------------------------------------------------------------------
    // GET: LISTAR ACCESOS CON FILTROS
    // ------------------------------------------------------------------------
    case 'GET':
        try {
            $busqueda = isset($_GET['q']) ? trim($_GET['q']) : '';
            $estado = isset($_GET['estado']) ? trim($_GET['estado']) : '';

            $sql = "SELECT 
                        a.id,
                        a.residente_id,
                        a.visitante_id,
                        v.nombre AS visitante_nombre,
                        v.identificacion AS visitante_id_doc,
                        v.telefono AS visitante_telefono,
                        v.tipo_visitante,
                        r.nombre AS residente_nombre,
                        r.numero_casa,
                        r.telefono AS residente_telefono,
                        a.motivo,
                        a.fecha_entrada,
                        a.fecha_salida,
                        a.estado,
                        a.observaciones
                    FROM accesos a
                    INNER JOIN visitantes v ON a.visitante_id = v.id
                    INNER JOIN residentes r ON a.residente_id = r.id
                    WHERE 1=1";

            $params = [];

            if (!empty($busqueda)) {
                $sql .= " AND (v.nombre LIKE :busqueda OR r.numero_casa LIKE :busqueda OR r.nombre LIKE :busqueda OR a.motivo LIKE :busqueda)";
                $params[':busqueda'] = "%" . $busqueda . "%";
            }

            if (!empty($estado) && $estado !== 'TODOS') {
                $sql .= " AND a.estado = :estado";
                $params[':estado'] = $estado;
            }

            $sql .= " ORDER BY a.fecha_entrada DESC";

            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            $accesos = $stmt->fetchAll();

            echo json_encode([
                "status" => "success",
                "total" => count($accesos),
                "data" => $accesos
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    // ------------------------------------------------------------------------
    // POST: REGISTRAR NUEVO ACCESO / VISITANTE
    // ------------------------------------------------------------------------
    case 'POST':
        try {
            $data = json_decode(file_get_contents("php://input"), true);

            if (empty($data['nombre_visitante']) || empty($data['residente_id']) || empty($data['motivo'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Por favor complete los campos obligatorios."]);
                exit();
            }

            $conn->beginTransaction();

            // 1. Buscar si el visitante ya está registrado por su nombre
            $stmtVis = $conn->prepare("SELECT id FROM visitantes WHERE nombre = :nombre LIMIT 1");
            $stmtVis->execute([':nombre' => trim($data['nombre_visitante'])]);
            $vis = $stmtVis->fetch();

            if ($vis) {
                $visitante_id = $vis['id'];
            } else {
                $stmtInsVis = $conn->prepare("INSERT INTO visitantes (nombre, identificacion, telefono, tipo_visitante) VALUES (:nombre, :identificacion, :telefono, :tipo)");
                $stmtInsVis->execute([
                    ':nombre' => trim($data['nombre_visitante']),
                    ':identificacion' => $data['identificacion'] ?? 'Sin ID',
                    ':telefono' => $data['telefono_visitante'] ?? '',
                    ':tipo' => $data['tipo_visitante'] ?? 'Visita General'
                ]);
                $visitante_id = $conn->lastInsertId();
            }

            // 2. Insertar el registro de acceso
            $fecha_entrada = !empty($data['fecha_entrada']) ? $data['fecha_entrada'] : date('Y-m-d H:i:s');
            $fecha_salida = !empty($data['fecha_salida']) ? $data['fecha_salida'] : null;
            $estado = !empty($fecha_salida) ? 'SALIDO' : 'EN FRACCIONAMIENTO';

            $sqlAcceso = "INSERT INTO accesos (residente_id, visitante_id, motivo, fecha_entrada, fecha_salida, estado, observaciones) 
                          VALUES (:residente_id, :visitante_id, :motivo, :fecha_entrada, :fecha_salida, :estado, :observaciones)";

            $stmtAcc = $conn->prepare($sqlAcceso);
            $stmtAcc->execute([
                ':residente_id' => $data['residente_id'],
                ':visitante_id' => $visitante_id,
                ':motivo' => trim($data['motivo']),
                ':fecha_entrada' => $fecha_entrada,
                ':fecha_salida' => $fecha_salida,
                ':estado' => $estado,
                ':observaciones' => $data['observaciones'] ?? ''
            ]);

            $acceso_id = $conn->lastInsertId();
            $conn->commit();

            echo json_encode([
                "status" => "success",
                "message" => "Acceso registrado correctamente en la base de datos.",
                "acceso_id" => $acceso_id
            ]);
        } catch (PDOException $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    // ------------------------------------------------------------------------
    // PUT: REGISTRAR SALIDA O EDITAR ACCESO
    // ------------------------------------------------------------------------
    case 'PUT':
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            $id = $data['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ID de acceso no especificado."]);
                exit();
            }

            if (isset($data['accion']) && $data['accion'] === 'marcar_salida') {
                $fecha_salida = date('Y-m-d H:i:s');
                $stmt = $conn->prepare("UPDATE accesos SET fecha_salida = :fecha_salida, estado = 'SALIDO' WHERE id = :id");
                $stmt->execute([':fecha_salida' => $fecha_salida, ':id' => $id]);
                
                echo json_encode(["status" => "success", "message" => "Salida registrada exitosamente."]);
                exit();
            }

            // Edición de campos
            $sql = "UPDATE accesos SET 
                        motivo = :motivo, 
                        fecha_salida = :fecha_salida, 
                        estado = :estado, 
                        observaciones = :observaciones 
                    WHERE id = :id";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':motivo' => $data['motivo'],
                ':fecha_salida' => !empty($data['fecha_salida']) ? $data['fecha_salida'] : null,
                ':estado' => $data['estado'],
                ':observaciones' => $data['observaciones'] ?? '',
                ':id' => $id
            ]);

            echo json_encode(["status" => "success", "message" => "Registro de acceso actualizado correctamente."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    // ------------------------------------------------------------------------
    // DELETE: ELIMINAR ACCESO
    // ------------------------------------------------------------------------
    case 'DELETE':
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ID no especificado."]);
                exit();
            }

            $stmt = $conn->prepare("DELETE FROM accesos WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode(["status" => "success", "message" => "Registro de acceso eliminado correctamente."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;
}
?>
