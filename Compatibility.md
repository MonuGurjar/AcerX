# 💻 Hardware Compatibility Guide for AcerX

**AcerX** is a unified, lightweight, high-performance hardware management suite engineered specifically for the **Acer Nitro V 15** running Linux (kernels 6.x and 7.x).

---

## 🎯 Primary Supported Hardware

AcerX is developed, tuned, and tested directly on the **Acer Nitro V 15** platform.

| Model Series | Tested Model | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Acer Nitro V 15 (Intel)** | **ANV15-51** | 🌟 **Primary Target (Fully Verified)** | Full support: dual graphs, fans, thermal profiles, battery limiter, Nitro key daemon |
| **Acer Nitro V 15 (AMD)** | **ANV15-41** | ✅ **Fully Compatible** | Full support across all telemetry, cooling curves, and battery management |

---

## ⚡ Compatible Nitro & Predator Models

Because AcerX communicates with Acer's standard WMI/EC platform interface through the `linuwu_sense` kernel module and ACPI `platform_profile`, the following models also support AcerX hardware telemetry and controls:

| Model Series | Model | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Acer Nitro 16** | AN16-41 / AN16-43 | ✅ Supported | Full fan control, platform profiles, and telemetry |
| **Acer Nitro 17** | AN17-41 / AN17-51 | ✅ Supported | Thermal profiles and fan control operational |
| **Acer Nitro 5** | AN515-58 | ✅ Supported | Inbuilt WMI support |
| **Acer Nitro 5** | AN515-44 / AN515-47 | ✅ Supported | Kernel module exposes thermal profiles & sensors |
| **Predator Helios Neo 16** | PHN16-71 / PHN16-72 | ✅ Supported | Full telemetry, dual blower control, thermal modes |
| **Predator Helios 16** | PH16-71 | ✅ Supported | Universal Predator V4 quirk support |
| **Predator Helios 18** | PH18-71 | ✅ Supported | Full thermal envelopes & fan tracking |
| **Predator Helios 300** | PH315-53 / PH315-54 | ✅ Supported | Stable fan and sensor reporting |

> [!NOTE]
> If your Acer laptop has dual aerodynamic cooling blowers and standard Acer WMI registers, AcerX can manage thermal profiles, fan RPM tracking, and battery health out-of-the-box.

---

## 🐧 Distribution & Kernel Requirements

* **Supported Linux Distributions**:
  * **Arch Linux / EndeavourOS / CachyOS / Manjaro**
  * **Ubuntu 24.04+ / 25.04+**
  * **Debian 12+ (Bookworm / Trixie / Sid)**
  * **Fedora 40+**
  * **Pop!_OS / Linux Mint**
* **Kernel Versions**:
  * **Linux 6.x** (6.8, 6.10, 6.11, 6.12, 6.13+)
  * **Linux 7.x** (Fully supported)
* **Desktop Environments**:
  * GNOME (Wayland & X11)
  * KDE Plasma (Wayland & X11)
  * Hyprland / Sway / Wayfire
  * XFCE / Cinnamon / COSMIC

---

## 🔍 How to Check Your Laptop Model

Open your terminal and run:

```bash
sudo dmidecode -s system-product-name
```

If it returns `Nitro ANV15-51` or `Nitro ANV15-41`, your laptop is officially and natively supported with zero configuration required!

---

## 💬 Submitting New Model Reports

If you are running AcerX on another Acer Nitro or Predator laptop:
1. Verify telemetry readings, fan RPM sensors, and battery limiting.
2. Open an issue or discussion on the official GitHub repository: [AcerX GitHub Issues](https://github.com/MonuGurjar/AcerX/issues).
