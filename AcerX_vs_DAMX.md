# ⚡ AcerX vs. DAMX — Architectural & Feature Comparison

This document highlights the major differences between **AcerX** and **DAMX (Div Acer Manager Max)** across performance, architecture, user interface, telemetry, and hardware integration.

---

## 📊 High-Level Comparison Matrix

| Feature / Dimension | 🛑 DAMX | 🚀 AcerX (Production) |
| :--- | :--- | :--- |
| **Target Platform** | Generic Acer models (Aspire, TravelMate, legacy Nitros) | **Engineered & tuned specifically for Acer Nitro V 15** (`ANV15-51`, `ANV15-41`) |
| **Desktop Framework** | **Avalonia (.NET / C#)** | **Tauri v2 + React 19 + TypeScript + Tailwind CSS** |
| **Hardware Daemon** | Python / C# background script | **Single-binary, memory-safe Rust daemon (`void-controld`)** |
| **Memory Footprint (UI)** | ~150 MB – 300+ MB (heavy .NET CLR runtime) | **< 35 MB RAM** (ultra-lightweight WebKitGTK engine) |
| **Memory Footprint (Daemon)** | ~40 MB – 80 MB | **< 3 MB RAM** (zero GC pauses, bare-metal efficiency) |
| **IPC Communication** | Heavy D-Bus / Process pipes | **High-speed Unix Domain Socket (`/tmp/acerx.sock`)** with JSON-RPC |
| **Startup / Launch Time** | 3 – 6 seconds (cold .NET JIT overhead) | **Near-instantaneous launch (< 300ms)** |
| **Kernel Compatibility** | Prone to build failures on modern kernels | **Seamless support for Linux 6.x & 7.x kernels** (`linuwu_sense`) |

---

## 🎨 User Interface & Experience (UI/UX)

| Visual / UX Capability | DAMX | AcerX |
| :--- | :--- | :--- |
| **Design Language** | Standard utilitarian desktop GUI | **Cyberpunk Frosted Glassmorphism** (backdrop blur, neon cyan/mint accents, mountain depth) |
| **Telemetry Curves** | Single switchable graphs or static labels | **Simultaneous Dual Graphs** (dedicated Load % graph **and** Temp °C graph side-by-side) |
| **GPU / iGPU Telemetry** | Often hidden or limited to discrete GPU | **Full-width NVIDIA-style card for Intel Xe / UHD iGPU** with clock & load sensors |
| **Secondary Telemetry** | Scattered or omitted | **Dedicated real-time row for RAM, NVMe Disk, and GPU VRAM** |
| **Fan Visualizer** | Static graphics or basic progress bars | **Custom aerodynamic animated turbine visualizer** with live RPM gauges |

---

## ⌨️ Dedicated Hardware Nitro / Predator Key

| Aspect | DAMX | AcerX |
| :--- | :--- | :--- |
| **Configuration** | Manual post-install scripting or manual DE shortcut binding | **Automatic & interactive key-press detection inside `install.sh`** |
| **Capture Method** | Relies on generic X11/Wayland shortcut bindings | Direct hardware **`evdev` input monitoring** (`/dev/input/event*`) |
| **Background Service** | None or inconsistent daemon management | Dedicated **`acerx-nitrokey.service`** running via systemd |
| **Desktop Environment Agnostic** | Often breaks when switching between GNOME, KDE, or Hyprland | Works universally across **Wayland, X11, GNOME, KDE Plasma, Hyprland, Sway, XFCE** |

---

## 🔋 Battery Care & Thermal Management

| Feature | DAMX | AcerX |
| :--- | :--- | :--- |
| **Battery Limiting** | Buried in driver module options or experimental flags | **Dedicated Battery Care tab** with instant 80% charge limiter toggle |
| **Battery Calibration** | Manual sysfs echo commands | **One-click gas-gauge calibration cycle** built into the GUI |
| **USB Power-Off Charging** | Not readily accessible in UI | Built-in toggle for 5V USB charging while suspended or shut down |
| **ACPI Platform Profiles** | Manual command execution | Synchronized **Eco, Quiet, Balanced, Performance, and Turbo** profiles |
| **Fan Duty Control** | Basic toggle presets | **Auto (dynamic EC curve), Max (100% duty), and Custom manual sliders** |

---

## 🛠️ Summary

* **DAMX** was an earlier community effort built using a heavy .NET/Avalonia stack attempting broad support for older Acer laptops.
* **AcerX** is a **next-generation, production-ready suite** designed from the ground up:
  1. **Maximum Performance**: Written in Rust and Tauri v2 for microscopic RAM and CPU consumption.
  2. **Modern Linux Standards**: Native Unix sockets, root privilege separation, systemd persistence, and Linux 6.x/7.x kernel compatibility.
  3. **Tuned for Acer Nitro V 15**: Exact register definitions, dual blower curves, and seamless physical Nitro key integration.
