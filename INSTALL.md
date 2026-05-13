# Installation Guide

## npm (Recommended)

Install globally using npm:

```bash
npm install -g @bleuproton/paperclip-cli
```

Verify installation:

```bash
paperclip --version
```

## Linux One-liner

Install the latest version on Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/bleuproton/paperclip-cli/main/install.sh | bash
```

This script will:
1. Detect your system architecture
2. Download the latest release
3. Install to `/usr/local/bin/paperclip`
4. Set proper permissions

Manual installation after download:

```bash
# Download and extract
wget https://github.com/bleuproton/paperclip-cli/releases/latest/download/paperclip-linux-x64.tar.gz
tar xzf paperclip-linux-x64.tar.gz

# Move to PATH
sudo mv paperclip /usr/local/bin/
sudo chmod +x /usr/local/bin/paperclip

# Verify
paperclip --version
```

## macOS

### Using npm

```bash
npm install -g @bleuproton/paperclip-cli
```

### Manual installation

```bash
# Download
curl -LO https://github.com/bleuproton/paperclip-cli/releases/latest/download/paperclip-macos-arm64.tar.gz

# Extract
tar xzf paperclip-macos-arm64.tar.gz

# Move to PATH
sudo mv paperclip /usr/local/bin/
sudo chmod +x /usr/local/bin/paperclip

# Verify
paperclip --version
```

## From Source

Requirements:
- Node.js 20 or later
- npm or yarn

```bash
# Clone repository
git clone https://github.com/bleuproton/paperclip-cli.git
cd paperclip-cli

# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link

# Verify
paperclip --version
```

## Docker

Run without installation using Docker:

```bash
docker run -it --rm \
  -v ~/.paperclip:/root/.paperclip \
  bleuproton/paperclip-cli:latest \
  paperclip --help
```

Create an alias for convenience:

```bash
alias paperclip='docker run -it --rm -v ~/.paperclip:/root/.paperclip bleuproton/paperclip-cli:latest paperclip'
```

Add to your shell profile (`.bashrc`, `.zshrc`, etc.) to persist.

## Verify Installation

After installation, verify everything works:

```bash
# Check version
paperclip --version

# View help
paperclip --help

# Login (requires browser)
paperclip login
```

## Update

### npm

```bash
npm update -g @bleuproton/paperclip-cli
```

### Linux one-liner

```bash
curl -fsSL https://raw.githubusercontent.com/bleuproton/paperclip-cli/main/install.sh | bash
```

### From source

```bash
cd paperclip-cli
git pull
npm install
npm run build
```

## Uninstall

### npm

```bash
npm uninstall -g @bleuproton/paperclip-cli
```

### Manual

```bash
sudo rm /usr/local/bin/paperclip
```

### Configuration

Remove configuration files:

```bash
rm -rf ~/.paperclip
```

## Troubleshooting

### Command not found

Ensure the installation directory is in your PATH:

```bash
echo $PATH
```

For npm global installs, the directory is typically:
- Linux/macOS: `/usr/local/bin`
- Windows: `%APPDATA%\npm`

### Permission denied

If you get permission errors on Linux/macOS:

```bash
sudo chmod +x /usr/local/bin/paperclip
```

Or install without sudo using npm:

```bash
npm config set prefix ~/.local
npm install -g @bleuproton/paperclip-cli
```

Then add `~/.local/bin` to your PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Node version

Ensure you have Node.js 20 or later:

```bash
node --version
```

Update Node.js if needed:
- Using nvm: `nvm install 20 && nvm use 20`
- Using system package manager: see https://nodejs.org

## Next Steps

After installation:

1. Login to Paperclip: `paperclip login`
2. List companies: `paperclip companies ls`
3. Select company: `paperclip companies use <slug>`
4. View dashboard: `paperclip dashboard`

See [README.md](./README.md) for full documentation.
