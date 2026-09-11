#!/usr/bin/env bash
# ==============================================================================
# AcerX - Nitro / Predator Dedicated Key Listener
# Automatically detects keycode 425 (or configured key) and launches AcerX UI.
# ==============================================================================
set -euo pipefail

# Read key code configuration
if [ -f "/etc/acerx/nitro_key.conf" ]; then
    # shellcheck disable=SC1091
    source /etc/acerx/nitro_key.conf
elif [ -f "/etc/damx/nitro_key.conf" ]; then
    # shellcheck disable=SC1091
    source /etc/damx/nitro_key.conf
else
    NITRO_KEY=425
fi

find_target_user() {
    if [ -n "${ACERX_TARGET_USER:-}" ] && id -u "$ACERX_TARGET_USER" >/dev/null 2>&1; then
        echo "$ACERX_TARGET_USER"
        return 0
    fi

    if [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ] && id -u "$SUDO_USER" >/dev/null 2>&1; then
        echo "$SUDO_USER"
        return 0
    fi

    if command -v loginctl >/dev/null 2>&1; then
        local user
        user=$(loginctl list-sessions --no-legend 2>/dev/null | awk '$3 != "root" && $3 != "gdm" && $3 != "sddm" && $3 != "lightdm" { print $3; exit }')
        if [ -n "$user" ] && id -u "$user" >/dev/null 2>&1; then
            echo "$user"
            return 0
        fi
    fi

    awk -F: '$3 >= 1000 && $3 < 60000 && $1 != "nobody" { print $1; exit }' /etc/passwd
}

find_keyboard_device() {
    local dev
    dev=$(grep -A 8 -B 2 "AT Translated Set 2 keyboard" /proc/bus/input/devices 2>/dev/null | grep -m 1 "event" | sed 's/.*event\([0-9]\+\).*/\/dev\/input\/event\1/')
    if [ -n "$dev" ] && [ -e "$dev" ]; then
        echo "$dev"
        return 0
    fi

    dev=$(grep -A 8 -B 2 "Acer WMI hotkeys" /proc/bus/input/devices 2>/dev/null | grep -m 1 "event" | sed 's/.*event\([0-9]\+\).*/\/dev\/input\/event\1/')
    if [ -n "$dev" ] && [ -e "$dev" ]; then
        echo "$dev"
        return 0
    fi

    echo ""
}

DEVICE=$(find_keyboard_device)

if [ -z "$DEVICE" ] || [ ! -e "$DEVICE" ]; then
    echo "Error: Could not find keyboard input device."
    exit 1
fi

if ! command -v evtest >/dev/null 2>&1; then
    echo "Error: evtest is required for Nitro key detection. Please install evtest."
    exit 1
fi

echo "Monitoring Nitro/PredatorSense key (code $NITRO_KEY) on $DEVICE..."

launch_acerx() {
    local target_user
    target_user=$(find_target_user)
    if [ -z "$target_user" ]; then
        echo "Warning: Could not determine active desktop user."
        return 1
    fi

    local user_id
    user_id=$(id -u "$target_user")

    if pgrep -x "acer-x" > /dev/null; then
        echo "AcerX interface is already active."
        return 0
    fi

    echo "Nitro key pressed! Launching AcerX for user $target_user (UID $user_id)..."

    # Method 1: Clean systemd user session launch (native Wayland / X11)
    if [ -d "/run/user/$user_id" ] && command -v systemd-run >/dev/null 2>&1; then
        if sudo -u "$target_user" env XDG_RUNTIME_DIR="/run/user/$user_id" systemd-run --user /usr/local/bin/acer-x >/dev/null 2>&1; then
            return 0
        fi
    fi

    # Method 2: Extract environment from active user processes (fallback)
    local env_display=""
    local env_wayland=""
    local env_xauth=""

    while IFS= read -r pid; do
        if [ -r "/proc/$pid/environ" ]; then
            env_display=$(tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep '^DISPLAY=' | cut -d= -f2- || true)
            env_wayland=$(tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep '^WAYLAND_DISPLAY=' | cut -d= -f2- || true)
            env_xauth=$(tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep '^XAUTHORITY=' | cut -d= -f2- || true)
            if [ -n "$env_wayland" ] || [ -n "$env_display" ]; then
                break
            fi
        fi
    done < <(pgrep -u "$target_user" || true)

    : "${env_display:=:0}"
    : "${env_wayland:=wayland-0}"

    sudo -u "$target_user" \
        DISPLAY="$env_display" \
        WAYLAND_DISPLAY="$env_wayland" \
        ${env_xauth:+XAUTHORITY="$env_xauth"} \
        XDG_RUNTIME_DIR="/run/user/$user_id" \
        DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$user_id/bus" \
        /usr/local/bin/acer-x >/dev/null 2>&1 &
}

# Stream keyboard input events and trigger on key down
evtest "$DEVICE" | grep --line-buffered -E "code ($NITRO_KEY|425).*value 1" | while read -r _line; do
    launch_acerx
done
