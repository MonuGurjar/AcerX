<p align="center">
  <img src="app/public/logo.png" alt="AcerX Logo" width="220" />
</p>

<h1 align="center">AcerX</h1>
<h3 align="center">Modern Linux Hardware Control Suite for Acer Nitro & Predator Laptops</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Linux-orange.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Daemon-Rust-DEA584.svg" alt="Rust Daemon" />
  <img src="https://img.shields.io/badge/Frontend-Tauri%20v2%20%2B%20React%2019-24C8D8.svg" alt="Tauri" />
  <img src="https://img.shields.io/badge/Kernel%20Driver-Linuwu--Sense-00b4d8.svg" alt="Linuwu-Sense" />
  <img src="https://img.shields.io/badge/License-GPLv3-blue.svg" alt="License" />
</p>

---

## 📖 Overview

**AcerX** is a unified, lightweight, high-performance hardware management suite for **Acer Nitro** and **Predator** gaming laptops running Linux.

It serves as a full, drop-in replacement for Windows proprietary tools (NitroSense and PredatorSense), uniting a Linux kernel module, a low-overhead memory-safe **Rust hardware daemon** (`void-controld`), and a clean, responsive **Adwaita / Cyberpunk desktop interface** (`acer-x`) built with Tauri v2 and React 19.

---

## 📂 Repository Structure

```text
AcerX/
├── app/                    # Tauri v2 + React 19 Desktop Client (acer-x)
│   ├── public/             # Branding assets (logo, icon, animated turbines)
│   ├── src/                # React dashboard, controls, tabs & cyberpunk styles
│   └── src-tauri/          # Tauri Rust bridge, telemetry & IPC client
├── daemon/                 # Privileged Rust Hardware Daemon (void-controld)
│   ├── Cargo.toml
│   ├── void-controld.service
│   └── src/main.rs         # Root sysfs/ACPI controller (<3MB memory footprint)
├── driver/                 # Linuwu-Sense Linux Kernel Driver (C module)
│   ├── Makefile
│   └── src/linuwu_sense.c  # Kernel 6.x & 7.x compatible EC/WMI driver
├── scripts/                # Hardware detection & Nitro key helpers
├── install.sh              # One-click automated production installer
├── uninstall.sh            # Complete uninstaller
├── Compatibility.md        # Tested hardware matrix & EC registers
└── README.md
```

---

## ✨ Features

### 🌀 Aerodynamic Fan & Cooling Control
* **Dual Turbine Visualizer**: Real-time RPM tracking for CPU and GPU aerodynamic blower arrays.
* **Manual PWM Curves & Auto Dynamic**: Slide duty cycle targets directly or let the dynamic EC thermal curve manage fans automatically.
* **Quiet Profile Switch**: One-click toggle for acoustic-first operation.

### ⚡ ACPI Thermal & Performance Profiles
* **Normalized Envelopes**: Full hardware support for **Eco** (`low-power`), **Silent** (`quiet`), **Balanced**, **Performance** (`balanced-performance`), and **Turbo**.
* **High-Visibility Status**: Real-time synchronized active profile highlights across the headerbar and telemetry cards.
* **Automatic Power State Adaptation**: Respects AC adapter connection and battery states.

### 📈 Smooth Multi-Metric Live Telemetry Graphs
* **SVG Fluid Animations**: Hardware telemetry curves interpolate seamlessly across incoming data points with dynamic bezier morphing.
* **4-Metric Switcher**: Toggle individual graphs on both CPU and GPU cards between:
  * **Load / Usage** (`%`)
  * **Clock Speed** (`GHz` / `MHz`)
  * **Temperature** (`°C`)
  * **Power Draw** (`W`)
* **Interactive Quick-Select**: Click directly on any metric summary box or pill button to switch graph modes instantly.
* **Live Pulsing Coordinate Beacons**: Real-time pulse indicator marking the leading edge of live readings.

### 🔋 Battery Care & Health
* **80% Battery Care Limiter**: Caps AC charging at 80% to dramatically extend lithium battery chemical longevity.
* **Battery Gauge Calibration**: Automated discharge and recharge cycle management to re-zero battery fuel gauge hardware.
* **USB Power-Off Charging**: Configure external device charging while the laptop is suspended or shut down.

### 🎨 RGB Keyboard & Hardware Customization
* **Backlight Timeout Control**: Disable or customize keyboard illumination timeouts.
* **LCD Display Overdrive**: Toggle high-response panel overdrive directly through ACPI firmware.
* **Boot Animation & Sound**: Enable or silence Acer BIOS boot chimes and splash sequences.

---

## 🏛️ Architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│                      AcerX Desktop Client                         │
│             Tauri v2 + React 19 + Tailwind CSS (Adwaita)          │
│                      (Unprivileged User Process)                  │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ JSON-RPC over Unix Domain Socket
                                  ▼ (/tmp/acerx.sock)
┌───────────────────────────────────────────────────────────────────┐
│                      void-controld Daemon                         │
│           High-Performance, Memory-Safe Rust Daemon (<3MB)        │
│                    (Systemd Root Service Unit)                    │
└──────────────────┬───────────────────────────────┬────────────────┘
                   │ Sysfs WMI / EC                │ ACPI Platform
                   ▼                               ▼
      ┌─────────────────────────┐     ┌─────────────────────────┐
      │   Linuwu-Sense Driver   │     │  /sys/firmware/acpi/    │
      │   (Kernel Module .ko)   │     │    platform_profile     │
      └────────────┬────────────┘     └─────────────────────────┘
                   ▼
┌───────────────────────────────────────────────────────────────────┐
│              Acer Nitro / Predator Embedded Controller            │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

### Option 1: One-Command Master Installer (Recommended)

Clone the repository and run the automated installer:

```bash
git clone https://github.com/your-username/AcerX.git
cd AcerX
sudo ./install.sh
```

The script will automatically:
1. Build and install the `linuwu_sense` kernel module (compatible with Linux 6.x and 7.x kernels).
2. Configure module autoloading on boot and blacklist conflicting stock modules.
3. Build and install the `void-controld` daemon with auto-restart systemd unit (`acerx.service`).
4. Install the `acer-x` desktop binary into `/usr/local/bin/acer-x`.
5. Register desktop launcher files and system icons in `/usr/share/applications/` and `/usr/share/icons/hicolor/`.

### Option 2: Building From Source Manually

#### Prerequisites
* **Arch / Manjaro / CachyOS**:
  ```bash
  sudo pacman -S base-devel linux-headers rust cargo nodejs npm webkit2gtk-4.1
  ```
* **Ubuntu / Debian / Pop!_OS**:
  ```bash
  sudo apt install build-essential linux-headers-$(uname -r) cargo nodejs npm libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
  ```
* **Fedora**:
  ```bash
  sudo dnf install @development-tools kernel-devel cargo nodejs npm webkit2gtk4.1-devel
  ```

#### Step-by-Step Build
```bash
# 1. Driver
cd driver && make && sudo make install && sudo modprobe linuwu_sense && cd ..

# 2. Daemon
cd daemon && cargo build --release
sudo install -m 755 target/release/void-controld /usr/local/bin/void-controld
sudo install -m 644 void-controld.service /etc/systemd/system/acerx.service
sudo systemctl daemon-reload && sudo systemctl enable --now acerx.service
cd ..

# 3. Desktop Application
cd app && npm install && npm run build && npx tauri build --no-bundle
sudo install -m 755 src-tauri/target/release/acer-x /usr/local/bin/acer-x
cd ..
```

---

## 🎮 Launching & Dedicated Key Setup

Launch AcerX from your desktop application launcher or run:
```bash
acer-x
```

### Dedicated Nitro / Predator Key
On Acer laptops, the dedicated **N** key (Nitro) or **PredatorSense** key sends scancode `0xf5` (mapped to Linux keycode `425` or `prog1`).
You can bind this key in your desktop settings (GNOME Settings $\rightarrow$ Keyboard $\rightarrow$ Custom Shortcuts, or in KDE / Hyprland / Sway) to run:
```bash
/usr/local/bin/acer-x
```

---

## 🗑️ Uninstallation

To cleanly remove all AcerX components, daemons, and system services:
```bash
sudo ./uninstall.sh
```

---

## 🤝 Credits & Acknowledgements

This project is built upon the foundational work of the open-source hardware reverse-engineering community:

* **[Divyansh (PXDiv)](https://github.com/PXDiv)** — Creator of the original **Div Acer Manager Max (DAMX)** project. Divyansh pioneered reverse-engineering Acer's Embedded Controller registers, thermal curves, battery calibration routines, and platform logic on Linux.
* **[0x7375646F](https://github.com/0x7375646F)** — Creator of the **[Linuwu-Sense](https://github.com/0x7375646F/Linuwu-Sense)** Linux kernel driver. 0x7375646F's kernel platform driver provides the vital low-level WMI and EC sysfs bridge enabling direct hardware communication with Acer Nitro & Predator hardware on Linux.
* **[PANDIT RUDRA SANDIP](https://github.com/rudrapandit0504)** & **[Arsh (Trex099)](https://github.com/Trex099)** — Key contributors to DAMX development, hardware testing, and Nitro key detection scripts.

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0**.  
See the [LICENSE](LICENSE) file for complete details.
