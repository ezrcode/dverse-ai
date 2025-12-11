#!/bin/bash

# DVerse-AI Quick Start Script

echo "🔮 DVerse-AI Setup"
echo "=================="
echo ""

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Create database
echo "📊 Creating database..."
createdb dverse_ai 2>/dev/null || echo "Database already exists"

# Backend setup
echo ""
echo "🔧 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update backend/.env with your actual credentials:"
    echo "   - GEMINI_API_KEY"
    echo "   - DATABASE_URL (if different)"
    echo "   - ENCRYPTION_KEY (generate a secure 32-character key)"
fi

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Frontend setup
echo ""
echo "🎨 Setting up frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. In one terminal: cd backend && npm run start:dev"
echo "2. In another terminal: cd frontend && npm run dev"
echo ""
echo "Then visit http://localhost:3000"
echo ""
echo "Don't forget to:"
echo "- Update backend/.env with your Gemini API key"
echo "- Configure your D365 environment in the app"
