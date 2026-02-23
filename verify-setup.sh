#!/bin/bash

# Mailchimp to Bitrix24 Integration - Setup Verification Script
# This script verifies that your installation is complete and correctly configured

set +e  # Don't exit on error, just report them

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Mailchimp ↔ Bitrix24 Integration - Setup Verification    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Helper functions
check_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASS++))
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAIL++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARN++))
}

check_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

echo -e "${BLUE}1. SYSTEM REQUIREMENTS${NC}"
echo "─────────────────────────────────────────────────────────"

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  check_pass "Node.js installed: $NODE_VERSION"
else
  check_fail "Node.js not found - Install from https://nodejs.org/"
fi

# Check npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  check_pass "npm installed: $NPM_VERSION"
else
  check_fail "npm not found"
fi

# Check git
if command -v git &> /dev/null; then
  check_pass "Git installed"
else
  check_warn "Git not installed (optional, for version control)"
fi

echo ""
echo -e "${BLUE}2. PROJECT FILES${NC}"
echo "─────────────────────────────────────────────────────────"

# Check critical files
FILES=(
  "server.js"
  "package.json"
  "routes/mailchimp.js"
  "services/bitrixService.js"
  "utils/logger.js"
  ".env.example"
  "README.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    check_pass "File exists: $file"
  else
    check_fail "File missing: $file"
  fi
done

echo ""
echo -e "${BLUE}3. DEPENDENCIES${NC}"
echo "─────────────────────────────────────────────────────────"

if [ -d "node_modules" ]; then
  check_pass "Dependencies installed (node_modules found)"
  
  # Check for critical packages
  PACKAGES=("express" "axios" "dotenv")
  for package in "${PACKAGES[@]}"; do
    if [ -d "node_modules/$package" ]; then
      check_pass "Package installed: $package"
    else
      check_fail "Package missing: $package (Run: npm install)"
    fi
  done
else
  check_fail "Dependencies not installed (Run: npm install)"
fi

echo ""
echo -e "${BLUE}4. ENVIRONMENT CONFIGURATION${NC}"
echo "─────────────────────────────────────────────────────────"

if [ -f ".env" ]; then
  check_pass "Environment file exists: .env"
  
  # Check for required variables
  source .env 2>/dev/null || true
  
  if [ -z "$MAILCHIMP_API_KEY" ] || [ "$MAILCHIMP_API_KEY" = "your_mailchimp_api_key_here" ]; then
    check_fail "MAILCHIMP_API_KEY not configured"
  else
    check_pass "MAILCHIMP_API_KEY configured"
  fi
  
  if [ -z "$BITRIX24_WEBHOOK_URL" ] || [[ "$BITRIX24_WEBHOOK_URL" == *"YOUR_ID"* ]]; then
    check_fail "BITRIX24_WEBHOOK_URL not configured"
  else
    check_pass "BITRIX24_WEBHOOK_URL configured"
  fi
  
  if [ -z "$MAILCHIMP_WEBHOOK_KEY" ] || [ "$MAILCHIMP_WEBHOOK_KEY" = "your_webhook_signing_key" ]; then
    check_warn "MAILCHIMP_WEBHOOK_KEY not configured (optional)"
  else
    check_pass "MAILCHIMP_WEBHOOK_KEY configured"
  fi
else
  check_fail "Environment file missing (.env)"
  check_info "Create it: cp .env.example .env"
fi

echo ""
echo -e "${BLUE}5. OPTIONAL TOOLS${NC}"
echo "─────────────────────────────────────────────────────────"

# Check for ngrok (useful for local testing)
if command -v ngrok &> /dev/null; then
  check_pass "ngrok installed (useful for testing webhooks locally)"
else
  check_info "ngrok not installed (optional, for local testing: https://ngrok.com)"
fi

# Check for curl
if command -v curl &> /dev/null; then
  check_pass "curl available (for testing endpoints)"
else
  check_warn "curl not found (useful for testing)"
fi

# Check for PM2 globally
if command -v pm2 &> /dev/null; then
  check_pass "PM2 installed globally (for production)"
else
  check_info "PM2 not installed (install with: npm install -g pm2)"
fi

echo ""
echo -e "${BLUE}6. PORT AVAILABILITY${NC}"
echo "─────────────────────────────────────────────────────────"

PORT=${PORT:-3000}

if command -v lsof &> /dev/null; then
  if ! lsof -i :$PORT &> /dev/null; then
    check_pass "Port $PORT is available"
  else
    check_warn "Port $PORT appears to be in use"
  fi
else
  check_info "Cannot check port availability (lsof not available)"
fi

echo ""
echo -e "${BLUE}7. DIRECTORY STRUCTURE${NC}"
echo "─────────────────────────────────────────────────────────"

DIRS=("routes" "services" "utils")
for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    check_pass "Directory exists: $dir/"
  else
    check_fail "Directory missing: $dir/"
  fi
done

echo ""
echo -e "${BLUE}8. SYNTAX CHECK${NC}"
echo "─────────────────────────────────────────────────────────"

# Check JavaScript syntax
if command -v node &> /dev/null; then
  if node -c server.js 2>/dev/null; then
    check_pass "server.js syntax valid"
  else
    check_fail "server.js has syntax errors"
  fi
  
  if node -c routes/mailchimp.js 2>/dev/null; then
    check_pass "routes/mailchimp.js syntax valid"
  else
    check_fail "routes/mailchimp.js has syntax errors"
  fi
else
  check_info "Cannot check syntax (Node.js not available)"
fi

echo ""
echo -e "${BLUE}9. GIT CONFIGURATION${NC}"
echo "─────────────────────────────────────────────────────────"

if [ -f ".gitignore" ]; then
  check_pass ".gitignore file exists"
  
  if grep -q "\.env" ".gitignore"; then
    check_pass ".env is in .gitignore (secrets protected)"
  else
    check_warn ".env not in .gitignore (security risk!)"
  fi
else
  check_warn ".gitignore not found"
fi

echo ""
echo -e "${BLUE}10. DOCUMENTATION${NC}"
echo "─────────────────────────────────────────────────────────"

DOCS=("README.md" "QUICK_START.md" "DEPLOYMENT.md")
for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    check_pass "Documentation found: $doc"
  else
    check_warn "Documentation missing: $doc"
  fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION SUMMARY                    ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo -e "║ ${GREEN}✓ Passed${NC}:  $PASS"
echo -e "║ ${RED}✗ Failed${NC}:  $FAIL"
echo -e "║ ${YELLOW}⚠ Warnings${NC}: $WARN"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ Setup verification passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Start the server:        npm run dev"
  echo "2. Test the endpoint:       curl http://localhost:3000/health"
  echo "3. Read the documentation: cat QUICK_START.md"
  echo ""
else
  echo -e "${RED}✗ Setup has issues that need to be resolved${NC}"
  echo ""
  echo "Issues to fix:"
  if [ $FAIL -gt 0 ]; then
    echo "- Review the failed checks above"
    echo "- Run: npm install"
    echo "- Configure: .env file"
  fi
  echo ""
fi

# Exit with error if critical failures
exit $FAIL
