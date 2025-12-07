#!/usr/bin/env bash
#
# Run pytest with coverage and display results.
#
# Usage:
#   ./scripts/run_tests_with_coverage.sh
#
# Exit code 0 if coverage >= 70%

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${BOLD}============================================================${NC}"
echo -e "${BOLD}TILAWA CORE AI - TEST COVERAGE${NC}"
echo -e "${BOLD}============================================================${NC}"
echo ""

cd "$PROJECT_DIR"

# Check if pytest is available
if ! command -v pytest &> /dev/null; then
    # Try with venv
    if [ -f ".venv311/bin/pytest" ]; then
        PYTEST=".venv311/bin/pytest"
    elif [ -f "venv/bin/pytest" ]; then
        PYTEST="venv/bin/pytest"
    else
        echo -e "${RED}✗ pytest not found. Install with: pip install pytest pytest-cov${NC}"
        exit 1
    fi
else
    PYTEST="pytest"
fi

echo -e "${CYAN}Running tests with coverage...${NC}"
echo ""

# Run pytest with coverage
$PYTEST \
    --cov=app \
    --cov-report=term \
    --cov-report=html \
    --cov-fail-under=70 \
    -v \
    2>&1 | tee /tmp/coverage_output.txt

PYTEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo -e "${BOLD}============================================================${NC}"
echo -e "${BOLD}COVERAGE SUMMARY${NC}"
echo -e "${BOLD}============================================================${NC}"

# Parse coverage from output
parse_coverage() {
    local module=$1
    local coverage=$(grep -E "^$module" /tmp/coverage_output.txt | awk '{print $4}' | tr -d '%' | head -1)
    echo "${coverage:-0}"
}

# Get coverage for each module
SERVICES_COV=$(parse_coverage "app/services")
ROUTERS_COV=$(parse_coverage "app/routers")
UTILS_COV=$(parse_coverage "app/utils")
TOTAL_COV=$(grep -E "^TOTAL" /tmp/coverage_output.txt | awk '{print $4}' | tr -d '%' | head -1)
TOTAL_COV="${TOTAL_COV:-0}"

# Function to get status icon
get_status() {
    local cov=$1
    if [ -z "$cov" ] || [ "$cov" = "0" ]; then
        echo -e "${YELLOW}⚠️  N/A${NC}"
    elif [ "$cov" -ge 70 ]; then
        echo -e "${GREEN}✅ ${cov}%${NC}"
    elif [ "$cov" -ge 60 ]; then
        echo -e "${YELLOW}⚠️  ${cov}%${NC}"
    else
        echo -e "${RED}❌ ${cov}%${NC}"
    fi
}

echo ""
printf "  %-30s %s\n" "Module" "Coverage"
echo "  ------------------------------------------------------------"
printf "  %-30s %s\n" "app/services/" "$(get_status $SERVICES_COV)"
printf "  %-30s %s\n" "app/routers/" "$(get_status $ROUTERS_COV)"
printf "  %-30s %s\n" "app/utils/" "$(get_status $UTILS_COV)"
echo "  ------------------------------------------------------------"
printf "  ${BOLD}%-30s %s${NC}\n" "TOTAL" "$(get_status $TOTAL_COV)"
echo ""

# HTML report location
echo -e "${GREEN}✓ HTML report generated: ${PROJECT_DIR}/htmlcov/index.html${NC}"
echo ""

# Final verdict
if [ "$PYTEST_EXIT_CODE" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}COVERAGE TEST PASSED (>= 70%)${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}COVERAGE TEST FAILED (< 70% or tests failed)${NC}"
    exit 1
fi
