# AcerX Desktop Client

**AcerX** is a next-generation Linux control utility tailored specifically for the **Acer Nitro V 15** built with **React 19**, **TypeScript**, **Tauri v2**, **Rust**, and the **Linuwu-Sense** kernel module.

---

## 🛠️ Built for Production

* **Tailored for Nitro V 15**: Register mappings and fan speed curves tuned specifically for Acer Nitro V 15.
* **Modern Lightweight Stack**: Built client with **Tauri v2 + React 19 + TypeScript** consuming <35MB RAM.
* **Single-Binary Rust Daemon**: Created compiled Rust daemon `void-controld` (<3MB RAM) over high-speed Unix sockets.
* **Frosted Glassmorphism HUD**: Cyberpunk translucent glass cards, wallpaper glow, and custom sidebar artwork (`sidebaar-bg.png`).
* **Simultaneous Dual Graphs**: Real-time independent Load (%) and Temperature (°C) graphs on both CPU and GPU cards.
* **Secondary Telemetry Suite**: RAM utilization, NVMe storage usage, and NVIDIA-styled Intel iGPU card.
* **Dedicated Battery Care**: 80% charge limiter and battery calibration tab.

---

## ✨ Features

* 🚀 **Cyberpunk Neon HUD Interface**: Dark frosted glassmorphism with high-contrast glowing cyan & mint accents.
* ⚡ **Ultra-Fast & Memory-Light**: Built on Tauri v2 (WebKitGTK + Rust) consuming under 35MB RAM.
* 🧠 **Single-Binary Root Daemon**: Memory-safe Rust hardware daemon (`void-controld`) running under 3MB RAM.
* 📊 **Simultaneous Dual Telemetry Graphs**: Dual CPU and GPU primary cards with live SVG Load and Temperature sparklines.
* 🎮 **Full Telemetry Dashboard**: Real-time RAM metrics, NVMe storage tracking, and full-width Intel iGPU monitor card.
* 🌬 **Acoustic & Fan Control**: Compact bottom fan ribbon with live RPM tachometers, plus a dedicated **Fans** tab with manual speed sliders and Auto/Max presets.
* 🔋 **Dedicated Battery Care Tab**: 80% charge limiter switch, battery calibration, and USB power-off charging.
* 🖥 **Hardware Overrides**: LCD Response Overdrive toggle, Acer boot chime & logo animation toggle, and 30s keyboard idle backlight timeout.

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

## 👤 Author

Developed and maintained by **[Monu Gurjar](https://github.com/MonuGurjar)**.

---

## 🙏 Credits & Acknowledgements

### Linuwu-Sense

AcerX uses the Linux hardware driver from
[Linuwu-Sense](https://github.com/0x7375646F/Linuwu-Sense).

We gratefully acknowledge the original developer and contributors of
Linuwu-Sense for their work enabling hardware control and support for
Acer laptops on Linux.

### Div Acer Manager Max

During the development of AcerX, we studied
[Div Acer Manager Max (DAMX)](https://github.com/PXDiv/Div-Acer-Manager-Max)
as a reference for Linux Acer hardware-management workflows and for
exploring how application interfaces can interact with lower-level
hardware-control components.

AcerX is an independent implementation with its own architecture,
codebase, and technology stack, built with Rust, TypeScript, and Tauri.

### Disclaimer

AcerX is an independent community project and is not affiliated with,
endorsed by, or sponsored by Acer, Linuwu-Sense, or Div Acer Manager Max.




