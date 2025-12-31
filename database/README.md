# Database Setup

## MySQL Database Kurulumu

### 1. Database Oluşturma

MySQL'de database oluşturun:

```sql
CREATE DATABASE mindcoach CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Migration Çalıştırma

`database/migrations/001_create_users_table.sql` dosyasını çalıştırın:

```bash
# MySQL CLI ile
mysql -u root -p mindcoach < database/migrations/001_create_users_table.sql

# Veya MySQL Workbench, phpMyAdmin gibi bir tool kullanarak
```

### 3. Environment Variables

`.env` dosyasına database bilgilerini ekleyin:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mindcoach

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
JWT_ISSUER=mindcoach-api
JWT_AUDIENCE=mindcoach-app
```

### 4. Test Connection

Server'ı başlattığınızda database bağlantısı otomatik test edilir:

```bash
npm start
```

Console'da `✅ MySQL database connected successfully` mesajını görmelisiniz.

## Database Schema

### Users Table

- `id` - Primary key (AUTO_INCREMENT)
- `credential` - Provider type (google, facebook, apple)
- `credential_data` - JSON field containing provider-specific data
- `username` - Unique username
- `gender` - ENUM (male, female, unknown)
- `profile_photo_url` - Profile photo URL
- `account_created_date` - Account creation timestamp
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

## Indexes

- `idx_credential` - On credential field
- `idx_username` - On username field
- `idx_created_at` - On account_created_date field
- `idx_credential_data` - On credential_data JSON field (MySQL 5.7+)

## Notes

- Database connection uses connection pooling for better performance
- JSON fields are used for flexible data storage
- All timestamps are stored in UTC

