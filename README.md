# 🚀 Plastik Enjeksiyon ERP Sistemi - Kurulum Rehberi

## 📋 Gereksinimler

- Node.js 18+ (önerilen: 20+)
- PostgreSQL 15+
- Redis (opsiyonel ama önerilen)
- Git
- Docker (opsiyonel - production deployment için)

## 🎯 Hızlı Başlangıç

### 1. PostgreSQL Kurulumu ve Veritabanı Oluşturma

```bash
# PostgreSQL yükleyin (macOS)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# Veritabanı oluşturun
createdb erp_db

# Kullanıcı oluşturun
psql -d postgres -c "CREATE USER erp_user WITH PASSWORD 'your_password';"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE erp_db TO erp_user;"
```

### 2. Redis Kurulumu (Opsiyonel)

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
```

### 3. Backend Kurulumu

```bash
cd backend

# Dependencies kurulumu
npm install

# Environment dosyasını oluşturun
cp .env.example .env

# .env dosyasını düzenleyin:
# DATABASE_URL="postgresql://erp_user:your_password@localhost:5432/erp_db"
# JWT_SECRET="güçlü-bir-secret-key-buraya"

# Prisma migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed data (opsiyonel - demo veriler)
npm run prisma:seed

# Development server'ı başlatın
npm run dev
```

Backend şimdi http://localhost:3000 adresinde çalışıyor!

### 4. Frontend Kurulumu

```bash
cd frontend

# Dependencies kurulumu
npm install

# Environment dosyası
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Development server
npm run dev
```

Frontend şimdi http://localhost:3001 adresinde çalışıyor!

## 🔧 Production Deployment (Docker)

### Docker ile Tüm Sistemi Çalıştırma

```bash
# Ana dizinde (erp-system/)
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Durdurma
docker-compose down
```

## 📊 İlk Giriş

### Default Admin Kullanıcısı

```
Username: admin
Password: admin123
```

**ÖNEMLİ:** İlk girişten sonra şifrenizi değiştirin!

## 🗄️ Veritabanı Yönetimi

### Prisma Studio (GUI Database Browser)

```bash
cd backend
npx prisma studio
```

http://localhost:5555 adresinde veritabanınızı görsel olarak yönetebilirsiniz.

### Migrations

```bash
# Yeni migration oluşturma
npx prisma migrate dev --name migration_name

# Production migration
npx prisma migrate deploy

# Migration durumunu kontrol etme
npx prisma migrate status
```

## 🧪 Test

```bash
# Backend testleri
cd backend
npm test

# Frontend testleri
cd frontend
npm test
```

## 📈 Monitoring & Logging

### Log Dosyaları

Backend logları `backend/logs/` klasöründe saklanır:
- `combined.log` - Tüm loglar
- `error.log` - Sadece hatalar

### Real-time Monitoring

WebSocket bağlantısı ile gerçek zamanlı sistem durumu:
- Makine durumları
- İş emri ilerlemeleri
- Stok uyarıları
- Bildirimler

## 🔐 Güvenlik

### Production İçin Önemli:

1. **JWT_SECRET değiştirin**
   ```bash
   # Güçlü random key oluşturun
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **CORS ayarlarını yapın**
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Rate limiting aktif**
   - API: 100 request / 15 dakika
   - Login: 5 deneme / 15 dakika

4. **HTTPS kullanın** (production)

## 🌍 Çok Dilli Kullanım

Sistem Türkçe ve İngilizce dillerini destekler:

```typescript
// Kullanıcı profili güncellemesi
PUT /api/auth/me
{
  "languagePreference": "en" // veya "tr"
}
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - Giriş
- `POST /api/auth/refresh` - Token yenileme
- `GET /api/auth/me` - Mevcut kullanıcı

### Products & BOM
- `GET /api/products` - Ürün listesi
- `GET /api/products/:id/bom/tree` - BOM ağacı
- `POST /api/products/:id/bom/explode` - BOM patlatma

### Inventory (FIFO)
- `GET /api/inventory/lots` - Lot listesi
- `POST /api/inventory/consume` - Stok tüketimi (FIFO)
- `GET /api/inventory/aging` - Yaşlanan stoklar

### Work Orders
- `GET /api/work-orders` - İş emirleri
- `POST /api/work-orders` - Yeni iş emri
- `POST /api/work-orders/:id/record-production` - Üretim kaydı

### Machines
- `GET /api/machines` - Makine listesi
- `GET /api/machines/:id/utilization` - Doluluk oranı

### Capacity
- `GET /api/capacity/overview` - Genel kapasite durumu
- `POST /api/capacity/calculate` - Kapasite hesaplama

Daha fazlası için: `backend/src/core/server.ts` dosyasına bakın.

## 🐛 Sorun Giderme

### Port Zaten Kullanımda

```bash
# Port 3000'i kullanan process'i bulun
lsof -i :3000

# Process'i sonlandırın
kill -9 <PID>
```

### Prisma Migration Hataları

```bash
# Migration'ları sıfırlama (DİKKAT: Tüm veri silinir!)
npx prisma migrate reset

# Yeniden başlatma
npx prisma migrate dev
```

### WebSocket Bağlantı Hatası

Frontend `.env.local` dosyasını kontrol edin:
```
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

## 📚 Dokümantasyon

- [Backend API Docs](./docs/api.md)
- [Frontend Components](./docs/components.md)
- [Database Schema](./docs/schema.md)
- [FIFO Algorithm](./docs/fifo.md)
- [BOM Structure](./docs/bom.md)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - Detaylar için `LICENSE` dosyasına bakın.

## 💡 İpuçları

### Performance Optimization

1. **Redis Cache kullanın**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

2. **Database connection pooling**
   - Prisma default: 10 connection
   - Yüksek trafik için artırın

3. **Index'leri optimize edin**
   ```sql
   CREATE INDEX CONCURRENTLY idx_custom ON table_name(column);
   ```

### Development

```bash
# Backend & Frontend'i birlikte çalıştırma
npm run dev:all

# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format
```

## 📞 Destek

Sorularınız için:
- GitHub Issues: [Issues](https://github.com/yourrepo/issues)
- Email: support@yourcompany.com
- Documentation: [Docs](https://docs.yourcompany.com)

---

**Hazırlayan:** ERP Development Team
**Versiyon:** 1.0.0
**Tarih:** 2024
