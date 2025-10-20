#!/bin/bash

# Docker Security Scanning Script for Leily Application
# This script provides comprehensive security scanning for Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="leily"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
SEVERITY_THRESHOLD="high"
OUTPUT_DIR="./security-reports"

echo -e "${BLUE}🔒 Leily Security Scanning Script${NC}"
echo "=================================="

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to check if Snyk is installed
check_snyk() {
    if ! command -v snyk &> /dev/null; then
        echo -e "${RED}❌ Snyk CLI not found. Please install it first:${NC}"
        echo "npm install -g snyk"
        echo "or"
        echo "npm install snyk --save-dev"
        exit 1
    fi
    echo -e "${GREEN}✅ Snyk CLI found${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to build Docker image
build_image() {
    echo -e "${BLUE}🔨 Building Docker image: ${FULL_IMAGE_NAME}${NC}"
    docker build -t "$FULL_IMAGE_NAME" .
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
}

# Function to scan Docker image
scan_container() {
    echo -e "${BLUE}🔍 Scanning Docker container for vulnerabilities...${NC}"
    
    # Basic container scan
    snyk container test "$FULL_IMAGE_NAME" \
        --severity-threshold="$SEVERITY_THRESHOLD" \
        --json > "$OUTPUT_DIR/container-scan.json" || true
    
    # Detailed scan with SARIF output
    snyk container test "$FULL_IMAGE_NAME" \
        --severity-threshold="$SEVERITY_THRESHOLD" \
        --sarif > "$OUTPUT_DIR/container-scan.sarif" || true
    
    echo -e "${GREEN}✅ Container scan completed${NC}"
}

# Function to scan Dockerfile
scan_dockerfile() {
    echo -e "${BLUE}🔍 Scanning Dockerfile for security issues...${NC}"
    
    snyk iac test Dockerfile \
        --severity-threshold="$SEVERITY_THRESHOLD" \
        --json > "$OUTPUT_DIR/dockerfile-scan.json" || true
    
    snyk iac test Dockerfile \
        --severity-threshold="$SEVERITY_THRESHOLD" \
        --sarif > "$OUTPUT_DIR/dockerfile-scan.sarif" || true
    
    echo -e "${GREEN}✅ Dockerfile scan completed${NC}"
}

# Function to scan docker-compose.yml
scan_compose() {
    if [ -f "docker-compose.yml" ]; then
        echo -e "${BLUE}🔍 Scanning docker-compose.yml...${NC}"
        
        snyk iac test docker-compose.yml \
            --severity-threshold="$SEVERITY_THRESHOLD" \
            --json > "$OUTPUT_DIR/compose-scan.json" || true
        
        echo -e "${GREEN}✅ Docker Compose scan completed${NC}"
    else
        echo -e "${YELLOW}⚠️  docker-compose.yml not found, skipping${NC}"
    fi
}

# Function to scan dependencies
scan_dependencies() {
    echo -e "${BLUE}🔍 Scanning Node.js dependencies...${NC}"
    
    snyk test \
        --severity-threshold="$SEVERITY_THRESHOLD" \
        --json > "$OUTPUT_DIR/dependencies-scan.json" || true
    
    snyk test \
        --severity-threshold="$SEVERITY_THRESHOLD" \
        --sarif > "$OUTPUT_DIR/dependencies-scan.sarif" || true
    
    echo -e "${GREEN}✅ Dependencies scan completed${NC}"
}

# Function to generate summary report
generate_summary() {
    echo -e "${BLUE}📊 Generating security summary...${NC}"
    
    local summary_file="$OUTPUT_DIR/security-summary.md"
    
    cat > "$summary_file" << EOF
# Security Scan Summary

**Generated:** $(date)
**Image:** $FULL_IMAGE_NAME
**Severity Threshold:** $SEVERITY_THRESHOLD

## Scan Results

### Container Scan
- **File:** \`container-scan.json\`
- **SARIF:** \`container-scan.sarif\`

### Dockerfile Scan
- **File:** \`dockerfile-scan.json\`
- **SARIF:** \`dockerfile-scan.sarif\`

### Dependencies Scan
- **File:** \`dependencies-scan.json\`
- **SARIF:** \`dependencies-scan.sarif\`

## Next Steps

1. Review scan results in the JSON files
2. Address high-severity vulnerabilities immediately
3. Upload SARIF files to GitHub Security tab
4. Monitor ongoing security with Snyk dashboard

## Files Generated

\`\`\`
$OUTPUT_DIR/
├── container-scan.json
├── container-scan.sarif
├── dockerfile-scan.json
├── dockerfile-scan.sarif
├── dependencies-scan.json
├── dependencies-scan.sarif
└── security-summary.md
\`\`\`
EOF

    echo -e "${GREEN}✅ Summary report generated: $summary_file${NC}"
}

# Function to display results
display_results() {
    echo -e "${BLUE}📋 Security Scan Results${NC}"
    echo "========================"
    
    if [ -f "$OUTPUT_DIR/container-scan.json" ]; then
        local vuln_count=$(jq '.vulnerabilities | length' "$OUTPUT_DIR/container-scan.json" 2>/dev/null || echo "0")
        echo -e "Container vulnerabilities: ${YELLOW}$vuln_count${NC}"
    fi
    
    if [ -f "$OUTPUT_DIR/dependencies-scan.json" ]; then
        local dep_vuln_count=$(jq '.vulnerabilities | length' "$OUTPUT_DIR/dependencies-scan.json" 2>/dev/null || echo "0")
        echo -e "Dependency vulnerabilities: ${YELLOW}$dep_vuln_count${NC}"
    fi
    
    echo -e "\n${BLUE}📁 Reports saved to: $OUTPUT_DIR/${NC}"
    echo -e "${BLUE}🌐 View detailed reports at: https://app.snyk.io${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting security scan...${NC}"
    
    # Pre-flight checks
    check_snyk
    check_docker
    
    # Build image if needed
    if [ "$1" = "--build" ] || [ "$1" = "-b" ]; then
        build_image
    fi
    
    # Run scans
    scan_container
    scan_dockerfile
    scan_compose
    scan_dependencies
    
    # Generate reports
    generate_summary
    display_results
    
    echo -e "${GREEN}🎉 Security scan completed successfully!${NC}"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build, -b    Build Docker image before scanning"
    echo "  --help, -h     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Scan existing image"
    echo "  $0 --build            # Build and scan image"
    echo ""
    echo "Prerequisites:"
    echo "  - Docker running"
    echo "  - Snyk CLI installed"
    echo "  - Authenticated with Snyk (run 'snyk auth')"
}

# Parse arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
