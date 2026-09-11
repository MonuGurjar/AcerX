#!/usr/bin/env bash
# ==============================================================================
# AcerX - Clean Uninstaller
# ==============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}[!] Root privileges required to uninstall.${NC}"
    exec sudo bash "$0" "$@"
fi

echo -e "${RED}${BOLD}Stopping and removing AcerX components...${NC}"

# Stop and disable daemon services
systemctl stop acerx.service void-controld.service 2>/dev/null || true
systemctl disable acerx.service void-controld.service 2>/dev/null || true
rm -f /etc/systemd/system/acerx.service /etc/systemd/system/void-controld.service
systemctl daemon-reload

# Remove system binaries
rm -f /usr/local/bin/void-controld /usr/local/bin/acer-x

# Remove desktop entry and icons
rm -f /usr/share/applications/acer-x.desktop /usr/share/pixmaps/acer-x.png
for res in 32x32 48x48 64x64 128x128 256x256 512x512; do
    rm -f "/usr/share/icons/hicolor/${res}/apps/acer-x.png"
done

# Remove module autoload rules and sockets
rm -f /etc/modules-load.d/linuwu_sense.conf
rm -f /etc/modprobe.d/blacklist-acer_wmi.conf
rm -f /etc/tmpfiles.d/linuwu_sense.conf
rm -f /tmp/acerx.sock /tmp/void-control.sock /run/void-control.sock

# Update desktop and icon databases
gtk-update-icon-cache -f /usr/share/icons/hicolor >/dev/null 2>&1 || true
update-desktop-database /usr/share/applications/ >/dev/null 2>&1 || true

echo -e "${GREEN}✓ AcerX has been cleanly uninstalled from your system.${NC}"
