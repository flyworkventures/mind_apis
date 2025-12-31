-- Appointments table migration
-- Run this SQL script to create the appointments table

CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Appointment relationships
  `user_id` INT NOT NULL COMMENT 'User ID - Randevuyu alan kullanıcı',
  `consultant_id` INT NOT NULL COMMENT 'Consultant ID - Randevuyu veren kullanıcı',
  
  -- Appointment date (ISO 8601 format string)
  `appointment_date` VARCHAR(50) NOT NULL COMMENT 'Randevu tarihi (ISO 8601 format)',
  
  -- Appointment status
  `status` ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending' COMMENT 'Randevu durumu',
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`consultant_id`) REFERENCES `consultants`(`id`) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_consultant_id` (`consultant_id`),
  INDEX `idx_appointment_date` (`appointment_date`),
  INDEX `idx_status` (`status`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Appointments table - Randevu tablosu';

