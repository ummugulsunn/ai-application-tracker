#!/bin/bash

# AI Application Tracker - Masaüstü Başlatıcı
# Bu dosyayı çift tıklayarak uygulamayı başlatabilirsiniz

# Script'in bulunduğu dizine git
cd "$(dirname "$0")"

echo "🚀 AI İş Başvuru Takipçisi başlatılıyor..."
echo "📍 Konum: $(pwd)"

# Port kontrolü
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 zaten kullanımda. Mevcut uygulamayı kapatıyor..."
    pkill -f "next"
    sleep 2
fi

# Bağımlılıkları kontrol et
if [ ! -d "node_modules" ]; then
    echo "📦 İlk kurulum - Bağımlılıklar yükleniyor..."
    npm install
fi

# Uygulamayı başlat
echo "🌐 Uygulama başlatılıyor..."
echo "📱 Tarayıcınızda http://localhost:3000 adresini açın"
echo "💡 PWA olarak yüklemek için tarayıcıdaki 'Yükle' butonuna tıklayın"
echo ""
echo "🛑 Uygulamayı durdurmak için Ctrl+C tuşlarına basın"

# Production modunda başlat
npm run build && npm start

# Alternatif: Development modunda başlatmak için yukarıdaki satırı şununla değiştirin:
# npm run dev