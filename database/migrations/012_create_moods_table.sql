-- Moods table migration
-- Run this SQL script to create the moods table

CREATE TABLE IF NOT EXISTS `moods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  -- User relationship
  `user_id` INT NOT NULL COMMENT 'User ID - Kullanıcı ID',
  
  -- Mood data
  `date` DATE NOT NULL COMMENT 'Veri giriş tarihi',
  `mood` INT NOT NULL COMMENT 'Kullanıcının günlük modu (integer)',
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_date` (`date`),
  INDEX `idx_user_date` (`user_id`, `date`),
  
  -- Unique constraint: one mood per user per day
  UNIQUE KEY `unique_user_date` (`user_id`, `date`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Moods table - Kullanıcıların günlük modları';

