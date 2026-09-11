#!/usr/bin/env bash
# ==============================================================================
# AcerX - Production Master Installer for Linux
# ==============================================================================
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "    _                   __  __"
echo "   / \   ___ ___ _ __  \ \/ /"
echo "  / _ \ / __/ _ \ '__|  \  / "
echo " / ___ \ (_|  __/ |     /  \ "
echo "/_/   \_\___\___|_|    /_/\_\ "
echo "AcerX Hardware Suite for Linux"
echo -e "${NC}"

if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}[!] Root privileges required to install system services and kernel drivers.${NC}"
    exec sudo bash "$0" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}[1/5] Compiling and Installing Linuwu-Sense Platform Driver...${NC}"
if [ -d "driver" ]; then
    make -C driver clean >/dev/null 2>&1 || true
    make -C driver
    make -C driver install

    # Configure boot autoloading and conflicting module blacklist
    mkdir -p /etc/modules-load.d /etc/modprobe.d /etc/tmpfiles.d
    echo "linuwu_sense" > /etc/modules-load.d/linuwu_sense.conf
    echo "blacklist acer_wmi" > /etc/modprobe.d/blacklist-acer_wmi.conf
    echo 'L /dev/acer-gkb - - - - /sys/devices/platform/acer-wmi/wmi_kbd' > /etc/tmpfiles.d/linuwu_sense.conf

    # Reload kernel driver
    modprobe -r acer_wmi >/dev/null 2>&1 || true
    modprobe linuwu_sense >/dev/null 2>&1 || true
    echo -e "${GREEN}✓ Kernel module linuwu_sense successfully compiled and loaded.${NC}"
else
    echo -e "${RED}[!] 'driver/' directory missing.${NC}"
    exit 1
fi

echo -e "${CYAN}[2/5] Building and Installing Hardware Daemon (void-controld)...${NC}"
if [ -d "daemon" ]; then
    if [ ! -f "daemon/target/release/void-controld" ]; then
        echo "Building release binary with Cargo..."
        (cd daemon && cargo build --release)
    fi
    install -m 755 daemon/target/release/void-controld /usr/local/bin/void-controld

    # Install systemd service unit
    install -m 644 daemon/void-controld.service /etc/systemd/system/acerx.service
    ln -sf /etc/systemd/system/acerx.service /etc/systemd/system/void-controld.service

    systemctl daemon-reload
    systemctl enable acerx.service
    systemctl restart acerx.service
    echo -e "${GREEN}✓ void-controld daemon installed and running on /tmp/acerx.sock.${NC}"
fi

echo -e "${CYAN}[3/5] Building and Installing AcerX Desktop Application...${NC}"
if [ -d "app" ]; then
    if [ ! -f "app/src-tauri/target/release/acer-x" ]; then
        echo "Building desktop UI frontend and Tauri binary..."
        (cd app && npm install && npm run build && npx tauri build --no-bundle)
    fi
    install -m 755 app/src-tauri/target/release/acer-x /usr/local/bin/acer-x
    echo -e "${GREEN}✓ acer-x binary installed to /usr/local/bin/acer-x.${NC}"
fi

echo -e "${CYAN}[4/5] Registering Desktop Launcher & System Icons...${NC}"
mkdir -p /usr/share/applications
cat << 'DESKTOP_EOF' > /usr/share/applications/acer-x.desktop
[Desktop Entry]
Name=AcerX
Comment=Control Predator & Nitro Fans, Thermal Profiles, Battery Care & Telemetry
Exec=/usr/local/bin/acer-x
Icon=acer-x
Terminal=false
Type=Application
Categories=Settings;HardwareSettings;System;Utility;
Keywords=acer;nitro;predator;fans;cooling;rgb;hardware;control;telemetry;
StartupWMClass=acer-x
DESKTOP_EOF
chmod 644 /usr/share/applications/acer-x.desktop

ICON_SRC="app/icon.png"
if [ -f "$ICON_SRC" ]; then
    for res in 32x32 48x48 64x64 128x128 256x256 512x512; do
        mkdir -p "/usr/share/icons/hicolor/${res}/apps"
        cp "$ICON_SRC" "/usr/share/icons/hicolor/${res}/apps/acer-x.png"
    done
    mkdir -p /usr/share/pixmaps
    cp "$ICON_SRC" /usr/share/pixmaps/acer-x.png 2>/dev/null || true
fi

gtk-update-icon-cache -f /usr/share/icons/hicolor >/dev/null 2>&1 || true
update-desktop-database /usr/share/applications/ >/dev/null 2>&1 || true
echo -e "${GREEN}✓ System desktop entry and high-resolution icons registered.${NC}"

echo -e "${CYAN}[5/5] Verification & Health Check...${NC}"
sleep 1
if pgrep -x "void-controld" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Daemon is active and operational.${NC}"
else
    echo -e "${YELLOW}[!] Warning: Check daemon status with: systemctl status acerx.service${NC}"
fi

if lsmod | grep -q "linuwu_sense"; then
    echo -e "${GREEN}✓ linuwu_sense kernel driver is active.${NC}"
else
    echo -e "${YELLOW}[!] Warning: linuwu_sense driver not found in lsmod.${NC}"
fi

echo ""
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "${GREEN}${BOLD}  AcerX Installation Complete!${NC}"
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "Launch AcerX by typing:"
echo -e "  ${CYAN}acer-x${NC}"
echo -e "or open ${CYAN}AcerX${NC} from your desktop application launcher."
echo ""
