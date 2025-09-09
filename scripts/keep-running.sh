#!/bin/bash

# AI Application Tracker - Sürekli Çalışır Mod
# Bu script uygulamayı arka planda sürekli çalışır halde tutar

APP_NAME="AI Application Tracker"
PORT=3000
LOG_FILE="app.log"

echo "🔄 $APP_NAME sürekli çalışır modda başlatılıyor..."

# Eski process'i temizle
pkill -f "next" 2>/dev/null

# Sürekli çalışır döngü
while true; do
    echo "$(date): Uygulama başlatılıyor..." >> $LOG_FILE
    
    # Production modunda başlat
    npm run build >> $LOG_FILE 2>&1
    npm start >> $LOG_FILE 2>&1 &
    
    APP_PID=$!
    echo "$(date): Uygulama başlatıldı (PID: $APP_PID)" >> $LOG_FILE
    echo "🌐 Uygulama çalışıyor: http://localhost:$PORT"
    
    # Process'in çalışıp çalışmadığını kontrol et
    wait $APP_PID
    
    echo "$(date): Uygulama durdu, 5 saniye sonra yeniden başlatılacak..." >> $LOG_FILE
    sleep 5
done