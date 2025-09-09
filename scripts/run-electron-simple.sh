#!/bin/bash

echo "🖥️ Electron Desktop Uygulaması"
echo "================================"

# Web sunucusunun çalışıp çalışmadığını kontrol et
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "📡 Web sunucusu başlatılıyor..."
    npm run dev &
    WEB_PID=$!
    
    echo "⏳ Web sunucusu hazırlanıyor (10 saniye)..."
    sleep 10
else
    echo "✅ Web sunucusu zaten çalışıyor"
fi

# Electron'u başlat
echo "🚀 Desktop uygulaması açılıyor..."
cd electron
NODE_ENV=development npm start

# Temizlik (eğer biz başlattıysak)
if [ ! -z "$WEB_PID" ]; then
    echo "🧹 Web sunucusu kapatılıyor..."
    kill $WEB_PID 2>/dev/null
fi