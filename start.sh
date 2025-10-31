#!/bin/bash

# TaskMaster - Quick Start Script

echo "🚀 TaskMaster - Starting setup..."

# Start PostgreSQL in Docker
echo "📦 Starting PostgreSQL container..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Setup backend
echo "🔧 Setting up backend..."
cd backend
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env 2>/dev/null || echo "DATABASE_URL=\"postgresql://taskmaster:taskmaster@localhost:5432/taskmaster?schema=public\"" > .env
    echo "PORT=3001" >> .env
    echo "NODE_ENV=development" >> .env
fi

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    bun install
fi

echo "Generating Prisma client..."
bun run db:generate

echo "Pushing database schema..."
bun run db:push

echo "✅ Backend setup complete!"
echo ""
echo "To start the backend, run: cd backend && bun run dev"
echo ""

# Setup frontend
cd ../frontend
echo "🎨 Setting up frontend..."

if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "VITE_API_URL=http://localhost:3001" > .env
fi

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    bun install
fi

echo "✅ Frontend setup complete!"
echo ""
echo "📝 Summary:"
echo "  - PostgreSQL is running in Docker"
echo "  - Backend dependencies installed"
echo "  - Frontend dependencies installed"
echo ""
echo "To start the application:"
echo "  1. Terminal 1: cd backend && bun run dev"
echo "  2. Terminal 2: cd frontend && bun run dev"
echo ""
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"

