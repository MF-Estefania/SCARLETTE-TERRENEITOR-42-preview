-- =====================================================================
-- MIGRACIÓN 003: IMÁGENES / ASSETS PARA CATÁLOGO DE MODELOS (PRÁCTICA 4.3)
-- Punto 10.1: Catálogo público con fotos/assets reales por modelo
-- =====================================================================

-- 1. Agregar columna imagen_url en modelos_vehiculo si no existe
SET @col_img_exists = 0;
SELECT COUNT(*) INTO @col_img_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'modelos_vehiculo'
  AND COLUMN_NAME = 'imagen_url';

SET @sql_add_img = IF(
    @col_img_exists = 0,
    'ALTER TABLE modelos_vehiculo ADD COLUMN imagen_url VARCHAR(255) NULL AFTER microcontrolador',
    'SELECT 1'
);
PREPARE stmt FROM @sql_add_img;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Asignar assets locales reales a los modelos comerciales registrados
UPDATE modelos_vehiculo SET imagen_url = 'assets/img/vehiculo-terreneitor.jpg' WHERE id_modelo = 1;
UPDATE modelos_vehiculo SET imagen_url = 'assets/img/vehiculo-excavadora.jpg'  WHERE id_modelo = 2;
UPDATE modelos_vehiculo SET imagen_url = 'assets/img/vehiculo-montacargas.jpg' WHERE id_modelo = 3;
UPDATE modelos_vehiculo SET imagen_url = 'assets/img/vehiculo-volteo.jpg'      WHERE id_modelo = 4;
