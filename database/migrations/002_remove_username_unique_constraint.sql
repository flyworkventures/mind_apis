-- Remove unique constraint from username
-- Username artık unique olmayacak, herkes istediği ismi kullanabilir
-- Index korunuyor (performans için), sadece unique constraint kaldırılıyor

-- MySQL/MariaDB için unique constraint'i kaldır
-- NOT: Eğer hata alırsanız, önce SHOW INDEX FROM users; ile index isimlerini kontrol edin
ALTER TABLE `users` DROP INDEX `uk_username`;

-- idx_username index'i korunuyor (performans için gerekli)
-- Eğer index'i de kaldırmak isterseniz (önerilmez):
-- ALTER TABLE `users` DROP INDEX `idx_username`;

