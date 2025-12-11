#!/bin/bash

# Database Initialization Script

echo "🐘 DVerse-AI Database Setup"
echo "=========================="

# Check for psql
if ! command -v psql &> /dev/null; then
    echo "❌ Error: PostgreSQL is not found in your PATH."
    echo ""
    echo "Please install PostgreSQL using one of these methods:"
    echo "1. Homebrew (Recommended): brew install postgresql@15"
    echo "2. Postgres.app: https://postgresapp.com/"
    echo ""
    echo "After installing, make sure 'psql' is available in your terminal."
    exit 1
fi

echo "✅ PostgreSQL found!"

# Check connection
echo "🔄 Checking database connection..."
if ! psql postgres -c "\q" 2>/dev/null; then
    echo "❌ Error: Could not connect to PostgreSQL server."
    echo "Make sure the server is running."
    echo "If using Homebrew: brew services start postgresql@15"
    exit 1
fi

# Create Database
echo "🛠 Creating database 'dverse_ai'..."
if psql -lqt | cut -d \| -f 1 | grep -qw dverse_ai; then
    echo "⚠️  Database 'dverse_ai' already exists."
else
    createdb dverse_ai
    echo "✅ Database created successfully."
fi

# Apply Schema
echo "📄 Applying schema..."
if [ -f "backend/schema.sql" ]; then
    psql -d dverse_ai -f backend/schema.sql
    echo "✅ Schema applied successfully."
else
    echo "❌ Error: backend/schema.sql not found."
    exit 1
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your database credentials:"
echo "   DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/dverse_ai"
echo ""
