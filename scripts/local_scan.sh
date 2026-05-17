#!/usr/bin/env bash
# scripts/local_scan.sh
# Run SAST + DAST locally using Docker
# Usage: bash scripts/local_scan.sh

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

log()     { echo -e "${BLUE}[$(date '+%H:%M:%S')]${RESET} $*"; }
success() { echo -e "${GREEN}✔  $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠  $*${RESET}"; }
error()   { echo -e "${RED}✖  $*${RESET}"; }
header()  { echo -e "\n${BOLD}$*${RESET}\n"; }

header "═══════════════════════════════════════"
header "  DevSecOps Local Security Scan"
header "═══════════════════════════════════════"

# ── Step 1: Run tests + generate coverage ────────────────────────────────────
header "STEP 1 — Running tests + coverage"
cd app
npm ci --silent
npm run test:ci
cd ..
success "Tests passed, coverage generated"

# ── Step 2: Start SonarQube ───────────────────────────────────────────────────
header "STEP 2 — Starting SonarQube (takes ~60 seconds)"
docker compose up -d sonarqube

log "Waiting for SonarQube to be ready..."
for i in $(seq 1 20); do
  STATUS=$(curl -s http://localhost:9000/api/system/status 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
  if [ "$STATUS" = "UP" ]; then
    success "SonarQube is ready"
    break
  fi
  log "Waiting... attempt $i/20"
  sleep 10
done

# ── Step 3: Run SonarQube scan ───────────────────────────────────────────────
header "STEP 3 — Running SAST with SonarQube"
warn "First time: log into http://localhost:9000 (admin/admin) and create a token"
warn "Then run: export SONAR_TOKEN=your_token"

if [ -z "${SONAR_TOKEN:-}" ]; then
  warn "SONAR_TOKEN not set — skipping SonarQube scan"
  warn "Set it with: export SONAR_TOKEN=your_token_here"
else
  docker run --rm \
    --network host \
    -v "$(pwd):/usr/src" \
    -e SONAR_HOST_URL="http://localhost:9000" \
    -e SONAR_TOKEN="$SONAR_TOKEN" \
    sonarsource/sonar-scanner-cli \
    -Dsonar.projectKey=devsecops-demo \
    -Dsonar.sources=app \
    -Dsonar.javascript.lcov.reportPaths=app/coverage/lcov.info \
    -Dsonar.exclusions="**/node_modules/**,**/coverage/**"
  success "SonarQube scan complete — open http://localhost:9000 to view results"
fi

# ── Step 4: Start app + run OWASP ZAP ───────────────────────────────────────
header "STEP 4 — Running DAST with OWASP ZAP"
docker compose up -d app

log "Waiting for app to be ready..."
for i in $(seq 1 10); do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
  [ "$HTTP" = "200" ] && break
  sleep 3
done
success "App is running on http://localhost:3000"

log "Running OWASP ZAP baseline scan..."
docker run --rm \
  --network host \
  -v "$(pwd):/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html \
  -l WARN || true

success "ZAP scan complete — open zap-report.html to view results"

header "═══════════════════════════════════════"
header "  Scan Complete!"
echo "  SonarQube dashboard: http://localhost:9000"
echo "  ZAP report:          $(pwd)/zap-report.html"
header "═══════════════════════════════════════"