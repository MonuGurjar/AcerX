# AcerX Desktop Client

**AcerX** is a next-generation Linux control utility tailored specifically for the **Acer Nitro V 15** built with **React 19**, **TypeScript**, **Tauri v2**, **Rust**, and the **Linuwu-Sense** kernel module.

---

## 🛠️ What I Built & Changed in AcerX

* **Tailored for Nitro V 15**: Register mappings and fan speed logic tuned specifically for the Acer Nitro V 15.
* **Modern Lightweight Stack**: Built client with **Tauri v2 + React 19 + TypeScript** consuming <35MB RAM.
* **Single-Binary Rust Daemon**: Created compiled Rust daemon `void-controld` (<3MB RAM) over high-speed Unix sockets.
* **Frosted Glassmorphism HUD**: Cyberpunk translucent glass cards, wallpaper glow, and custom sidebar artwork (`sidebaar-bg.png`).
* **Live 60 FPS Telemetry**: Smooth SVG sparklines with interactive metric switching (Load, Clock, Temp, Power).

---

## ✨ Features

* 🚀 **Cyberpunk Neon HUD Interface**: Dark frosted glassmorphism with high-contrast glowing cyan & mint accents.
* ⚡ **Ultra-Fast & Memory-Light**: Built on Tauri v2 (WebKitGTK + Rust) consuming under 35MB RAM.
* 🧠 **Single-Binary Root Daemon**: Memory-safe Rust hardware daemon (`void-controld`) running under 3MB RAM.
* 📊 **Real-time 60 FPS Telemetry**: Dual CPU and GPU primary cards with live SVG sparklines, clocks, utilization, thermals, and power draw (Watts via RAPL).
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
       ▼ (Unix Domain Socket: /tmp/acerx.sock)
void-controld (Rust Privileged Hardware Daemon / Root)
       │
       ▼ (Linux SysFS & ACPI Platform Profile)
Linuwu-Sense Driver (C Kernel Module / acer-wmi)
       │
       ▼ (ACPI WMI Calls)
Acer Nitro V 15 Hardware
```

---

## 🚀 Getting Started

### 1. Run in Development Mode

```bash
npm run tauri dev
```

### 2. Build Release Package

```bash
npm run tauri build
```

---

## 🤝 Credits & Acknowledgements

* **[Divyansh (PXDiv)](https://github.com/PXDiv)** — Author of **[Div Acer Manager Max (DAMX)](https://github.com/PXDiv/Div-Acer-Manager-Max)** (Core platform logic & Nitro key protocol)
* **[0x7375646F](https://github.com/0x7375646F)** — Author of the **[Linuwu-Sense](https://github.com/0x7375646F/Linuwu-Sense)** kernel module (ACPI/WMI reverse engineering & kernel platform driver)
* **[hridaycode1119](https://github.com/hridaycode1119)** — Hardware testing, telemetry calibration, and QA verification on Acer Nitro V 15



