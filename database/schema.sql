-- ============================================================================
-- SISTEMA FORMAL DE CONTROL DE ACCESO RESIDENCIAL
-- ESQUEMA DE BASE DE DATOS MYSQL / MARIADB
-- ============================================================================

-- 1. CREACIÓN DE LA BASE DE DATOS
DROP DATABASE IF EXISTS control_fraccionamiento;
CREATE DATABASE control_fraccionamiento 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE control_fraccionamiento;

-- ============================================================================
-- 2. TABLAS RELACIONALES
-- ============================================================================

-- TABLA: residentes
CREATE TABLE residentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    numero_casa VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    correo VARCHAR(100),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TABLA: visitantes
CREATE TABLE visitantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    identificacion VARCHAR(50) NOT NULL,
    telefono VARCHAR(20),
    tipo_visitante ENUM('Familiar', 'Proveedor', 'Servicio/Mantenimiento', 'Visita General') DEFAULT 'Visita General',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TABLA: accesos
CREATE TABLE accesos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    residente_id INT NOT NULL,
    visitante_id INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    fecha_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_salida DATETIME NULL,
    estado ENUM('EN FRACCIONAMIENTO', 'SALIDO') DEFAULT 'EN FRACCIONAMIENTO',
    observaciones VARCHAR(255),
    
    CONSTRAINT fk_accesos_residentes 
        FOREIGN KEY (residente_id) 
        REFERENCES residentes(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    CONSTRAINT fk_accesos_visitantes 
        FOREIGN KEY (visitante_id) 
        REFERENCES visitantes(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 3. DATOS DE INICIALIZACIÓN DE PRUEBA
-- ============================================================================

INSERT INTO residentes (nombre, numero_casa, telefono, correo) VALUES
('Carlos Mendoza García', 'Casa 101', '555-123-4567', 'carlos.mendoza@email.com'),
('María Elena López', 'Casa 102', '555-987-6543', 'maria.lopez@email.com'),
('Roberto Fernández', 'Depto 201-A', '555-456-7890', 'roberto.f@email.com'),
('Laura Sofía Ramírez', 'Casa 205', '555-321-6548', 'laura.ramirez@email.com'),
('Jorge Alberto Torres', 'Depto 304-B', '555-789-1234', 'jorge.torres@email.com');

INSERT INTO visitantes (nombre, identificacion, telefono, tipo_visitante) VALUES
('Ana Patricia Gómez', 'INE-84729104', '555-111-2233', 'Familiar'),
('Fernando Silva Ruiz', 'LIC-92837129', '555-444-5566', 'Proveedor'),
('Técnico Paquetetrack (Luis Pérez)', 'GAB-10293847', '555-777-8899', 'Servicio/Mantenimiento'),
('Claudia Ramos Morales', 'INE-55443322', '555-999-0011', 'Visita General'),
('Ricardo Morales Vega', 'INE-11223344', '555-666-7788', 'Familiar');

INSERT INTO accesos (residente_id, visitante_id, motivo, fecha_entrada, fecha_salida, estado, observaciones) VALUES
(1, 1, 'Reunión familiar de fin de semana', NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 1 HOUR, 'SALIDO', 'Nissan Sentra Gris Placas ABC-123'),
(2, 2, 'Entrega de material de construcción', NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 2 HOUR, 'SALIDO', 'Camión de carga 3 toneladas'),
(1, 3, 'Entrega de paquete de mensajería', NOW() - INTERVAL 1 HOUR, NULL, 'EN FRACCIONAMIENTO', 'Camioneta identificada de mensajería'),
(3, 4, 'Visita personal a departamento', NOW() - INTERVAL 30 MINUTE, NULL, 'EN FRACCIONAMIENTO', 'Peatonal, mostró INE en caseta'),
(4, 5, 'Comida de cumpleaños', NOW() - INTERVAL 15 MINUTE, NULL, 'EN FRACCIONAMIENTO', 'Vehículo Ford Mustang Azul');
