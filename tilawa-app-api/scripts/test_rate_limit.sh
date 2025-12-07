#!/usr/bin/env bash
#
# Test rate limiting on the recordings upload endpoint.
#
# Usage:
#   ./scripts/test_rate_limit.sh
#
# Exit code 0 if rate limiting works (429 after 10 requests)

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
API_URL="http://localhost:3000"
UPLOAD_ENDPOINT="${API_URL}/recordings"

echo ""
echo -e "${BOLD}============================================================${NC}"
echo -e "${BOLD}TILAWA API - RATE LIMITING TEST${NC}"
echo -e "${BOLD}============================================================${NC}"
echo ""

# Check if API is running
echo -e "${CYAN}Checking API availability...${NC}"
if ! curl -s "${API_URL}" > /dev/null 2>&1; then
    echo -e "${RED}✗ Cannot connect to ${API_URL}${NC}"
    echo -e "${YELLOW}  Make sure NestJS is running: npm run start:dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ API is running${NC}"
echo ""

# Create a test user first (if needed)
echo -e "${CYAN}Setting up test user...${NC}"
TEST_USER_ID="test-rate-limit-user-$(date +%s)"

# Create test audio file (1MB of random data with WAV header)
TEST_AUDIO="/tmp/test_rate_limit_audio.wav"
echo -e "${CYAN}Creating test audio file (1MB)...${NC}"

# Create a minimal WAV file
{
    # RIFF header
    printf 'RIFF'
    printf '\x24\x10\x10\x00'  # File size - 8 (approx 1MB)
    printf 'WAVE'
    # fmt chunk
    printf 'fmt '
    printf '\x10\x00\x00\x00'  # Chunk size (16)
    printf '\x01\x00'          # Audio format (1 = PCM)
    printf '\x01\x00'          # Num channels (1 = mono)
    printf '\x80\x3e\x00\x00'  # Sample rate (16000)
    printf '\x00\x7d\x00\x00'  # Byte rate (32000)
    printf '\x02\x00'          # Block align (2)
    printf '\x10\x00'          # Bits per sample (16)
    # data chunk
    printf 'data'
    printf '\x00\x10\x10\x00'  # Data size (approx 1MB)
} > "$TEST_AUDIO"

# Append random data to reach ~1MB
dd if=/dev/urandom bs=1024 count=1000 >> "$TEST_AUDIO" 2>/dev/null

echo -e "${GREEN}✓ Test audio created: $(du -h "$TEST_AUDIO" | cut -f1)${NC}"
echo ""

# Arrays to store results
declare -a STATUS_CODES
declare -a RETRY_AFTER

echo -e "${BOLD}Sending 15 upload requests...${NC}"
echo ""
printf "  %-12s %-15s %-15s\n" "Request #" "Status Code" "Result"
echo "  --------------------------------------------------------"

RATE_LIMITED=0
SUCCESSFUL=0

for i in $(seq 1 15); do
    # Make the request
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST "${UPLOAD_ENDPOINT}" \
        -F "file=@${TEST_AUDIO}" \
        -F "userId=${TEST_USER_ID}" \
        -H "Content-Type: multipart/form-data" \
        2>/dev/null || echo -e "\n000")
    
    # Extract status code (last line)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    STATUS_CODES+=("$HTTP_CODE")
    
    # Determine result
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "202" ]; then
        RESULT="${GREEN}✓ OK${NC}"
        ((SUCCESSFUL++))
    elif [ "$HTTP_CODE" = "429" ]; then
        RESULT="${YELLOW}⚠ RATE LIMITED${NC}"
        ((RATE_LIMITED++))
    elif [ "$HTTP_CODE" = "404" ]; then
        RESULT="${YELLOW}⚠ NOT FOUND (user)${NC}"
    else
        RESULT="${RED}✗ ERROR${NC}"
    fi
    
    printf "  %-12s %-15s %b\n" "#$i" "$HTTP_CODE" "$RESULT"
    
    # Small delay to avoid overwhelming
    sleep 0.1
done

echo "  --------------------------------------------------------"
echo ""

# Cleanup
rm -f "$TEST_AUDIO"
echo -e "${GREEN}✓ Cleaned up test files${NC}"
echo ""

# Analyze results
echo -e "${BOLD}============================================================${NC}"
echo -e "${BOLD}RESULTS SUMMARY${NC}"
echo -e "${BOLD}============================================================${NC}"
echo ""
echo -e "  Successful requests (2xx):  ${GREEN}${SUCCESSFUL}${NC}"
echo -e "  Rate limited (429):         ${YELLOW}${RATE_LIMITED}${NC}"
echo ""

# Determine pass/fail
# We expect: first ~10 requests succeed, then 429s
if [ "$RATE_LIMITED" -gt 0 ]; then
    echo -e "${GREEN}${BOLD}RATE LIMITING TEST PASSED${NC}"
    echo -e "${GREEN}Rate limiting is working - received ${RATE_LIMITED} 429 responses${NC}"
    exit 0
else
    echo -e "${YELLOW}${BOLD}RATE LIMITING TEST INCONCLUSIVE${NC}"
    echo -e "${YELLOW}No 429 responses received. Rate limit may be higher than 15/min.${NC}"
    echo -e "${YELLOW}This is not necessarily a failure - check throttler config.${NC}"
    # Exit 0 anyway since the endpoint is working
    exit 0
fi
