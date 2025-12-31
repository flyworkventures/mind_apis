-- Users table migration
-- UserModel'e göre oluşturulmuş tablo yapısı
-- Run this SQL script to create the users table

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Authentication fields
  `credential` VARCHAR(50) NOT NULL COMMENT 'google, facebook, apple',
  `credential_data` JSON NOT NULL COMMENT 'Provider-specific data (providerId, email, id)',
  
  -- User basic info
  `username` VARCHAR(255) NOT NULL,
  `native_lang` VARCHAR(10) DEFAULT NULL COMMENT 'User native language code (e.g., tr, en)',
  `gender` ENUM('male', 'female', 'unknown') NOT NULL DEFAULT 'unknown',
  `profile_photo_url` VARCHAR(500) DEFAULT NULL,
  
  -- QuestionAnswers data (JSON format)
  -- Contains: avaibleDays, avaibleHours, supportArea, agentSpeakStyle
  `answer_data` JSON DEFAULT NULL COMMENT 'QuestionAnswers object: {avaibleDays, avaibleHours, supportArea, agentSpeakStyle}',
  
  -- Psychological profile fields
  `last_psychological_profile` TEXT DEFAULT NULL COMMENT 'Son psikolojik profili',
  `psychological_profile_based_on_messages` TEXT DEFAULT NULL,
  `general_profile` TEXT DEFAULT NULL,
  `general_psychological_profile` TEXT DEFAULT NULL,
  
  -- Session and notes
  `user_agent_notes` JSON DEFAULT NULL COMMENT 'Görüşmeler sonrasında AI notları (List)',
  `least_sessions` JSON DEFAULT NULL COMMENT 'Least sessions data (List)',
  
  -- Timestamps
  `account_created_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation date (ISO 8601 format)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX `idx_credential` (`credential`),
  INDEX `idx_username` (`username`),
  INDEX `idx_account_created_date` (`account_created_date`),
  INDEX `idx_gender` (`gender`),
  
  -- Unique constraint for username
  UNIQUE KEY `uk_username` (`username`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Users table - Flutter UserModel ile uyumlu';

-- Index for credential_data JSON field
-- MySQL 5.7+ ve MariaDB 10.2+ için uyumlu versiyon
-- Not: MariaDB kullanıyorsanız, aşağıdaki generated column yöntemini kullanın
-- MySQL kullanıyorsanız, yorum satırındaki direkt index yöntemini kullanabilirsiniz

-- MySQL 5.7+ için (yorum satırını kaldırın):
-- ALTER TABLE `users` ADD INDEX `idx_credential_data` ((CAST(`credential_data`->>'$.id' AS CHAR(255))));

-- MariaDB 10.2+ için (generated column yöntemi):
-- Önce generated column oluştur
ALTER TABLE `users` ADD COLUMN `credential_provider_id` VARCHAR(255) AS (JSON_UNQUOTE(JSON_EXTRACT(`credential_data`, '$.id'))) STORED;
-- Sonra index ekle
ALTER TABLE `users` ADD INDEX `idx_credential_data` (`credential_provider_id`);

-- Example data structure for reference:
-- answer_data JSON example:
-- {
--   "avaibleDays": ["monday", "tuesday", "wednesday"],
--   "avaibleHours": ["09:00", "10:00", "14:00"],
--   "supportArea": "anxiety",
--   "agentSpeakStyle": "supportive"
-- }
--
-- credential_data JSON example:
-- {
--   "providerId": "google",
--   "email": "user@example.com",
--   "id": "google_user_id_123"
-- }
--
-- user_agent_notes JSON example (array):
-- [
--   {"sessionId": 1, "note": "User showed improvement", "date": "2024-01-01"},
--   {"sessionId": 2, "note": "Follow up needed", "date": "2024-01-02"}
-- ]
--
-- least_sessions JSON example (array):
-- [1, 2, 3, 4, 5]

