#!/bin/bash

echo "🚀 Desktop uygulaması oluşturuluyor..."

# Next.js uygulamasını build et
echo "📦 Web uygulaması build ediliyor..."
npm run build

# Electron uygulamasını build et
echo "🖥️ Desktop uygulaması paketleniyor..."
cd electron
npm run dist

echo "✅ Desktop uygulaması hazır! electron/dist/ klasöründe bulabilirsiniz."
echo "💡 Kurulum dosyasını çalıştırarak uygulamayı yükleyebilirsiniz."