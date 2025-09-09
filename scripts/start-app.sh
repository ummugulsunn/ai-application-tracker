#!/bin/bash

# AI Application Tracker - Kolay Başlatma Scripti
echo "🚀 AI Application Tracker başlatılıyor..."

# Gerekli bağımlılıkları kontrol et
if [ ! -d "node_modules" ]; then
    echo "📦 Bağımlılıklar yükleniyor..."
    npm install
fi

# Production build oluştur
echo "🔨 Production build oluşturuluyor..."
npm run build

# Uygulamayı başlat
echo "✅ Uygulama başlatılıyor - http://localhost:3000"
npm start