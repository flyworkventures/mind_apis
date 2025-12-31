# MindCoach API

MindCoach mobil uygulaması için authentication API servisi.

## Özellikler

- ✅ Google OAuth Authentication
- ✅ Facebook OAuth Authentication  
- ✅ Apple Sign In Authentication
- ✅ Flutter UserModel ile uyumlu response formatı
- ✅ Request validation middleware
- ✅ Error handling middleware
- ✅ CORS desteği

## Hızlı Başlangıç

### 1. Dependencies Yükleme

```bash
npm install
```

### 2. Environment Variables

Proje root'unda `.env` dosyası oluşturun:

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
FACEBOOK_APP_ID=your_facebook_app_id
APPLE_TEAM_ID=your_apple_team_id
```

### 3. Server'ı Başlatma

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server `http://localhost:3000` adresinde çalışacaktır.

## API Endpoints

### Authentication

- `POST /auth/google` - Google ile giriş
- `POST /auth/facebook` - Facebook ile giriş
- `POST /auth/apple` - Apple ile giriş
- `GET /auth/verify` - Token doğrulama

### Health Check

- `GET /health` - Server durumu

Detaylı API dokümantasyonu için:
- **HTML Dokümantasyon:** [docs/index.html](./docs/index.html) - İnteraktif, modern HTML/CSS dokümantasyon
- **Markdown Dokümantasyon:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Markdown formatında detaylı dokümantasyon

## Proje Yapısı

```
mc_apis/
├── app.js                    # Ana uygulama
├── routes/
│   └── auth.js              # Auth endpoints
├── models/
│   ├── User.js              # User model
│   ├── QuestionAnswers.js   # QuestionAnswers model
│   └── AuthRequest.js       # Auth request models
├── middleware/
│   ├── validation.js        # Request validation
│   └── errorHandler.js      # Error handling
├── services/
│   └── authService.js       # Auth business logic
├── docs/                     # HTML dokümantasyon
│   ├── index.html           # Ana dokümantasyon sayfası
│   ├── styles.css           # Stil dosyası
│   └── script.js            # JavaScript fonksiyonları
└── flutter_models/          # Flutter model referansları
```

## Geliştirme Notları

⚠️ **Önemli:** Şu anki implementasyon placeholder/mock'tur. Production'a geçmeden önce:

1. **Provider SDK Entegrasyonları:**
   - Google OAuth2 client implementasyonu (`google-auth-library`)
   - Facebook Graph API entegrasyonu
   - Apple JWT verification (`jwks-rsa`)

2. **Database Entegrasyonu:**
   - MongoDB veya PostgreSQL bağlantısı
   - User model için schema
   - Kullanıcı CRUD işlemleri

3. **JWT Token:**
   - Token oluşturma ve verify etme
   - Token refresh mekanizması

4. **Security:**
   - Rate limiting
   - Input sanitization
   - Environment variables güvenliği

Detaylar için `services/authService.js` dosyasındaki TODO yorumlarına bakın.

## Flutter Entegrasyonu

API, Flutter'daki `UserModel` ile tam uyumludur. Örnek kullanım için dokümantasyon dosyalarına bakın.

## Dokümantasyon

Proje, iki farklı formatta dokümantasyon içerir:

1. **HTML Dokümantasyon** (`docs/index.html`)
   - Modern, interaktif web arayüzü
   - Responsive tasarım
   - Kod kopyalama özelliği
   - Syntax highlighting
   - Smooth scroll navigation

2. **Markdown Dokümantasyon** (`API_DOCUMENTATION.md`)
   - GitHub'da kolayca görüntülenebilir
   - Markdown formatında detaylı açıklamalar

HTML dokümantasyonu görüntülemek için:
```bash
# Tarayıcıda aç
open docs/index.html

# Veya web sunucusu ile
cd docs && python -m http.server 8000
```

## Lisans

ISC

