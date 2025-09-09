#!/bin/bash

echo "🚀 Desktop uygulaması development modunda başlatılıyor..."

# Web sunucusunu arka planda başlat
echo "📡 Web sunucusu başlatılıyor..."
npm run dev &
WEB_PID=$!

# Web sunucusunun başlamasını bekle
echo "⏳ Web sunucusu hazırlanıyor..."
sleep 5

# Electron uygulamasını başlat
echo "🖥️ Desktop uygulaması açılıyor..."
cd electron
NODE_ENV=development npm start

# Temizlik
echo "🧹 Temizlik yapılıyor..."
kill $WEB_PID 2>/dev/null