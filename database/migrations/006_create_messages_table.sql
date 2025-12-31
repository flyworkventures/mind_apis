-- Messages table migration
-- MessageModel'e göre oluşturulmuş tablo yapısı
-- Run this SQL script to create the messages table

CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Message relationships
  `chat_id` INT NOT NULL COMMENT 'Chat ID',
  `sender_id` INT NOT NULL COMMENT 'Sender ID (user_id or consultant_id)',
  `sender` ENUM('user', 'assistant') NOT NULL COMMENT 'Sender type: user or assistant',
  
  -- Message content
  `message` TEXT NOT NULL COMMENT 'Message content',
  
  -- Sent time (ISO 8601 format string)
  `sent_time` VARCHAR(50) NOT NULL COMMENT 'Sent time in ISO 8601 format',
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_chat_id` (`chat_id`),
  INDEX `idx_sender_id` (`sender_id`),
  INDEX `idx_sender` (`sender`),
  INDEX `idx_sent_time` (`sent_time`),
  INDEX `idx_created_at` (`created_at`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Messages table - MessageModel structure';

