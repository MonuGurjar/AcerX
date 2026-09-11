#!/usr/bin/env bash
# ==============================================================================
# AcerX - Nitro / Predator Dedicated Key Listener & Auto-Detector
# ==============================================================================
set -euo pipefail

CONF_FILE="/etc/acerx/nitro_key.conf"

detect_nitro_key() {
    echo ""
    echo -e "\033[1;33m========================================================================\033[0m"
    echo -e "\033[1;32m  >> ACTION REQUIRED: PRESS YOUR NITRO / PREDATOR KEY NOW <<\033[0m"
    echo -e "\033[1;33m========================================================================\033[0m"
    echo "Please press the physical Nitro (N) or PredatorSense key on your keyboard."
    echo "(Listening on hardware input devices... Waiting up to 10 seconds)"
    echo ""

    mkdir -p /etc/acerx

    # Use pure Python to monitor all candidate keyboard/WMI event devices concurrently
    local result
    result=$(python3 - << 'PYEOF'
import os, sys, struct, select, time, re

dev_paths = {}
try:
    with open("/proc/bus/input/devices") as f:
        current_entry = {}
        for line in f:
            line = line.strip()
            if not line:
                name = current_entry.get("Name", "")
                handlers = current_entry.get("Handlers", "")
                if "keyboard" in name.lower() or "acer" in name.lower() or "wmi" in name.lower():
                    for m in re.finditer(r"event(\d+)", handlers):
                        p = f"/dev/input/event{m.group(1)}"
                        if os.path.exists(p) and p not in dev_paths:
                            dev_paths[p] = name
                current_entry = {}
                continue
            if line.startswith("N: Name="):
                current_entry["Name"] = line.split("Name=", 1)[1].strip('"')
            elif line.startswith("H: Handlers="):
                current_entry["Handlers"] = line.split("Handlers=", 1)[1]
except Exception as e:
    pass

# Fallback: check event3 and event6 directly if nothing found
for candidate in ["/dev/input/event3", "/dev/input/event6", "/dev/input/event0", "/dev/input/event1"]:
    if os.path.exists(candidate) and candidate not in dev_paths:
        dev_paths[candidate] = "Input Device"

fds = {}
for p in dev_paths:
    try:
        fd = os.open(p, os.O_RDONLY | os.O_NONBLOCK)
        fds[fd] = p
    except Exception:
        pass

if not fds:
    print("FALLBACK:425:/dev/input/event3")
    sys.exit(0)

# Drain any residual events (e.g. user pressing Enter to start installer)
time.sleep(0.35)
for fd in list(fds.keys()):
    try:
        while True:
            chunk = os.read(fd, 24 * 16)
            if not chunk:
                break
    except Exception:
        pass

timeout = 10.0
start_time = time.time()
detected = None

while (time.time() - start_time) < timeout:
    remaining = max(0.1, timeout - (time.time() - start_time))
    r, _, _ = select.select(list(fds.keys()), [], [], min(0.5, remaining))
    for fd in r:
        try:
            data = os.read(fd, 24)
            if len(data) == 24:
                _, _, ev_type, ev_code, ev_value = struct.unpack("qqHHi", data)
                # EV_KEY is type 1; value 1 is key down
                if ev_type == 1 and ev_value == 1:
                    # Ignore Enter (28) if pressed immediately
                    if ev_code == 28 and (time.time() - start_time) < 0.5:
                        continue
                    detected = (ev_code, fds[fd])
                    break
        except Exception:
            pass
    if detected:
        break

for fd in fds:
    try:
        os.close(fd)
    except Exception:
        pass

if detected:
    print(f"DETECTED:{detected[0]}:{detected[1]}")
else:
    print("TIMEOUT:425:/dev/input/event3")
PYEOF
)

    local status
    local key_code
    local key_dev

    status=$(echo "$result" | cut -d: -f1)
    key_code=$(echo "$result" | cut -d: -f2)
    key_dev=$(echo "$result" | cut -d: -f3)

    if [ "$status" = "DETECTED" ]; then
        echo -e "\033[0;32m✓ Successfully detected and registered Nitro keycode: ${key_code} on ${key_dev}!\033[0m"
    else
        echo -e "\033[1;33mNo keypress captured within 10s. Defaulting to standard Nitro keycode: 425 on ${key_dev}.\033[0m"
        key_code=425
    fi

    cat << CONF_EOF > "$CONF_FILE"
# AcerX Nitro / Predator Dedicated Key Configuration
# Generated on $(date)
NITRO_KEY=${key_code}
NITRO_DEVICE=${key_dev}
CONF_EOF
    chmod 644 "$CONF_FILE"

    if systemctl is-active --quiet acerx-nitrokey.service 2>/dev/null; then
        systemctl restart acerx-nitrokey.service 2>/dev/null || true
    fi
}

if [ "${1:-}" = "--detect" ]; then
    detect_nitro_key
    exit 0
fi

# ==============================================================================
# Listener Daemon Mode (executed by systemd service)
# ==============================================================================
if [ -f "$CONF_FILE" ]; then
    # shellcheck disable=SC1090
    source "$CONF_FILE"
fi

: "${NITRO_KEY:=425}"
: "${NITRO_DEVICE:=}"

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
    if [ -n "$NITRO_DEVICE" ] && [ -e "$NITRO_DEVICE" ]; then
        echo "$NITRO_DEVICE"
        return 0
    fi

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
    echo "Error: evtest is required for Nitro key detection."
    exit 1
fi

echo "AcerX Nitro key listener active: Monitoring keycode $NITRO_KEY on $DEVICE..."

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

    # Method 1: systemd user session launch (native Wayland / X11)
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
