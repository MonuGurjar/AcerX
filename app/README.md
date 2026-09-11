# VOID CONTROL

**VOID CONTROL** is a next-generation Linux control utility for Acer laptops (Nitro & Predator series) built with **React**, **TypeScript**, **Custom CSS**, **Tauri v2**, **Rust**, and the **Linuwu-Sense** C kernel module.

---

## ✨ Features

* 🚀 **Cyberpunk Neon HUD Interface**: Dark frosted glassmorphism with high-contrast glowing cyan & mint accents.
* ⚡ **Ultra-Fast & Memory-Light**: Built on Tauri v2 (WebKitGTK + Rust) consuming under 35MB RAM (compared to ~250MB for legacy frameworks).
* 🧠 **Single-Binary Root Daemon**: Memory-safe Rust hardware daemon (`void-controld`) replacing the Python daemon, running under 3MB RAM.
* 📊 **Real-time 60 FPS Telemetry**: Dual CPU and GPU primary cards with live HTML5 Canvas sparklines, clocks, utilization, thermals, and power draw (Watts via RAPL).
* 🌬 **Acoustic & Fan Control**: Compact bottom fan ribbon with live RPM tachometers, plus a dedicated **Fans** tab with manual speed sliders and Auto/Max/Custom presets.
* 🔋 **Battery Care**: 80% charge limiter switch and power health management.
* 🖥 **Hardware Overrides**: LCD 3ms Response Overdrive toggle, Acer boot chime & logo animation toggle, and 30s keyboard idle backlight timeout.

---

## 🏗️ Architecture

```
React + TypeScript + Custom CSS (Cyberpunk HUD)
       │
       ▼ (Tauri v2 IPC: Events & Commands)
Tauri Desktop Backend (Rust Unprivileged)
       │
       ▼ (Unix Domain Socket: /run/void-control.sock)
void-controld (Rust Privileged Hardware Daemon / Root)
       │
       ▼ (Linux SysFS & ACPI Platform Profile)
Linuwu-Sense Driver (C Kernel Module / acer-wmi)
       │
       ▼ (ACPI WMI Calls)
Acer Laptop Hardware (Nitro / Predator)
```

---

## 🚀 Getting Started

### 1. Install and Start the Daemon (One-time setup)

The hardware daemon requires root privileges to interact with SysFS and WMI interfaces:

```bash
sudo ./setup-daemon.sh
```

### 2. Run in Development Mode

```bash
npm run tauri dev
```

### 3. Build Release Package

To create an optimized, standalone binary:

```bash
npm run tauri build
```
