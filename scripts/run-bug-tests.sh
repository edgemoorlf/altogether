#!/bin/bash

# Bug Regression Test Runner Script
# This script runs all bug regression tests and provides detailed reporting

set -e

echo "🧪 Altogether Bug Regression Test Runner"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "tests" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Check if Playwright is available
if ! command -v npx playwright &> /dev/null; then
    print_error "Playwright not found. Please install dependencies first:"
    echo "npm install"
    exit 1
fi

print_status "Starting bug regression test suite..."
echo

# Array of bug test files
bug_tests=(
    "tests/bug-001-avatar-regression.spec.ts"
    "tests/bug-002-movement-regression.spec.ts"
    "tests/bug-003-collision-regression.spec.ts"
    "tests/bug-004-multiplayer-sync-regression.spec.ts"
)

# Function to run individual test
run_bug_test() {
    local test_file=$1
    local bug_number=$(echo $test_file | grep -o 'bug-[0-9]\{3\}')
    
    print_status "Running $bug_number regression test..."
    
    if npx playwright test "$test_file" --reporter=line; then
        print_success "$bug_number test PASSED ✅"
        return 0
    else
        print_error "$bug_number test FAILED ❌"
        return 1
    fi
}

# Run all tests and track results
failed_tests=()
passed_tests=()

for test_file in "${bug_tests[@]}"; do
    if [ -f "$test_file" ]; then
        if run_bug_test "$test_file"; then
            passed_tests+=("$test_file")
        else
            failed_tests+=("$test_file")
        fi
        echo
    else
        print_warning "Test file not found: $test_file"
        echo
    fi
done

# Summary report
echo "🏁 Bug Regression Test Summary"
echo "=============================="
echo

if [ ${#passed_tests[@]} -gt 0 ]; then
    print_success "Passed Tests (${#passed_tests[@]}):"
    for test in "${passed_tests[@]}"; do
        echo "  ✅ $test"
    done
    echo
fi

if [ ${#failed_tests[@]} -gt 0 ]; then
    print_error "Failed Tests (${#failed_tests[@]}):"
    for test in "${failed_tests[@]}"; do
        echo "  ❌ $test"
    done
    echo
    
    print_error "REGRESSION DETECTED! Some bugs may have returned."
    print_status "To debug failed tests, run:"
    echo "  npx playwright test --ui <test-file>"
    echo "  npx playwright test --headed <test-file>"
    echo
    
    exit 1
else
    print_success "All bug regression tests passed! ✅"
    print_status "No regressions detected."
    echo
    exit 0
fi