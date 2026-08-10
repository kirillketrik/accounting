#!/usr/bin/env bash
# One-line installer for Linux / macOS.
#
# Downloads the app, installs Docker if needed (via start.sh), and runs it.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/kirillketrik/accounting/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/kirillketrik/accounting/main/install.sh | bash -s dev
#
# Env vars:
#   ACCOUNTING_DIR   where to install (default: ~/accounting)
set -euo pipefail

REPO_URL="https://github.com/kirillketrik/accounting.git"
INSTALL_DIR="${ACCOUNTING_DIR:-$HOME/accounting}"
MODE="${1:-prod}"

install_git() {
    echo "git not found — installing..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y git
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y git
    elif command -v yum >/dev/null 2>&1; then
        sudo yum install -y git
    elif command -v pacman >/dev/null 2>&1; then
        sudo pacman -Sy --noconfirm git
    elif command -v zypper >/dev/null 2>&1; then
        sudo zypper install -y git
    elif command -v brew >/dev/null 2>&1; then
        brew install git
    else
        echo "Could not auto-install git for this system. Install it manually, then re-run." >&2
        exit 1
    fi
}

command -v git >/dev/null 2>&1 || install_git

if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Found an existing install at $INSTALL_DIR — updating..."
    git -C "$INSTALL_DIR" pull --ff-only
else
    echo "Cloning into $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
chmod +x start.sh
exec ./start.sh "$MODE"
