<?php
/**
 * API DE ESTADÍSTICAS PARA DASHBOARD ADMINISTRATIVO
 * Retorna las métricas en tiempo real de la base de datos MySQL.
 */

require_once 'db.php';

try {
    // 1. Personas actualmente en fraccionamiento
    $stmt1 = $conn->query("SELECT COUNT(*) AS dentro FROM accesos WHERE estado = 'EN FRACCIONAMIENTO'");
    $dentro = $stmt1->fetch()['dentro'];

    // 2. Salidas registradas hoy
    $stmt2 = $conn->query("SELECT COUNT(*) AS salidos FROM accesos WHERE estado = 'SALIDO' AND DATE(fecha_entrada) = CURDATE()");
    $salidos_hoy = $stmt2->fetch()['salidos'];

    // 3. Total accesos hoy
    $stmt3 = $conn->query("SELECT COUNT(*) AS total_hoy FROM accesos WHERE DATE(fecha_entrada) = CURDATE()");
    $total_hoy = $stmt3->fetch()['total_hoy'];

    // 4. Total residentes registrados
    $stmt4 = $conn->query("SELECT COUNT(*) AS total_residentes FROM residentes");
    $total_residentes = $stmt4->fetch()['total_residentes'];

    // 5. Total de accesos históricos
    $stmt5 = $conn->query("SELECT COUNT(*) AS total_historico FROM accesos");
    $total_historico = $stmt5->fetch()['total_historico'];

    echo json_encode([
        "status" => "success",
        "data" => [
            "dentro" => (int)$dentro,
            "salidos_hoy" => (int)$salidos_hoy,
            "total_hoy" => (int)$total_hoy,
            "total_residentes" => (int)$total_residentes,
            "total_historico" => (int)$total_historico
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
