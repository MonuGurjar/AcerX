#!/bin/bash
set -e

echo "=== Installing VOID CONTROL Privileged Hardware Daemon ==="

if [ "$EUID" -ne 0 ]; then
    echo "Please run this setup script with sudo: sudo ./setup-daemon.sh"
    exit 1
fi

DAEMON_SRC="../daemon/target/release/void-controld"
if [ ! -f "$DAEMON_SRC" ]; then
    echo "Building daemon in release mode..."
    (cd ../daemon && cargo build --release)
fi

echo "Copying void-controld to /usr/local/bin/..."
cp "$DAEMON_SRC" /usr/local/bin/void-controld
chmod 755 /usr/local/bin/void-controld

echo "Installing systemd service unit..."
cp ../daemon/void-controld.service /etc/systemd/system/void-controld.service

echo "Reloading systemd and enabling service..."
systemctl daemon-reload
systemctl enable void-controld.service
systemctl restart void-controld.service

echo "Checking daemon status..."
systemctl status void-controld.service --no-pager

echo ""
echo "✓ VOID CONTROL Daemon installed and running successfully on /run/void-control.sock!"
