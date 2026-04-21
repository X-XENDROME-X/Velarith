#!/usr/bin/env bash
#
# Velarith backend warmup — wake the Render free-tier instance and prime the
# TTL caches before a demo. Usage:
#
#   npm run warmup                                  # uses .env.local or defaults
#   BACKEND_URL=https://... npm run warmup          # override
#   bash scripts/warmup.sh https://api.example.com  # positional override
#
# Hits the endpoints that /dashboard, /markets, and /research read on first
# paint. Total wall time after a cold start: ~45–75s (most of it is Claude
# priming /ai/daily-brief). After a warm start: ~2–4s.

set -uo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

# Source .env.local if it exists so NEXT_PUBLIC_BACKEND_URL is picked up.
if [[ -f ".env.local" ]]; then
  # shellcheck disable=SC1091
  set -a; source .env.local; set +a
fi

BACKEND_URL="${1:-${BACKEND_URL:-${NEXT_PUBLIC_BACKEND_URL:-http://localhost:10000}}}"
BACKEND_URL="${BACKEND_URL%/}"  # strip trailing slash

# Sample slug + ticker — cheap enough that warming them primes the AI cache.
SAMPLE_SLUG="${WARMUP_SLUG:-will-donald-trump-win-the-2024-us-presidential-election}"
SAMPLE_TICKER="${WARMUP_TICKER:-AAPL}"

# Endpoint list: path · max-seconds-before-we-flag-slow
ENDPOINTS=(
  "/health|5"
  "/polymarket/trending?limit=8|15"
  "/polymarket/movers?limit=4|15"
  "/polymarket/categories|10"
  "/ai/daily-brief|45"
  "/polymarket/market/${SAMPLE_SLUG}|15"
  "/polymarket/market/${SAMPLE_SLUG}/history?interval=1w|15"
  "/ai/market-take/${SAMPLE_SLUG}|30"
  "/polymarket/market/${SAMPLE_SLUG}/related-tickers|30"
  "/technical/${SAMPLE_TICKER}|10"
  "/fundamental/${SAMPLE_TICKER}|10"
  "/sentiment/${SAMPLE_TICKER}|10"
  "/analysis/score/${SAMPLE_TICKER}|10"
)

printf "${BLUE}Velarith warmup${NC} → ${DIM}%s${NC}\n" "$BACKEND_URL"
printf "${DIM}%s endpoints — cold start may take up to 30s on the first hit.${NC}\n\n" "${#ENDPOINTS[@]}"

ok=0
slow=0
failed=0
start_total=$(date +%s)

for entry in "${ENDPOINTS[@]}"; do
  path="${entry%|*}"
  threshold="${entry#*|}"
  label="${path%%\?*}"

  printf "  ${DIM}→${NC} %-58s " "$label"

  start=$(date +%s.%N 2>/dev/null || date +%s)
  code=$(curl -sS -o /dev/null -w "%{http_code}" \
    --max-time 60 \
    --connect-timeout 10 \
    "${BACKEND_URL}${path}" 2>/dev/null || echo "000")
  end=$(date +%s.%N 2>/dev/null || date +%s)

  # Fall back to integer math if bc or %N isn't available (older bash).
  if command -v bc >/dev/null 2>&1; then
    elapsed=$(echo "$end - $start" | bc 2>/dev/null)
    elapsed_display=$(printf "%.1fs" "$elapsed")
    slow_flag=$(echo "$elapsed > $threshold" | bc 2>/dev/null)
  else
    elapsed=$(( ${end%.*} - ${start%.*} ))
    elapsed_display="${elapsed}s"
    slow_flag=$(( elapsed > threshold ? 1 : 0 ))
  fi

  if [[ "$code" =~ ^2 ]]; then
    if [[ "$slow_flag" == "1" ]]; then
      printf "${YELLOW}%s${NC} ${DIM}(%s, >%ss)${NC}\n" "$code" "$elapsed_display" "$threshold"
      slow=$((slow + 1))
    else
      printf "${GREEN}%s${NC} ${DIM}(%s)${NC}\n" "$code" "$elapsed_display"
    fi
    ok=$((ok + 1))
  else
    printf "${RED}%s${NC} ${DIM}(%s)${NC}\n" "$code" "$elapsed_display"
    failed=$((failed + 1))
  fi
done

end_total=$(date +%s)
total_elapsed=$((end_total - start_total))

printf "\n"
if [[ $failed -eq 0 && $slow -eq 0 ]]; then
  printf "${GREEN}✓ Backend warm${NC} — %s/%s endpoints OK in ${total_elapsed}s\n" "$ok" "${#ENDPOINTS[@]}"
elif [[ $failed -eq 0 ]]; then
  printf "${YELLOW}⚠ Backend warming${NC} — %s OK, %s slow (run again to re-check)\n" "$ok" "$slow"
else
  printf "${RED}✗ Backend issues${NC} — %s OK, %s slow, %s failed\n" "$ok" "$slow" "$failed"
  exit 1
fi
