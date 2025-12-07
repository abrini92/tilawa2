#!/usr/bin/env bash
#
# Master validation script for Tilawa project.
# Runs all 5 validation scripts and reports overall status.
#
# Usage:
#   ./scripts/validate_all.sh
#
# Exit code 0 if all validations pass

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Box drawing characters
BOX_TL='╔'
BOX_TR='╗'
BOX_BL='╚'
BOX_BR='╝'
BOX_H='═'
BOX_V='║'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CORE_AI_DIR="$PROJECT_DIR/tilawa-core-ai"
APP_API_DIR="$PROJECT_DIR/tilawa-app-api"

# Results tracking
declare -a TEST_NAMES
declare -a TEST_RESULTS
declare -a TEST_TIMES

print_header() {
    local width=60
    local title="$1"
    local padding=$(( (width - ${#title} - 2) / 2 ))
    
    echo ""
    echo -e "${BOLD}${BOX_TL}$(printf '%*s' $width '' | tr ' ' "$BOX_H")${BOX_TR}${NC}"
    echo -e "${BOLD}${BOX_V}$(printf '%*s' $padding '')${title}$(printf '%*s' $((width - padding - ${#title})) '')${BOX_V}${NC}"
    echo -e "${BOLD}${BOX_BL}$(printf '%*s' $width '' | tr ' ' "$BOX_H")${BOX_BR}${NC}"
    echo ""
}

check_service() {
    local name=$1
    local url=$2
    local max_retries=3
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        ((retry++))
        sleep 1
    done
    return 1
}

run_test() {
    local name=$1
    local cmd=$2
    local dir=$3
    
    echo -e "${CYAN}Running: ${name}${NC}"
    echo -e "${CYAN}Command: ${cmd}${NC}"
    echo ""
    
    local start_time=$(date +%s)
    
    if [ -n "$dir" ]; then
        pushd "$dir" > /dev/null
    fi
    
    set +e
    eval "$cmd"
    local exit_code=$?
    set -e
    
    if [ -n "$dir" ]; then
        popd > /dev/null
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    TEST_NAMES+=("$name")
    TEST_TIMES+=("${duration}s")
    
    if [ $exit_code -eq 0 ]; then
        TEST_RESULTS+=("PASSED")
        echo -e "\n${GREEN}✓ ${name} PASSED (${duration}s)${NC}\n"
    else
        TEST_RESULTS+=("FAILED")
        echo -e "\n${RED}✗ ${name} FAILED (${duration}s)${NC}\n"
    fi
    
    return $exit_code
}

print_header "TILAWA VALIDATION SUITE"

echo -e "${BOLD}Project Directory:${NC} $PROJECT_DIR"
echo -e "${BOLD}Core AI Directory:${NC} $CORE_AI_DIR"
echo -e "${BOLD}App API Directory:${NC} $APP_API_DIR"
echo ""

# Check prerequisites
echo -e "${BOLD}Checking prerequisites...${NC}"
echo ""

# Check FastAPI
echo -n "  FastAPI (localhost:8000): "
if check_service "FastAPI" "http://localhost:8000/health"; then
    echo -e "${GREEN}✓ Running${NC}"
    FASTAPI_RUNNING=1
else
    echo -e "${YELLOW}⚠ Not running (some tests will be skipped)${NC}"
    FASTAPI_RUNNING=0
fi

# Check NestJS
echo -n "  NestJS (localhost:3000):  "
if check_service "NestJS" "http://localhost:3000"; then
    echo -e "${GREEN}✓ Running${NC}"
    NESTJS_RUNNING=1
else
    echo -e "${YELLOW}⚠ Not running (some tests will be skipped)${NC}"
    NESTJS_RUNNING=0
fi

# Check Redis
echo -n "  Redis (localhost:6379):   "
if command -v redis-cli &> /dev/null && redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
    REDIS_RUNNING=1
else
    echo -e "${YELLOW}⚠ Not running (BullMQ test will be skipped)${NC}"
    REDIS_RUNNING=0
fi

echo ""

# Run validations
print_header "RUNNING VALIDATIONS"

TOTAL_TESTS=5
PASSED_TESTS=0

# 1. Performance (faster-whisper benchmark)
echo -e "${BOLD}[1/5] Performance (faster-whisper)${NC}"
echo "─────────────────────────────────────────────────────────────"
PYTEST_CMD=".venv311/bin/python"
if [ ! -f "$CORE_AI_DIR/.venv311/bin/python" ]; then
    PYTEST_CMD="python3"
fi
if run_test "Performance (faster-whisper)" "$PYTEST_CMD scripts/benchmark_whisper.py" "$CORE_AI_DIR"; then
    ((PASSED_TESTS++))
fi

# 2. Observability (Prometheus)
echo -e "${BOLD}[2/5] Observability (Prometheus)${NC}"
echo "─────────────────────────────────────────────────────────────"
if [ $FASTAPI_RUNNING -eq 1 ]; then
    if run_test "Observability (Prometheus)" "$PYTEST_CMD scripts/test_prometheus.py" "$CORE_AI_DIR"; then
        ((PASSED_TESTS++))
    fi
else
    echo -e "${YELLOW}⚠ Skipped (FastAPI not running)${NC}"
    TEST_NAMES+=("Observability (Prometheus)")
    TEST_RESULTS+=("SKIPPED")
    TEST_TIMES+=("0s")
fi

# 3. Security (Rate Limiting)
echo -e "${BOLD}[3/5] Security (Rate Limiting)${NC}"
echo "─────────────────────────────────────────────────────────────"
if [ $NESTJS_RUNNING -eq 1 ]; then
    if run_test "Security (Rate Limiting)" "bash scripts/test_rate_limit.sh" "$APP_API_DIR"; then
        ((PASSED_TESTS++))
    fi
else
    echo -e "${YELLOW}⚠ Skipped (NestJS not running)${NC}"
    TEST_NAMES+=("Security (Rate Limiting)")
    TEST_RESULTS+=("SKIPPED")
    TEST_TIMES+=("0s")
fi

# 4. Scalability (BullMQ)
echo -e "${BOLD}[4/5] Scalability (BullMQ)${NC}"
echo "─────────────────────────────────────────────────────────────"
if [ $NESTJS_RUNNING -eq 1 ] && [ $REDIS_RUNNING -eq 1 ]; then
    if run_test "Scalability (BullMQ)" "npx ts-node scripts/test_bullmq.ts" "$APP_API_DIR"; then
        ((PASSED_TESTS++))
    fi
else
    echo -e "${YELLOW}⚠ Skipped (NestJS or Redis not running)${NC}"
    TEST_NAMES+=("Scalability (BullMQ)")
    TEST_RESULTS+=("SKIPPED")
    TEST_TIMES+=("0s")
fi

# 5. Tests (Coverage)
echo -e "${BOLD}[5/5] Tests (Coverage)${NC}"
echo "─────────────────────────────────────────────────────────────"
if run_test "Tests (Coverage)" "bash scripts/run_tests_with_coverage.sh" "$CORE_AI_DIR"; then
    ((PASSED_TESTS++))
fi

# Print summary
print_header "VALIDATION SUMMARY"

printf "  %-35s %-12s %s\n" "Test" "Duration" "Result"
echo "  ─────────────────────────────────────────────────────────────"

for i in "${!TEST_NAMES[@]}"; do
    name="${TEST_NAMES[$i]}"
    result="${TEST_RESULTS[$i]}"
    time="${TEST_TIMES[$i]}"
    
    if [ "$result" = "PASSED" ]; then
        status="${GREEN}✅ PASSED${NC}"
    elif [ "$result" = "SKIPPED" ]; then
        status="${YELLOW}⚠️  SKIPPED${NC}"
    else
        status="${RED}❌ FAILED${NC}"
    fi
    
    printf "  %-35s %-12s %b\n" "$name" "$time" "$status"
done

echo "  ─────────────────────────────────────────────────────────────"
echo ""

# List generated reports
echo -e "${BOLD}Generated Reports:${NC}"
[ -f "$CORE_AI_DIR/scripts/benchmark_results.json" ] && echo "  • $CORE_AI_DIR/scripts/benchmark_results.json"
[ -f "$CORE_AI_DIR/scripts/metrics_validation.json" ] && echo "  • $CORE_AI_DIR/scripts/metrics_validation.json"
[ -f "$CORE_AI_DIR/scripts/grafana_dashboard.json" ] && echo "  • $CORE_AI_DIR/scripts/grafana_dashboard.json"
[ -f "$APP_API_DIR/scripts/bullmq_test_results.json" ] && echo "  • $APP_API_DIR/scripts/bullmq_test_results.json"
[ -d "$CORE_AI_DIR/htmlcov" ] && echo "  • $CORE_AI_DIR/htmlcov/index.html"
echo ""

# Final verdict
FAILED_TESTS=$((TOTAL_TESTS - PASSED_TESTS))
SKIPPED_COUNT=$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -c "SKIPPED" || true)

echo ""
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║     FINAL VERDICT: ALL VALIDATIONS PASSED ✅              ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $SKIPPED_COUNT -gt 0 ] && [ $((PASSED_TESTS + SKIPPED_COUNT)) -eq $TOTAL_TESTS ]; then
    echo -e "${YELLOW}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}${BOLD}║     FINAL VERDICT: PASSED WITH SKIPS ⚠️                    ║${NC}"
    echo -e "${YELLOW}${BOLD}║     ($PASSED_TESTS passed, $SKIPPED_COUNT skipped)                              ║${NC}"
    echo -e "${YELLOW}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}${BOLD}║     FINAL VERDICT: VALIDATIONS FAILED ❌                   ║${NC}"
    echo -e "${RED}${BOLD}║     ($PASSED_TESTS passed, $FAILED_TESTS failed)                               ║${NC}"
    echo -e "${RED}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
