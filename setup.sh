#!/bin/bash

# Mailchimp to Bitrix24 Integration - Quick Start Script
# This script helps you set up the project quickly

set -e

echo "================================"
echo "Mailchimp ↔ Bitrix24 Integration"
echo "Quick Start Setup"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node -v)"
echo "✓ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Create .env file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  You need to configure your .env file:"
    echo "   - MAILCHIMP_API_KEY"
    echo "   - MAILCHIMP_LIST_ID"
    echo "   - MAILCHIMP_WEBHOOK_KEY"
    echo "   - BITRIX24_WEBHOOK_URL"
    echo ""
    echo "Edit .env with your credentials:"
    echo "   nano .env"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "================================"
echo "✓ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your credentials in .env file:"
echo "   nano .env"
echo ""
echo "2. Start the server:"
echo "   npm run dev"
echo ""
echo "3. Test the webhook health:"
echo "   curl http://localhost:3000/health"
echo ""
echo "4. Read the README for detailed setup:"
echo "   cat README.md"
echo ""
