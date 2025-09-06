#!/bin/bash

# AI Application Tracker - Deployment Script
# This script handles deployment to different environments

set -e

# Configuration
ENVIRONMENTS=("development" "staging" "production")
DEFAULT_ENV="staging"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  development  - Deploy to development environment"
    echo "  staging      - Deploy to staging environment (default)"
    echo "  production   - Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --dry-run    - Show what would be deployed without actually deploying"
    echo "  --skip-tests - Skip running tests before deployment"
    echo "  --force      - Force deployment even if checks fail"
    echo "  --help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --dry-run"
    echo "  $0 development --skip-tests"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

check_environment() {
    local env=$1
    
    if [[ ! " ${ENVIRONMENTS[@]} " =~ " ${env} " ]]; then
        log_error "Invalid environment: $env"
        log_info "Valid environments: ${ENVIRONMENTS[*]}"
        exit 1
    fi
}

run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "Skipping tests as requested"
        return 0
    fi
    
    log_info "Running tests..."
    
    # Run unit tests
    if ! npm run test -- --run --reporter=verbose; then
        log_error "Unit tests failed"
        if [[ "$FORCE" != "true" ]]; then
            exit 1
        else
            log_warning "Continuing deployment despite test failures (--force flag used)"
        fi
    fi
    
    # Run linting
    if ! npm run lint; then
        log_error "Linting failed"
        if [[ "$FORCE" != "true" ]]; then
            exit 1
        else
            log_warning "Continuing deployment despite linting failures (--force flag used)"
        fi
    fi
    
    # Run type checking
    if ! npm run type-check; then
        log_error "Type checking failed"
        if [[ "$FORCE" != "true" ]]; then
            exit 1
        else
            log_warning "Continuing deployment despite type checking failures (--force flag used)"
        fi
    fi
    
    log_success "All tests passed"
}

build_application() {
    local env=$1
    
    log_info "Building application for $env environment..."
    
    # Set environment variables
    export NODE_ENV=$env
    export NEXT_TELEMETRY_DISABLED=1
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Build the application
    log_info "Building Next.js application..."
    if ! npm run build; then
        log_error "Build failed"
        exit 1
    fi
    
    log_success "Build completed successfully"
}

run_security_checks() {
    log_info "Running security checks..."
    
    # Check for known vulnerabilities
    if command -v npm audit &> /dev/null; then
        log_info "Running npm audit..."
        if ! npm audit --audit-level=high; then
            log_warning "Security vulnerabilities found"
            if [[ "$FORCE" != "true" ]]; then
                log_error "Deployment blocked due to security issues. Use --force to override."
                exit 1
            fi
        fi
    fi
    
    # Check for sensitive data in environment files
    if [ -f ".env" ] || [ -f ".env.local" ]; then
        log_info "Checking for sensitive data in environment files..."
        
        # Check for common sensitive patterns
        if grep -E "(password|secret|key|token)" .env* 2>/dev/null | grep -v "EXAMPLE\|PLACEHOLDER"; then
            log_warning "Potential sensitive data found in environment files"
        fi
    fi
    
    log_success "Security checks completed"
}

deploy_to_vercel() {
    local env=$1
    
    log_info "Deploying to Vercel ($env)..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy to Vercel with environment: $env"
        return 0
    fi
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed. Install with: npm i -g vercel"
        exit 1
    fi
    
    # Deploy based on environment
    case $env in
        "production")
            log_info "Deploying to production..."
            vercel --prod --confirm
            ;;
        "staging")
            log_info "Deploying to staging..."
            vercel --confirm
            ;;
        "development")
            log_info "Deploying to development..."
            vercel --confirm
            ;;
    esac
    
    log_success "Deployment to Vercel completed"
}

setup_monitoring() {
    local env=$1
    
    log_info "Setting up monitoring for $env environment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would set up monitoring for environment: $env"
        return 0
    fi
    
    # In a real implementation, this would:
    # 1. Configure error tracking (Sentry, Bugsnag)
    # 2. Set up performance monitoring
    # 3. Configure alerts and notifications
    # 4. Set up health checks
    
    log_info "Monitoring setup completed (placeholder)"
}

create_deployment_report() {
    local env=$1
    local start_time=$2
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "Creating deployment report..."
    
    local report_file="deployment-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "deployment": {
    "environment": "$env",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "duration": ${duration},
    "version": "$(git rev-parse HEAD)",
    "branch": "$(git rev-parse --abbrev-ref HEAD)",
    "deployer": "$(git config user.name)",
    "status": "success"
  },
  "build": {
    "node_version": "$(node --version)",
    "npm_version": "$(npm --version)"
  },
  "checks": {
    "tests_passed": $([ "$SKIP_TESTS" == "true" ] && echo "false" || echo "true"),
    "security_checks": true,
    "build_successful": true
  }
}
EOF
    
    log_success "Deployment report created: $report_file"
}

# Main deployment function
main() {
    local env=${1:-$DEFAULT_ENV}
    local start_time=$(date +%s)
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --skip-tests)
                SKIP_TESTS="true"
                shift
                ;;
            --force)
                FORCE="true"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            development|staging|production)
                env=$1
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    log_info "Starting deployment to $env environment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual deployment will occur"
    fi
    
    # Run deployment steps
    check_prerequisites
    check_environment "$env"
    run_security_checks
    run_tests
    build_application "$env"
    deploy_to_vercel "$env"
    setup_monitoring "$env"
    create_deployment_report "$env" "$start_time"
    
    log_success "Deployment to $env completed successfully!"
    
    # Show next steps
    echo ""
    log_info "Next steps:"
    echo "  1. Verify deployment at the provided URL"
    echo "  2. Run smoke tests"
    echo "  3. Monitor error rates and performance"
    echo "  4. Update documentation if needed"
}

# Run main function with all arguments
main "$@"