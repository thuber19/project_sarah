#!/bin/bash
# Test-Script: Prüft ob alle Tabellen korrekt angelegt wurden
# Verwendung: bash supabase/test_schema.sh

set -euo pipefail

# Lade .env.local
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "FEHLER: .env.local nicht gefunden. Bitte im Projekt-Root ausführen."
  exit 1
fi

BASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    "${url}")

  if [ "$http_code" = "200" ]; then
    echo "  ✓ ${label}"
    PASS=$((PASS + 1))
  else
    echo "  ✗ ${label} (HTTP ${http_code})"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "=== Supabase Schema Test ==="
echo "URL: ${BASE_URL}"
echo ""

echo "--- Tabellen erreichbar (via REST API) ---"
check "business_profiles" "${BASE_URL}/rest/v1/business_profiles?limit=1"
check "icp_profiles"       "${BASE_URL}/rest/v1/icp_profiles?limit=1"
check "search_campaigns"   "${BASE_URL}/rest/v1/search_campaigns?limit=1"
check "leads"              "${BASE_URL}/rest/v1/leads?limit=1"
check "lead_scores"        "${BASE_URL}/rest/v1/lead_scores?limit=1"
check "agent_logs"         "${BASE_URL}/rest/v1/agent_logs?limit=1"

echo ""
echo "--- RLS: Anon-Key darf KEINE Daten sehen (erwartet 200 mit leerer Liste) ---"

check_rls() {
  local label="$1"
  local url="$2"
  local http_code
  local body
  body=$(curl -s -w "\n%{http_code}" \
    -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    "${url}")
  http_code=$(echo "$body" | tail -1)
  local data
  data=$(echo "$body" | head -1)

  if [ "$http_code" = "200" ] && [ "$data" = "[]" ]; then
    echo "  ✓ ${label}: RLS aktiv (leere Liste ohne Auth)"
    PASS=$((PASS + 1))
  elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    echo "  ✓ ${label}: RLS aktiv (${http_code})"
    PASS=$((PASS + 1))
  else
    echo "  ✗ ${label}: RLS Problem (HTTP ${http_code}, data=${data})"
    FAIL=$((FAIL + 1))
  fi
}

check_rls "business_profiles (RLS)" "${BASE_URL}/rest/v1/business_profiles?limit=1"
check_rls "leads (RLS)"             "${BASE_URL}/rest/v1/leads?limit=1"
check_rls "agent_logs (RLS)"        "${BASE_URL}/rest/v1/agent_logs?limit=1"

echo ""
echo "==========================="
echo "Ergebnis: ${PASS} bestanden, ${FAIL} fehlgeschlagen"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
