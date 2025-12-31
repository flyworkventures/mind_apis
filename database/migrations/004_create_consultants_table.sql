-- Consultants table migration
-- ConsultantModel'e göre oluşturulmuş tablo yapısı
-- Run this SQL script to create the consultants table

CREATE TABLE IF NOT EXISTS `consultants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Names in different languages (JSON format)
  -- Example: {"tr": "Serap", "en": "Sarah", "de": "Sarah"}
  `names` JSON NOT NULL COMMENT 'Consultant names in different languages',
  
  -- Main prompt for the consultant
  `main_prompt` TEXT NOT NULL COMMENT 'Main prompt for the consultant',
  
  -- Photo URL
  `photo_url` VARCHAR(500) DEFAULT NULL COMMENT 'Consultant photo URL',
  
  -- Created date (ISO 8601 format string)
  `created_date` VARCHAR(50) NOT NULL COMMENT 'Created date in ISO 8601 format',
  
  -- Explanation
  `explanation` TEXT DEFAULT NULL COMMENT 'Consultant explanation/description',
  
  -- Features (JSON array)
  -- Example: ["feature1", "feature2", "feature3"]
  `features` JSON DEFAULT NULL COMMENT 'Consultant features (List)',
  
  -- Job title
  `job` VARCHAR(255) NOT NULL COMMENT 'Consultant job title',
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX `idx_job` (`job`),
  INDEX `idx_created_date` (`created_date`),
  INDEX `idx_created_at` (`created_at`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Consultants table - ConsultantModel structure';

