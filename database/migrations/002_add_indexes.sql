-- Additional indexes for better query performance
-- Run this after 001_create_users_table.sql
-- 
-- NOT: Bu dosya MySQL 5.7+ için tasarlanmıştır
-- MariaDB kullanıyorsanız, generated column yöntemini kullanın (001_create_users_table_mariadb.sql)

-- Index for searching users by email in credential_data (MySQL 5.7+)
-- MariaDB kullanıyorsanız bu satırı yorum satırı yapın
-- ALTER TABLE `users` ADD INDEX `idx_credential_email` (
--   (CAST(`credential_data`->>'$.email' AS CHAR(255)))
-- );

-- MariaDB için: Eğer 001_create_users_table_mariadb.sql kullandıysanız
-- credential_email generated column zaten oluşturulmuştur ve index'lenmiştir

-- Index for searching users by provider ID in credential_data
-- This is already partially covered by idx_credential_data, but this is more explicit
-- Note: This might fail on MySQL < 5.7, comment out if needed

-- Full-text search index for psychological profiles (optional)
-- Uncomment if you need full-text search on these fields
-- ALTER TABLE `users` ADD FULLTEXT INDEX `ft_psychological_profile` (
--   `last_psychological_profile`,
--   `psychological_profile_based_on_messages`,
--   `general_psychological_profile`
-- );

