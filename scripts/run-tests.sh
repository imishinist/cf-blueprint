#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting Test Suite ===${NC}"

# Check if TARGET_URL is set
if [ -z "$TARGET_URL" ]; then
    echo -e "${RED}ERROR: TARGET_URL environment variable is not set${NC}"
    exit 1
fi

echo -e "${GREEN}Target URL: $TARGET_URL${NC}"

# Create output directory
mkdir -p tests/junit-output

# Initialize exit codes
K6_EXIT_CODE=0
GOSS_EXIT_CODE=0

echo -e "${YELLOW}=== Running K6 Performance Tests ===${NC}"
if [ -f "k6-test.js" ]; then
    echo "Running k6 test with k6-test.js..."
    k6 run -q -e TARGET_URL=$TARGET_URL k6-test.js || K6_EXIT_CODE=$?
else
    echo -e "${RED}k6-test.js not found. Please add k6-test.js to your source code.${NC}"
    exit 1
fi

echo -e "${YELLOW}=== Running Goss HTTP Tests ===${NC}"
if [ -f "scripts/run-goss-tests.sh" ]; then
    echo "Running Goss HTTP tests..."
    ./scripts/run-goss-tests.sh || GOSS_EXIT_CODE=$?
else
    echo -e "${RED}Goss test script not found. Please add scripts/run-goss-tests.sh to your source code.${NC}"
    exit 1
fi

echo -e "${YELLOW}=== Test Results Summary ===${NC}"
ls -la tests/junit-output/

if [ "$K6_EXIT_CODE" != "0" ]; then
    echo -e "${RED}K6 tests failed with exit code: $K6_EXIT_CODE${NC}"
else
    echo -e "${GREEN}K6 tests passed successfully${NC}"
fi

if [ "$GOSS_EXIT_CODE" != "0" ]; then
    echo -e "${RED}Goss tests failed with exit code: $GOSS_EXIT_CODE${NC}"
else
    echo -e "${GREEN}Goss tests passed successfully${NC}"
fi

echo -e "${YELLOW}Final test results:${NC}"
find tests/junit-output -name "*.xml" -exec echo "Found: {}" \;

# Exit with error if any test failed
if [ "$K6_EXIT_CODE" != "0" ]; then
    exit $K6_EXIT_CODE
fi
if [ "$GOSS_EXIT_CODE" != "0" ]; then
    exit $GOSS_EXIT_CODE
fi

echo -e "${GREEN}All tests completed successfully!${NC}"
