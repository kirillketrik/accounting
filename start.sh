#!/usr/bin/env bash
# Installs Docker if needed, then builds and runs the app.
#
# Usage:
#   ./start.sh          # prod (nginx + built frontend, on port 80 / $FRONTEND_PORT)
#   ./start.sh dev      # dev (hot reload, ports 5173 + 8000)
set -euo pipefail

MODE="${1:-prod}"

install_docker_linux() {
    echo "Docker not found — installing via the official convenience script (needs sudo)..."
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable --now docker || true
    sudo usermod -aG docker "$USER" || true
    echo "Docker installed. If 'docker' commands need sudo below, log out/in to pick up the new group, then re-run this script."
}

if ! command -v docker >/dev/null 2>&1; then
    case "$(uname -s)" in
        Linux)
            install_docker_linux
            ;;
        Darwin)
            echo "Docker Desktop isn't installed."
            echo "Opening the download page — install it, then re-run this script."
            open "https://www.docker.com/products/docker-desktop/" 2>/dev/null || true
            exit 1
            ;;
        *)
            echo "Unsupported OS for automatic install. Install Docker manually: https://docs.docker.com/get-docker/"
            exit 1
            ;;
    esac
fi

if ! docker info >/dev/null 2>&1; then
    echo "Docker is installed but not running (or needs sudo/group re-login). Start it and re-run this script."
    exit 1
fi

if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
else
    echo "Docker Compose not found. Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

cd "$(dirname "$0")"

if [ ! -f .env ]; then
    echo ".env not found — creating it from .env.example (defaults already work)..."
    cp .env.example .env
fi

get_lan_ip() {
    if command -v hostname >/dev/null 2>&1 && hostname -I >/dev/null 2>&1; then
        hostname -I | awk '{print $1}'
    elif command -v ip >/dev/null 2>&1; then
        ip -4 addr show scope global 2>/dev/null | awk '/inet/{print $2}' | cut -d/ -f1 | head -n1
    elif command -v ipconfig >/dev/null 2>&1; then
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true
    fi
}

if [ "$MODE" = "dev" ]; then
    $COMPOSE -f docker-compose.dev.yml up --build
else
    $COMPOSE -f docker-compose.yml up --build -d
    PORT="${FRONTEND_PORT:-80}"
    IP="$(get_lan_ip)"
    echo ""
    echo "App is running:"
    echo "  Local:   http://localhost:${PORT}"
    [ -n "${IP:-}" ] && echo "  Network: http://${IP}:${PORT}  (share this with colleagues on the LAN)"
fi
