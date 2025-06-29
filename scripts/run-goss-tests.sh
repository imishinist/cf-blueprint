#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Goss HTTP Tests...${NC}"

# Check if TARGET_URL is set
if [ -z "$TARGET_URL" ]; then
    echo -e "${RED}ERROR: TARGET_URL environment variable is not set${NC}"
    exit 1
fi

echo -e "${GREEN}Target URL: $TARGET_URL${NC}"

# Create output directory
mkdir -p tests/junit-output

# Run Goss tests with JUnit output
echo -e "${YELLOW}Running Goss validation...${NC}"

# Set environment variables for Goss template
export TARGET_URL="$TARGET_URL"

# Run Goss tests and generate JUnit XML
if goss -g tests/goss.yaml validate --format junit > tests/junit-output/goss-junit.xml; then
    echo -e "${GREEN}✓ Goss tests passed successfully${NC}"
    
    # Display test summary
    echo -e "${YELLOW}Test Summary:${NC}"
    grep -c "testcase" tests/junit-output/goss-junit.xml | xargs echo "Total test cases:"
    grep -c 'failure\|error' tests/junit-output/goss-junit.xml | xargs echo "Failed test cases:" || echo "Failed test cases: 0"
    
    exit 0
else
    echo -e "${RED}✗ Goss tests failed${NC}"
    
    # Still generate the XML file for reporting even on failure
    goss -g tests/goss.yaml validate --format junit > tests/junit-output/goss-junit.xml || true
    
    # Display failure details
    echo -e "${YELLOW}Failure Details:${NC}"
    goss -g tests/goss.yaml validate --format documentation || true
    
    exit 1
fi
