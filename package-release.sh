#!/usr/bin/env bash
set -e

# ==============================================================================
# AcerX Release Packaging Script (For Acer Nitro V 15)
# Generates a standalone release archive containing pre-compiled binaries,
# driver source code, assets, and installer.
# ==============================================================================

VERSION="${1:-v0.1.0}"
ARCH="linux-x86_64"
DIST_NAME="AcerX-NitroV15-${VERSION}-${ARCH}"
DIST_DIR="dist-release/${DIST_NAME}"
TARBALL="dist-release/${DIST_NAME}.tar.gz"

echo "=== Packaging AcerX for release: ${DIST_NAME} ==="

# 1. Ensure pre-compiled binaries exist
if [ ! -f "daemon/target/release/void-controld" ]; then
    echo "[!] daemon binary missing. Building release daemon..."
    (cd daemon && cargo build --release)
fi

if [ ! -f "app/src-tauri/target/release/acer-x" ]; then
    echo "[!] app binary missing. Building release UI..."
    (cd app && npm run build && npx tauri build --no-bundle)
fi

# 2. Prepare staging directory
rm -rf "dist-release"
mkdir -p "${DIST_DIR}"

# 3. Copy pre-built release binaries & daemon service unit
echo "[+] Copying binaries..."
mkdir -p "${DIST_DIR}/daemon/target/release"
mkdir -p "${DIST_DIR}/app/src-tauri/target/release"
mkdir -p "${DIST_DIR}/app/public"

cp daemon/target/release/void-controld "${DIST_DIR}/daemon/target/release/"
cp daemon/void-controld.service "${DIST_DIR}/daemon/"
cp app/src-tauri/target/release/acer-x "${DIST_DIR}/app/src-tauri/target/release/"

# 4. Copy kernel driver source (must compile against user's specific kernel headers)
echo "[+] Copying kernel driver source..."
mkdir -p "${DIST_DIR}/driver/src"
cp driver/Makefile "${DIST_DIR}/driver/"
cp driver/linuwu_sense.service "${DIST_DIR}/driver/" 2>/dev/null || true
cp driver/src/*.c "${DIST_DIR}/driver/src/" 2>/dev/null || true
cp driver/src/*.h "${DIST_DIR}/driver/src/" 2>/dev/null || true

# 5. Copy installation scripts, configs & assets
echo "[+] Copying scripts and assets..."
cp install.sh "${DIST_DIR}/"
cp uninstall.sh "${DIST_DIR}/"
cp README.md "${DIST_DIR}/"
chmod +x "${DIST_DIR}/install.sh"
chmod +x "${DIST_DIR}/uninstall.sh"

if [ -f "app/public/icon.png" ]; then
    cp app/public/icon.png "${DIST_DIR}/app/public/icon.png"
fi

# 6. Create Tarball
echo "[+] Creating archive ${TARBALL}..."
(cd dist-release && tar -czvf "${DIST_NAME}.tar.gz" "${DIST_NAME}")

echo "================================================="
echo " Package successfully built!"
echo " File: $(pwd)/${TARBALL}"
echo " Size: $(du -h "${TARBALL}" | cut -f1)"
echo "================================================="
