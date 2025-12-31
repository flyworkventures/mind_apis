# Database Migrations

## Migration Dosyaları

### 001_create_users_table.sql
Ana tablo yapısını oluşturur. Hem MySQL hem de MariaDB için uyumlu hale getirilmiştir.

**Kullanım:**
```bash
mysql -u root -p mindcoach < database/migrations/001_create_users_table.sql
```

**Not:** Eğer MariaDB kullanıyorsanız ve JSON index hatası alırsanız, `001_create_users_table_mariadb.sql` dosyasını kullanın.

### 001_create_users_table_mariadb.sql
MariaDB 10.2+ için özel olarak optimize edilmiş versiyon. Generated column kullanarak JSON field'ları index'ler.

**Kullanım:**
```bash
mysql -u root -p mindcoach < database/migrations/001_create_users_table_mariadb.sql
```

### 002_add_indexes.sql
Ek performans index'leri (opsiyonel).

**Kullanım:**
```bash
mysql -u root -p mindcoach < database/migrations/002_add_indexes.sql
```

## MySQL vs MariaDB Farkları

### JSON Index Oluşturma

**MySQL 5.7+:**
```sql
ALTER TABLE `users` ADD INDEX `idx_credential_data` 
((CAST(`credential_data`->>'$.id' AS CHAR(255))));
```

**MariaDB 10.2+:**
```sql
-- Generated column oluştur
ALTER TABLE `users` 
ADD COLUMN `credential_provider_id` VARCHAR(255) 
AS (JSON_UNQUOTE(JSON_EXTRACT(`credential_data`, '$.id'))) STORED;

-- Index ekle
ALTER TABLE `users` 
ADD INDEX `idx_credential_data` (`credential_provider_id`);
```

## Hangi Dosyayı Kullanmalıyım?

### MySQL 5.7+ Kullanıyorsanız:
- `001_create_users_table.sql` dosyasını kullanın

### MariaDB 10.2+ Kullanıyorsanız:
- `001_create_users_table_mariadb.sql` dosyasını kullanın
- Veya `001_create_users_table.sql` dosyasındaki MariaDB yorumlarını takip edin

### Hangi Veritabanını Kullanıyorum?

Versiyonunuzu kontrol etmek için:
```sql
SELECT VERSION();
```

## Sorun Giderme

### "You have an error in your SQL syntax" Hatası

Bu hata genellikle MariaDB'de MySQL syntax'ı kullanıldığında oluşur.

**Çözüm:**
1. MariaDB kullanıyorsanız `001_create_users_table_mariadb.sql` dosyasını kullanın
2. Veya `001_create_users_table.sql` dosyasındaki MariaDB yorumlarını takip edin

### "JSON data type is not supported" Hatası

Bu hata eski MySQL/MariaDB versiyonlarında oluşur.

**Çözüm:**
- MySQL 5.7+ veya MariaDB 10.2+ kullanmanız gerekir
- Versiyonunuzu kontrol edin: `SELECT VERSION();`

### Generated Column Hatası

MariaDB 10.2'den önceki versiyonlarda generated column desteklenmez.

**Çözüm:**
- MariaDB 10.2+ yükseltin
- Veya generated column'ları kaldırıp sadece normal index'leri kullanın

## Migration Sırası

1. **İlk Kurulum:**
   ```bash
   # MySQL için
   mysql -u root -p mindcoach < database/migrations/001_create_users_table.sql
   
   # MariaDB için
   mysql -u root -p mindcoach < database/migrations/001_create_users_table_mariadb.sql
   ```

2. **Ek Indexler (Opsiyonel):**
   ```bash
   mysql -u root -p mindcoach < database/migrations/002_add_indexes.sql
   ```

## Generated Column Nedir?

Generated column, değeri otomatik olarak hesaplanan bir kolondur. MariaDB'de JSON field'ları index'lemek için kullanılır.

**Avantajları:**
- JSON field'ları hızlı bir şekilde index'lenebilir
- Query performansı artar
- JSON_EXTRACT kullanımına gerek kalmaz

**Dezavantajları:**
- Ekstra disk alanı kullanır (STORED column)
- MariaDB 10.2+ gerektirir

## Notlar

- Tüm migration dosyaları idempotent değildir (tekrar çalıştırılamaz)
- Migration'ları çalıştırmadan önce database backup alın
- Production ortamında dikkatli olun

