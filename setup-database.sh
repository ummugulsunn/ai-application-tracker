#!/bin/bash

echo "🚀 Setting up AI Application Tracker Database..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL server is not running on localhost:5432"
    echo "Please start your PostgreSQL server first:"
    echo "  - On macOS with Homebrew: brew services start postgresql"
    echo "  - On Ubuntu/Debian: sudo systemctl start postgresql"
    echo "  - Or start your PostgreSQL app/service"
    exit 1
fi

echo "✅ PostgreSQL server is running"

# Check if database exists, create if not
if ! psql -h localhost -p 5432 -U ummugulsun -lqt | cut -d \| -f 1 | grep -qw myappdb; then
    echo "📦 Creating database 'myappdb'..."
    createdb -h localhost -p 5432 -U ummugulsun myappdb
    if [ $? -eq 0 ]; then
        echo "✅ Database 'myappdb' created successfully"
    else
        echo "❌ Failed to create database 'myappdb'"
        exit 1
    fi
else
    echo "✅ Database 'myappdb' already exists"
fi

# Run Prisma migration
echo "🔄 Running Prisma migration..."
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully"
    echo "🎉 Authentication setup is now complete!"
    echo ""
    echo "Next steps:"
    echo "1. Run 'npm run dev' to start the development server"
    echo "2. Visit http://localhost:3000/auth/register to create an account"
    echo "3. Test the authentication flow"
else
    echo "❌ Database migration failed"
    exit 1
fi