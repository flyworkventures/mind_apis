-- Remove unique constraint from username
-- Username artık unique olmayacak, herkes istediği ismi kullanabilir
-- Index korunuyor (performans için), sadece unique constraint kaldırılıyor

-- MySQL/MariaDB için unique constraint'i kaldır
-- NOT: Eğer hata alırsanız, önce SHOW INDEX FROM users; ile index isimlerini kontrol edin

-- Önce index'in var olup olmadığını kontrol et ve kaldır
-- Eğer index yoksa hata vermez (IF EXISTS kullanılamaz MySQL'de, bu yüzden try-catch gerekir)
-- Bu migration'ı çalıştırmadan önce sunucuda manuel olarak kontrol edin:

-- Kontrol için:
-- SHOW INDEX FROM users WHERE Key_name = 'uk_username';

-- Unique constraint'i kaldır
ALTER TABLE `users` DROP INDEX `uk_username`;

-- idx_username index'i korunuyor (performans için gerekli)
-- Eğer index'i de kaldırmak isterseniz (önerilmez):
-- ALTER TABLE `users` DROP INDEX `idx_username`;
