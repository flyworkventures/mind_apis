-- Chats table migration
-- ChatModel'e göre oluşturulmuş tablo yapısı
-- Run this SQL script to create the chats table

CREATE TABLE IF NOT EXISTS `chats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Chat relationships
  `consultant_id` INT NOT NULL COMMENT 'Consultant ID',
  `user_id` INT NOT NULL COMMENT 'User ID',
  
  -- Chat dates (ISO 8601 format strings)
  `created_date` VARCHAR(50) NOT NULL COMMENT 'Created date in ISO 8601 format',
  
  -- Last message info
  `last_message` TEXT DEFAULT NULL COMMENT 'Last message in the chat',
  `last_message_date` VARCHAR(50) DEFAULT NULL COMMENT 'Last message date in ISO 8601 format',
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (`consultant_id`) REFERENCES `consultants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_consultant_id` (`consultant_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_date` (`created_date`),
  INDEX `idx_last_message_date` (`last_message_date`),
  -- Unique constraint: one chat per user-consultant pair
  UNIQUE KEY `unique_user_consultant` (`user_id`, `consultant_id`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Chats table - ChatModel structure';

