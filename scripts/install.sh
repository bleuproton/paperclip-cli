#!/usr/bin/env bash
# paperclip-cli one-liner installer
set -e

REPO="bleuproton/paperclip-cli"
INSTALL_DIR="${PAPERCLIP_INSTALL_DIR:-$HOME/.paperclip-cli}"

echo "==> Installing paperclip-cli to $INSTALL_DIR"

# Check Node
if ! command -v node >/dev/null; then
  echo "ERROR: node 20+ required. Install from https://nodejs.org"
  exit 1
fi
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "ERROR: node 20+ required, found v$NODE_VERSION"
  exit 1
fi

# Clone and build
rm -rf "$INSTALL_DIR"
git clone --depth 1 "https://github.com/$REPO.git" "$INSTALL_DIR"
cd "$INSTALL_DIR"
npm install --silent
npm run build --silent

# Link
npm link --silent

echo ""
echo "==> Installed. Run:"
echo "    paperclip --version"
echo "    paperclip login"
