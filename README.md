<p align="center">
  <img src="app/public/logo.png" alt="AcerX Logo" width="220" />
</p>

<h1 align="center">AcerX</h1>
<h3 align="center">Modern Linux Hardware Control Suite tailored for Acer Nitro V 15</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Device-Acer%20Nitro%20V%2015-teal.svg" alt="Acer Nitro V 15" />
  <img src="https://img.shields.io/badge/Platform-Linux-orange.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Daemon-Rust-DEA584.svg" alt="Rust Daemon" />
  <img src="https://img.shields.io/badge/Frontend-Tauri%20v2%20%2B%20React%2019-24C8D8.svg" alt="Tauri" />
  <img src="https://img.shields.io/badge/Kernel%20Driver-Linuwu--Sense-00b4d8.svg" alt="Linuwu-Sense" />
  <img src="https://img.shields.io/badge/License-GPLv3-blue.svg" alt="License" />
</p>

---

## 📖 Overview

> [!NOTE]
> **AcerX is currently built and tuned specifically for the Acer Nitro V 15 series.**

**AcerX** is a unified, lightweight, high-performance hardware management suite engineered specifically for the **Acer Nitro V 15** running Linux.

It serves as a full, drop-in replacement for Windows proprietary tools (NitroSense), uniting a Linux kernel module, an ultra-low-overhead memory-safe **Rust hardware daemon** (`void-controld`), and an aesthetic **Cyberpunk Frosted Glassmorphism interface** (`acer-x`) built with Tauri v2 and React 19.

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

### 📈 Smooth Simultaneous Dual Telemetry Graphs
* **Simultaneous Dual Graphs**: Real-time independent SVG sparkline graphs for both CPU and GPU:
  * **Load / Usage Graph**: Smooth real-time utilization % tracking with dynamic fill gradients.
  * **Temperature Graph**: Dedicated thermal curves tracking °C with live coordinate beacons.
* **GPU Memory Monitor**: Live VRAM allocation tracking (Used / Total MB) displayed directly on the dedicated GPU card.
* **Secondary Telemetry Grid**:
  * **RAM Usage**: Real-time memory consumption (GB) and utilization percentage.
  * **NVMe Storage Usage**: Primary root filesystem disk allocation and usage metric.
  * **Intel iGPU Monitor**: Full-width hardware monitor card for Intel Xe / UHD integrated graphics, styled symmetrically to the NVIDIA GPU.

### 🔋 Dedicated Battery Care Tab
* **80% Battery Health Limiter**: Caps AC charging at 80% via ACPI EC registers to prevent battery degradation during prolonged plugged-in use.
* **Battery Gauge Calibration**: Automated full cycle calibration mode to re-zero hardware gas gauge sensors.
* **USB Power-Off Charging**: Toggle external 5V USB power delivery when the laptop is suspended or shut down.

### 🎨 Hardware Customization
* **Backlight Timeout Control**: Disable or customize 30s keyboard illumination timeouts.
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

### Option 1: One-Command Fast Install (Pre-compiled Release)

For users who don't want to install Rust, Node.js, or build from scratch, download and install in a single command:

```bash
curl -sL https://github.com/MonuGurjar/AcerX/releases/latest/download/AcerX-NitroV15-v0.1.0-linux-x86_64.tar.gz | tar -xz && cd AcerX-NitroV15-*-linux-x86_64 && sudo ./install.sh
```

Or step-by-step:
```bash
# 1. Download & extract
wget https://github.com/MonuGurjar/AcerX/releases/latest/download/AcerX-NitroV15-v0.1.0-linux-x86_64.tar.gz
tar -xvf AcerX-NitroV15-v0.1.0-linux-x86_64.tar.gz
cd AcerX-NitroV15-v0.1.0-linux-x86_64

# 2. Run the installer (interactive Nitro key detection included!)
sudo ./install.sh
```

---

### Option 2: Clone & Install from Source

Clone the repository and run the automated installer:

```bash
git clone https://github.com/MonuGurjar/AcerX.git
cd AcerX
sudo ./install.sh
```

The script will automatically:
1. Build and install the `linuwu_sense` kernel module (compatible with Linux 6.x and 7.x kernels).
2. Configure module autoloading on boot (`/etc/modules-load.d/linuwu_sense.conf`).
3. Build and install the `void-controld` daemon with auto-restart systemd unit (`acerx.service`).
4. Interactively detect and register your physical hardware **Nitro** key (`acerx-nitrokey.service`).
5. Install the `acer-x` desktop binary into `/usr/local/bin/acer-x`.
6. Register desktop launcher files and system icons in `/usr/share/applications/` and `/usr/share/icons/hicolor/`.

---

## 🎮 Launching & Dedicated Key Setup

Launch AcerX from your desktop application launcher or run:
```bash
acer-x
```

### Dedicated Nitro / Predator Key
During installation, AcerX offers interactive one-key configuration. If you ever need to reconfigure or change your physical key binding:
```bash
sudo /usr/local/share/acerx/scripts/nitro-key-detection.sh
```
The background daemon `acerx-nitrokey.service` will automatically launch or focus AcerX whenever the physical **N** / **Predator** key is pressed!

---

## 🗑️ Uninstallation

To cleanly remove all AcerX components, daemons, and system services:
```bash
sudo ./uninstall.sh
```

---

## 🛠️ Built for Production

* **Tailored for Acer Nitro V 15**: Tuned fan duty curves, platform power envelopes, and register behaviors specifically for Acer Nitro V 15 hardware (`ANV15-51` / `ANV15-41`).
* **Tauri v2 + React 19 Client**: Re-engineered desktop interface with Tauri v2, React 19, TypeScript, and Tailwind CSS (<35MB RAM).
* **Single-Binary Rust Hardware Daemon (`void-controld`)**: High-performance, memory-safe compiled Rust daemon running as a systemd service consuming under 3MB RAM, communicating over high-speed Unix Domain Sockets (`/tmp/acerx.sock`).
* **Simultaneous Dual Graphs**: Real-time CPU & GPU telemetry with live Load and Temperature SVG sparklines.
* **Full Telemetry Suite**: RAM, NVMe disk, and symmetric Intel iGPU telemetry cards.
* **Dedicated Battery Care**: 80% charge limiter and battery calibration.

---

## 👤 Author

Developed and maintained by **[Monu Gurjar](https://github.com/MonuGurjar)**.

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0**.  
See the [LICENSE](LICENSE) file for complete details.
