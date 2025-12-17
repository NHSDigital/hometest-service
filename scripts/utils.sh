# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions - output to stderr to avoid interfering with function return values
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" >&2
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" >&2
}

log_error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

get_account_id() {
    local account="$1"
    case "$account" in
        "poc")
            echo "880521146064"
            ;;
        "int")
            echo "899411341184"
            ;;
        "test")
            echo "637423296417"
            ;;
        "prod")
            echo "992382726377"
            ;;
        *)
            log_error "Unknown account: ${account}"
            log_error "Valid accounts: poc, int, test, prod"
            return 1
            ;;
    esac
}