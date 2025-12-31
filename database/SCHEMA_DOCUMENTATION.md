# Database Schema Documentation

## Users Table

Bu tablo Flutter'daki `UserModel` ile tam uyumlu olacak şekilde tasarlanmıştır.

### Tablo Yapısı

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | Primary key |
| `credential` | VARCHAR(50) | NO | - | Provider type: 'google', 'facebook', 'apple' |
| `credential_data` | JSON | NO | - | Provider-specific data (providerId, email, id) |
| `username` | VARCHAR(255) | NO | - | Unique username |
| `native_lang` | VARCHAR(10) | YES | NULL | Native language code (e.g., 'tr', 'en') |
| `gender` | ENUM | NO | 'unknown' | Gender: 'male', 'female', 'unknown' |
| `profile_photo_url` | VARCHAR(500) | YES | NULL | Profile photo URL |
| `answer_data` | JSON | YES | NULL | QuestionAnswers object |
| `last_psychological_profile` | TEXT | YES | NULL | Son psikolojik profili |
| `psychological_profile_based_on_messages` | TEXT | YES | NULL | Mesajlara dayalı psikolojik profil |
| `general_profile` | TEXT | YES | NULL | Genel profil |
| `general_psychological_profile` | TEXT | YES | NULL | Genel psikolojik profil |
| `user_agent_notes` | JSON | YES | NULL | AI notları (List formatında) |
| `least_sessions` | JSON | YES | NULL | Least sessions data (List formatında) |
| `account_created_date` | DATETIME | NO | CURRENT_TIMESTAMP | Hesap oluşturulma tarihi |
| `created_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Kayıt oluşturulma zamanı |
| `updated_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Kayıt güncellenme zamanı |

### Indexes

1. **idx_credential** - `credential` field üzerinde
2. **idx_username** - `username` field üzerinde (unique)
3. **idx_account_created_date** - `account_created_date` field üzerinde
4. **idx_gender** - `gender` field üzerinde
5. **idx_credential_data** - `credential_data->>'$.id'` JSON path üzerinde
6. **idx_credential_email** - `credential_data->>'$.email'` JSON path üzerinde

### Unique Constraints

- `uk_username` - Username unique olmalı

## JSON Field Yapıları

### credential_data

```json
{
  "providerId": "google",
  "email": "user@example.com",
  "id": "google_user_id_123456"
}
```

### answer_data (QuestionAnswers)

```json
{
  "avaibleDays": ["monday", "tuesday", "wednesday"],
  "avaibleHours": ["09:00", "10:00", "14:00"],
  "supportArea": "anxiety",
  "agentSpeakStyle": "supportive"
}
```

**Not:** `avaibleDays` ve `avaibleHours` dynamic olduğu için farklı formatlarda olabilir:
- Array: `["monday", "tuesday"]`
- String: `"weekdays"`
- Object: `{"weekdays": true, "weekends": false}`

### user_agent_notes

```json
[
  {
    "sessionId": 1,
    "note": "User showed improvement in anxiety management",
    "date": "2024-01-01T10:00:00Z",
    "agent": "AI Consultant"
  },
  {
    "sessionId": 2,
    "note": "Follow up needed on stress management",
    "date": "2024-01-02T14:00:00Z",
    "agent": "AI Consultant"
  }
]
```

### least_sessions

```json
[1, 2, 3, 4, 5]
```

veya

```json
[
  {"sessionId": 1, "date": "2024-01-01"},
  {"sessionId": 2, "date": "2024-01-02"}
]
```

## Flutter UserModel Mapping

| Flutter Field | Database Column | Notes |
|---------------|-----------------|-------|
| `id` | `id` | Direct mapping |
| `credential` | `credential` | Direct mapping |
| `credentialData` | `credential_data` | JSON field |
| `username` | `username` | Direct mapping |
| `nativeLang` | `native_lang` | Direct mapping |
| `gender` | `gender` | ENUM: male, female, unknown |
| `answerData` | `answer_data` | JSON field (QuestionAnswers) |
| `lastPsychologicalProfile` | `last_psychological_profile` | TEXT field |
| `userAgentNotes` | `user_agent_notes` | JSON array |
| `leastSessions` | `least_sessions` | JSON array |
| `psychologicalProfileBasedOnMessages` | `psychological_profile_based_on_messages` | TEXT field |
| `accountCreatedDate` | `account_created_date` | DATETIME, ISO 8601 format |
| `generalProfile` | `general_profile` | TEXT field |
| `generalPsychologicalProfile` | `general_psychological_profile` | TEXT field |
| `profilePhotoUrl` | `profile_photo_url` | VARCHAR(500) |

## Query Örnekleri

### Kullanıcı Bulma (Provider'a göre)

```sql
SELECT * FROM users 
WHERE credential = 'google' 
AND JSON_EXTRACT(credential_data, '$.id') = 'google_user_id_123';
```

### Kullanıcı Bulma (Email'e göre)

```sql
SELECT * FROM users 
WHERE JSON_EXTRACT(credential_data, '$.email') = 'user@example.com';
```

### QuestionAnswers Güncelleme

```sql
UPDATE users 
SET answer_data = JSON_OBJECT(
  'avaibleDays', JSON_ARRAY('monday', 'tuesday'),
  'avaibleHours', JSON_ARRAY('09:00', '10:00'),
  'supportArea', 'anxiety',
  'agentSpeakStyle', 'supportive'
)
WHERE id = 1;
```

### UserAgentNotes Ekleme

```sql
UPDATE users 
SET user_agent_notes = JSON_ARRAY_APPEND(
  COALESCE(user_agent_notes, JSON_ARRAY()),
  '$',
  JSON_OBJECT(
    'sessionId', 1,
    'note', 'New note',
    'date', NOW()
  )
)
WHERE id = 1;
```

## Migration Sırası

1. `001_create_users_table.sql` - Ana tablo yapısı
2. `002_add_indexes.sql` - Ek indexler (opsiyonel)

## Notlar

- MySQL 5.7+ gerektirir (JSON field desteği için)
- UTF8MB4 charset kullanılıyor (emoji ve özel karakterler için)
- Tüm timestamps UTC formatında
- JSON fields için index'ler MySQL 5.7+ gerektirir
- `answer_data` field'ı NULL olabilir (ilk kayıtta)

## Sorun Giderme

### JSON Index Hatası

Eğer `idx_credential_data` index'i oluşturulurken hata alırsanız, MySQL versiyonunuz 5.7'den eski olabilir. Bu durumda index'i yorum satırı yapabilirsiniz.

### Character Set Hatası

Eğer emoji veya özel karakterler sorun çıkarıyorsa, tablonun `utf8mb4` charset kullandığından emin olun.

