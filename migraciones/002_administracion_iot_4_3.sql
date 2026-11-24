-- =====================================================================
-- MIGRACIÓN 002: ADMINISTRACIÓN IoT + RENUMERACIÓN DESDE 1 + ROLES
-- Práctica 4.3: Aplicación de Administración IoT
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. RENUMERACIÓN DE DATOS EXISTENTES PARA INICIAR DESDE 1
-- ---------------------------------------------------------------------

-- A. Renumerar vehiculos: 7 -> 1
UPDATE vehiculos SET id_vehiculo = 1 WHERE id_vehiculo = 7;
UPDATE comandos SET id_vehiculo = 1 WHERE id_vehiculo = 7;
UPDATE demos SET id_vehiculo = 1 WHERE id_vehiculo = 7;
UPDATE estado_vehiculo SET id_vehiculo = 1, id_estado = 1 WHERE id_vehiculo = 7;
UPDATE historial_comandos SET id_vehiculo = 1 WHERE id_vehiculo = 7;
UPDATE tickets_ws SET id_vehiculo = 1 WHERE id_vehiculo = 7;

-- B. Renumerar comandos existentes (25..37 -> 1..13)
-- Guardamos primero con offset para evitar colisiones de PK
UPDATE comandos SET id_comando = id_comando + 1000;
UPDATE demo_movimientos SET id_comando = id_comando + 1000;
UPDATE estado_vehiculo SET id_comando = id_comando + 1000;
UPDATE historial_comandos SET id_comando = id_comando + 1000;

-- Mapeo 1 a 1 de comandos
-- 1025 -> 1 (B: AVANZAR)
-- 1026 -> 2 (C: RETROCEDER)
-- 1027 -> 3 (D: DIAGONAL IZQUIERDA)
-- 1028 -> 4 (E: CONTROL / LUCES)
-- 1029 -> 5 (F: DIAGONAL DERECHA)
-- 1030 -> 6 (G: RECTO IZQUIERDA)
-- 1031 -> 7 (H: ENDEREZAR / JOROBAR)
-- 1032 -> 8 (I: RECTO DERECHA)
-- 1033 -> 9 (J: DEMO)
-- 1034 -> 10 (K: MUSICA)
-- 1035 -> 11 (L: GIRO 360)
-- 1036 -> 12 (M: GIRO IZQUIERDA)
-- 1037 -> 13 (N: GIRO DERECHA)

UPDATE comandos SET id_comando = id_comando - 1024 WHERE id_comando >= 1025 AND id_comando <= 1037;
UPDATE demo_movimientos SET id_comando = id_comando - 1024 WHERE id_comando >= 1025 AND id_comando <= 1037;
UPDATE estado_vehiculo SET id_comando = id_comando - 1024 WHERE id_comando >= 1025 AND id_comando <= 1037;
UPDATE historial_comandos SET id_comando = id_comando - 1024 WHERE id_comando >= 1025 AND id_comando <= 1037;

-- C. Renumerar demos existentes (7, 8 -> 1, 2)
UPDATE demos SET id_demo = 1 WHERE id_demo = 7;
UPDATE demos SET id_demo = 2 WHERE id_demo = 8;
UPDATE demo_movimientos SET id_demo = 1 WHERE id_demo = 7;
UPDATE demo_movimientos SET id_demo = 2 WHERE id_demo = 8;

-- D. Renumerar demo_movimientos secuencialmente 1..11
SET @row_num = 0;
CREATE TEMPORARY TABLE temp_demo_movs AS
SELECT id_demo_movimiento, (@row_num := @row_num + 1) AS nuevo_id
FROM demo_movimientos
ORDER BY id_demo, orden;

UPDATE demo_movimientos dm
JOIN temp_demo_movs t ON dm.id_demo_movimiento = t.id_demo_movimiento
SET dm.id_demo_movimiento = t.nuevo_id;

DROP TEMPORARY TABLE temp_demo_movs;

-- E. Renumerar historial_comandos secuencialmente 1..N
SET @h_num = 0;
CREATE TEMPORARY TABLE temp_historial AS
SELECT id_historial, (@h_num := @h_num + 1) AS nuevo_id
FROM historial_comandos
ORDER BY id_historial;

UPDATE historial_comandos hc
JOIN temp_historial t ON hc.id_historial = t.id_historial
SET hc.id_historial = t.nuevo_id;

DROP TEMPORARY TABLE temp_historial;

-- F. Ajustar AUTO_INCREMENT para continuar después del máximo
ALTER TABLE vehiculos AUTO_INCREMENT = 2;
ALTER TABLE comandos AUTO_INCREMENT = 14;
ALTER TABLE demos AUTO_INCREMENT = 3;
ALTER TABLE demo_movimientos AUTO_INCREMENT = 12;
ALTER TABLE estado_vehiculo AUTO_INCREMENT = 2;
ALTER TABLE historial_comandos AUTO_INCREMENT = 930;

-- ---------------------------------------------------------------------
-- 2. EXTENSIONES DEL ESQUEMA PARA PRÁCTICA 4.3 (ADMINISTRACIÓN IoT)
-- ---------------------------------------------------------------------

-- A. Catálogo de Modelos Comerciales
CREATE TABLE IF NOT EXISTS modelos_vehiculo (
    id_modelo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_modelo VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255) NULL,
    microcontrolador VARCHAR(50) DEFAULT 'ESP8266',
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar modelo inicial Terreneitor TR-01 si no existe
INSERT INTO modelos_vehiculo (id_modelo, nombre_modelo, descripcion, microcontrolador, activo)
VALUES (1, 'Terreneitor TR-01', 'Vehículo todoterreno IoT con control bidireccional y telemetría', 'ESP8266', 1)
ON DUPLICATE KEY UPDATE nombre_modelo=VALUES(nombre_modelo);

-- B. Evolucionar tabla `vehiculos` como UNIDAD física
-- Añadir id_modelo, numero_serie, id_propietario, estado_comercial si no existen
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehiculos' AND COLUMN_NAME = 'id_modelo';

SET @sql_alt = IF(@col_exists = 0,
    'ALTER TABLE vehiculos
     ADD COLUMN id_modelo INT NULL AFTER id_vehiculo,
     ADD COLUMN numero_serie VARCHAR(50) NULL AFTER modelo,
     ADD COLUMN id_propietario INT NULL AFTER numero_serie,
     ADD COLUMN estado_comercial ENUM(\'disponible\', \'vendido\', \'exhibicion\', \'mantenimiento\') DEFAULT \'disponible\' AFTER id_propietario,
     ADD CONSTRAINT fk_vehiculo_modelo FOREIGN KEY (id_modelo) REFERENCES modelos_vehiculo(id_modelo) ON DELETE SET NULL ON UPDATE CASCADE,
     ADD CONSTRAINT fk_vehiculo_propietario FOREIGN KEY (id_propietario) REFERENCES usuarios_app(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1');
PREPARE stmt FROM @sql_alt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar unidad física 1 como vendida a usuario comprador (id_usuario = 2)
UPDATE vehiculos
SET id_modelo = 1,
    numero_serie = 'TR01-SN-2026-0001',
    id_propietario = 2,
    estado_comercial = 'vendido'
WHERE id_vehiculo = 1;

-- Crear Unidad física 2 dedicada a EXHIBICIÓN para invitados/demos públicas
INSERT INTO vehiculos (id_vehiculo, id_modelo, nombre, modelo, numero_serie, descripcion, microcontrolador, id_propietario, estado_comercial, activo)
VALUES (2, 1, 'Terreneitor Exhibición', 'TR-01', 'TR01-EXH-2026-0002', 'Unidad de exhibición para pruebas temporales de invitados', 'ESP8266', NULL, 'exhibicion', 1)
ON DUPLICATE KEY UPDATE estado_comercial='exhibicion';

-- Asegurar estado inicial para unidad 2
INSERT INTO estado_vehiculo (id_estado, id_vehiculo, id_comando, conectado)
VALUES (2, 2, NULL, 0)
ON DUPLICATE KEY UPDATE conectado=VALUES(conectado);

-- Copiar catálogo de comandos a la unidad 2 para habilitar su control
INSERT IGNORE INTO comandos (id_vehiculo, nombre, codigo, descripcion, activo)
SELECT 2, nombre, codigo, descripcion, activo
FROM comandos
WHERE id_vehiculo = 1;

-- C. Ampliar roles en `usuarios_app`
ALTER TABLE usuarios_app
MODIFY COLUMN rol ENUM('administradora', 'administrador', 'usuario', 'invitado') NOT NULL;

-- Crear usuario invitado por defecto si no existe (definir hash seguro en servidor)
INSERT INTO usuarios_app (id_usuario, nombre_usuario, password_hash, rol, activo)
VALUES (3, 'invitado', '<HASH_GENERADO_EN_SERVIDOR>', 'invitado', 1)
ON DUPLICATE KEY UPDATE rol='invitado';

-- D. Ampliar tabla `demos` (tipo de demo y creador)
SET @demo_col_exists = 0;
SELECT COUNT(*) INTO @demo_col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'demos' AND COLUMN_NAME = 'tipo_demo';

SET @sql_demo = IF(@demo_col_exists = 0,
    'ALTER TABLE demos
     ADD COLUMN id_creador INT NULL AFTER id_vehiculo,
     ADD COLUMN tipo_demo ENUM(\'fabrica\', \'privada\') DEFAULT \'fabrica\' AFTER descripcion,
     ADD CONSTRAINT fk_demo_creador FOREIGN KEY (id_creador) REFERENCES usuarios_app(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1');
PREPARE stmt FROM @sql_demo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Demos existentes 1 y 2 quedan como demos de fábrica
UPDATE demos SET tipo_demo = 'fabrica', id_creador = NULL WHERE id_demo IN (1, 2);

-- E. Tabla de Reservas Temporales de Exhibición para Invitados
CREATE TABLE IF NOT EXISTS reservas_exhibicion (
    id_reserva INT AUTO_INCREMENT PRIMARY KEY,
    id_vehiculo INT NOT NULL,
    id_usuario INT NOT NULL,
    token_sesion VARCHAR(64) NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    activa TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reserva_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
    CONSTRAINT fk_reserva_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios_app(id_usuario) ON DELETE CASCADE,
    INDEX idx_reserva_activa (activa, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- F. Tabla de Bitácora de Auditoría
CREATE TABLE IF NOT EXISTS bitacora_auditoria (
    id_auditoria BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NULL,
    nombre_usuario VARCHAR(50) NULL,
    rol VARCHAR(30) NULL,
    accion VARCHAR(60) NOT NULL,
    recurso VARCHAR(100) NOT NULL,
    detalle TEXT NULL,
    ip_origen VARCHAR(45) NULL,
    resultado VARCHAR(20) DEFAULT 'EXITO',
    INDEX idx_auditoria_fecha (fecha_hora),
    INDEX idx_auditoria_usuario (id_usuario),
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios_app(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
