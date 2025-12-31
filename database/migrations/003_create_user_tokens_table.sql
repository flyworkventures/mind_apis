-- User Tokens table migration
-- JWT token'ları database'de saklamak için (opsiyonel)
-- Bu tablo token'ları yönetmek, logout işlemleri ve token invalidate için kullanılabilir

CREATE TABLE IF NOT EXISTS `user_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token` TEXT NOT NULL COMMENT 'JWT token string',
  `token_hash` VARCHAR(255) NOT NULL COMMENT 'Token hash for quick lookup',
  `expires_at` DATETIME NOT NULL COMMENT 'Token expiration time',
  `is_revoked` BOOLEAN DEFAULT FALSE COMMENT 'Token revoked (logout)',
  `device_info` VARCHAR(255) DEFAULT NULL COMMENT 'Device information (optional)',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP address (optional)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` TIMESTAMP NULL DEFAULT NULL,
  
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_token_hash` (`token_hash`),
  INDEX `idx_expires_at` (`expires_at`),
  INDEX `idx_is_revoked` (`is_revoked`),
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User JWT tokens table - Token management and logout support';

-- MariaDB için generated column (token_hash için)
-- ALTER TABLE `user_tokens` 
-- ADD COLUMN `token_hash` VARCHAR(255) 
-- AS (SHA2(`token`, 256)) STORED;

