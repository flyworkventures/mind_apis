# Token Management - Database'de Token Saklama

## Mevcut Durum

**Şu anki sistem:** Stateless JWT - Token'lar database'de saklanmıyor
- Token'lar sadece JWT_SECRET ile verify ediliyor
- Logout işlemi yok (token invalidate edilemiyor)
- Token'ları yönetmek mümkün değil

## Token Database'de Saklama (Opsiyonel)

Token'ları database'de saklamak için `user_tokens` tablosu oluşturulmuştur. Bu sayede:
- ✅ Logout işlemi yapılabilir (token invalidate)
- ✅ Tüm cihazlardan logout yapılabilir
- ✅ Token'lar yönetilebilir
- ✅ Token geçmişi tutulabilir

## Kurulum

### 1. Token Tablosunu Oluştur

```bash
mysql -u root -p mindcoach < database/migrations/003_create_user_tokens_table.sql
```

### 2. Token Repository Kullanımı

Token'lar otomatik olarak database'e kaydedilir (auth route'larında).

### 3. Logout Endpoint'leri

- `POST /auth/logout` - Mevcut token'ı revoke et
- `POST /auth/logout-all` - Tüm cihazlardan logout yap

## Avantajlar ve Dezavantajlar

### Stateless JWT (Mevcut - Token DB'de yok)

**Avantajlar:**
- ✅ Daha hızlı (database sorgusu yok)
- ✅ Daha basit
- ✅ Scalable (stateless)

**Dezavantajlar:**
- ❌ Logout yapılamaz (token invalidate edilemez)
- ❌ Token'ları yönetemezsiniz
- ❌ Tüm cihazlardan logout yapılamaz

### Stateful JWT (Token DB'de var)

**Avantajlar:**
- ✅ Logout yapılabilir
- ✅ Token'ları yönetebilirsiniz
- ✅ Tüm cihazlardan logout yapılabilir
- ✅ Token geçmişi tutulabilir

**Dezavantajlar:**
- ❌ Her istekte database sorgusu gerekir
- ❌ Daha yavaş
- ❌ Daha karmaşık

## Öneri

**Production için:** Token'ları database'de saklamak önerilir (güvenlik ve yönetim için).

**Development için:** Stateless JWT yeterli olabilir.

## Migration

Token tablosunu oluşturmak için:

```bash
# MariaDB için
mysql -u root -p mindcoach < database/migrations/003_create_user_tokens_table.sql
```

## Kullanım

Token'lar otomatik olarak database'e kaydedilir. Logout yapmak için:

```bash
POST /auth/logout
Authorization: Bearer <token>
```

Tüm cihazlardan logout:

```bash
POST /auth/logout-all
Authorization: Bearer <token>
```

