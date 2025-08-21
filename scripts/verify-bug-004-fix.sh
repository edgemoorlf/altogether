#!/bin/bash

# Bug #004 Fix Verification Script
# This script starts the development servers and runs the regression test

echo "🧪 Bug #004 Fix Verification"
echo "============================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start development servers
start_servers() {
    print_status "Checking if development servers are running..."
    
    # Check if web server (port 3000) is running
    if check_port 3000; then
        print_status "Web server already running on port 3000"
    else
        print_status "Starting web development server..."
        npm run dev > /dev/null 2>&1 &
        WEB_PID=$!
        sleep 5
    fi
    
    # Check if backend server (port 3001) is running
    if check_port 3001; then
        print_status "Backend server already running on port 3001"
    else
        print_status "Starting backend development server..."
        npm run server:dev > /dev/null 2>&1 &
        SERVER_PID=$!
        sleep 5
    fi
    
    # Wait for servers to be ready
    print_status "Waiting for servers to be ready..."
    sleep 10
    
    # Verify servers are running
    if check_port 3000 && check_port 3001; then
        print_success "Both development servers are running"
        return 0
    else
        print_error "Failed to start development servers"
        return 1
    fi
}

# Function to run the regression test
run_test() {
    print_status "Running Bug #004 regression test..."
    
    if npx playwright test tests/bug-004-multiplayer-sync-regression.spec.ts --reporter=line; then
        print_success "Bug #004 regression test PASSED! ✅"
        print_success "Multiplayer movement synchronization is working correctly"
        return 0
    else
        print_error "Bug #004 regression test FAILED ❌"
        print_error "There are still issues with multiplayer synchronization"
        return 1
    fi
}

# Function to cleanup
cleanup() {
    if [ ! -z "$WEB_PID" ]; then
        print_status "Stopping web server (PID: $WEB_PID)..."
        kill $WEB_PID 2>/dev/null
    fi
    
    if [ ! -z "$SERVER_PID" ]; then
        print_status "Stopping backend server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null
    fi
}

# Set up cleanup on exit
trap cleanup EXIT

# Main execution
print_status "Starting Bug #004 fix verification..."

if start_servers; then
    if run_test; then
        print_success "🎉 Bug #004 has been successfully fixed!"
        exit 0
    else
        print_error "🔧 Bug #004 fix needs more work"
        exit 1
    fi
else
    print_error "Could not start development servers"
    exit 1
fi