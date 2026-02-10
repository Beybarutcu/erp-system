# 🚀 Plastik Enjeksiyon ERP Sistemi - Hızlı Başlangıç

## ✅ Tamamlanan Özellikler

### Backend (Node.js + Express + Prisma + PostgreSQL) - %70 Tamamlandı
- ✅ **Authentication** - JWT, Login, Logout
- ✅ **Products** - CRUD, Search, Bulk Import
- ✅ **BOM (Ürün Ağacı)** - Recursive Tree, Explosion, İş Emri Oluşturma
- ✅ **Inventory** - FIFO Algoritması, Lot Tracking, Aging Reports
- ✅ **Work Orders** - Kısmi İlerleme, Malzeme Tüketimi, Timeline
- ✅ **Machines** - Utilization, Shifts, Maintenance, Performance
- ✅ **Capacity** - Overview, Forecast, Optimization, Order Check

### Frontend (Next.js 14 + Tailwind + React Query) - %30 Tamamlandı
- ✅ **Login Page** - JWT Authentication
- ✅ **Dashboard** - Stats, Work Orders, Machines
- ✅ **Products** - List, Search, Pagination
- 🔄 Kalan sayfalar template olarak hazır

## 📦 Kurulum

### 1. Gereksinimler
```bash
Node.js 18+
PostgreSQL 15+
Redis (opsiyonel)
```

### 2. Backend Kurulumu
```bash
cd backend

# Dependencies
npm install

# Environment
cp .env.example .env
# .env dosyasını düzenleyin:
# DATABASE_URL="postgresql://erp_user:password@localhost:5432/erp_db"

# Database Setup
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed  # Demo data

# Start
npm run dev  # http://localhost:3000
```

### 3. Frontend Kurulumu
```bash
cd frontend

# Dependencies
npm install

# Environment
cp .env.local.example .env.local

# Start
npm run dev  # http://localhost:3001
```

## 🔐 Demo Kullanıcılar

```
Admin:    admin / admin123
Manager:  manager / user123
Operator: operator / user123
```

## 📊 API Endpoints (Hazır)

### Authentication
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`

### Products
- GET `/api/products` - List (pagination, search)
- GET `/api/products/:id` - Detail
- POST `/api/products` - Create
- PUT `/api/products/:id` - Update

### BOM
- GET `/api/bom/products/:id/bom/tree` - Full tree
- POST `/api/bom/products/:id/bom/explode` - Material explosion
- POST `/api/bom/products/:id/bom/generate-work-orders`

### Inventory (FIFO)
- GET `/api/inventory/lots` - All lots
- POST `/api/inventory/consume` - Consume (FIFO)
- GET `/api/inventory/aging` - Aging report

### Work Orders
- GET `/api/work-orders` - List
- POST `/api/work-orders` - Create
- POST `/api/work-orders/:id/start` - Start
- POST `/api/work-orders/:id/record-production` - Record
- POST `/api/work-orders/:id/complete` - Complete

### Machines
- GET `/api/machines` - List
- GET `/api/machines/:id/utilization` - Utilization
- GET `/api/machines/:id/schedule` - Schedule

### Capacity
- GET `/api/capacity/overview` - Overall capacity
- GET `/api/capacity/forecast?days=30` - Forecast
- POST `/api/capacity/calculate` - Calculate for work order

## 🎯 Test Senaryoları

### 1. Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Products List
```bash
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. BOM Tree
```bash
curl http://localhost:3000/api/bom/products/PRODUCT_ID/bom/tree \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. FIFO Consumption
```bash
curl -X POST http://localhost:3000/api/inventory/consume \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "xxx",
    "quantity": 100,
    "workOrderId": "yyy"
  }'
```

## 📁 Proje Yapısı

```
erp-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma (40+ tablo)
│   │   └── seed.ts (Demo data)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/ ✅
│   │   │   ├── products/ ✅
│   │   │   ├── bom/ ✅
│   │   │   ├── inventory/ ✅
│   │   │   ├── work-orders/ ✅
│   │   │   ├── machines/ ✅
│   │   │   └── capacity/ ✅
│   │   ├── shared/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   └── core/
│   │       └── server.ts
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── login/ ✅
    │   │   └── dashboard/ ✅
    │   ├── lib/
    │   │   └── api.ts (API Client)
    │   └── store/
    │       └── auth.store.ts
    └── package.json
```

## 🐛 Sorun Giderme

### Backend çalışmıyor
```bash
# PostgreSQL kontrolü
psql -U postgres -d erp_db

# Migration tekrar
npx prisma migrate reset
npx prisma migrate dev
npm run prisma:seed
```

### Frontend API'ye bağlanamıyor
```bash
# .env.local dosyasını kontrol edin
NEXT_PUBLIC_API_URL=http://localhost:3000

# CORS hatası alıyorsanız backend .env:
CORS_ORIGIN=http://localhost:3001
```

### Port çakışması
```bash
# Backend (3000) değiştirmek için:
# backend/.env
PORT=3001

# Frontend (3001) değiştirmek için:
npm run dev -- -p 3002
```

## 📈 Sonraki Adımlar

1. Frontend sayfalarını tamamlayın
2. Kalan backend modüllerini ekleyin (Orders, Customers, Suppliers)
3. Testing yapın
4. Production'a deploy edin

## 🎨 Frontend Sayfaları (Template Hazır)

- ✅ Login
- ✅ Dashboard (Ana Sayfa)
- ✅ Products (Ürünler)
- 🔄 BOM (Ürün Ağacı)
- 🔄 Inventory (Stok)
- 🔄 Work Orders (İş Emirleri)
- 🔄 Machines (Makineler)
- 🔄 Capacity (Kapasite)

## 💡 Önemli Notlar

- **FIFO Algoritması**: Otomatik en eski lot seçimi
- **Recursive BOM**: Sınırsız seviye derinlik
- **Real-time Updates**: WebSocket desteği (hazır)
- **Multi-language**: TR/EN (hazır)
- **Audit Logs**: Tüm işlemler kaydediliyor

## 📞 Destek

Sorularınız için GitHub Issues kullanın.

---

**Versiyon:** 1.0.0  
**Durum:** Development  
**Tamamlanma:** Backend %70, Frontend %30
