# ❓ Frequently Asked Questions (FAQ) for AcerX

---

### 🚀 What is AcerX and how does it work?

**AcerX** is a unified, lightweight Linux hardware management suite created specifically for the **Acer Nitro V 15** (and compatible Nitro/Predator laptops). It replaces Windows-only proprietary utilities (NitroSense) with a fast, modern Linux architecture:

1. **`linuwu_sense`**: A Linux kernel C driver exposing Acer ACPI/WMI sensors, dual aerodynamic fan curves, and battery registers.
2. **`void-controld`**: An ultra-low overhead, memory-safe Rust privileged hardware daemon running as a root systemd service (`acerx.service`, <3MB RAM).
3. **`acerx-nitrokey.service`**: A dedicated background service monitoring the physical Nitro key via evdev event loop.
4. **`acer-x`**: A responsive, Cyberpunk-inspired desktop HUD built with Tauri v2, React 19, and Tailwind CSS (<35MB RAM).

---

### ⌨️ Does the hardware Nitro / PredatorSense Key work automatically?

**Yes!** During `sudo ./install.sh`:
- The installer interactively prompts you: `[?] Do you want to configure your physical Nitro key now? [Y/n]`.
- Press **Y** (or Enter), and press your physical **N** / **Predator** key when prompted.
- The installer automatically captures your keyboard input device (e.g. `/dev/input/event3`) and scancode (`0xf5` / keycode `425` or `KEY_PROG1`), writes `/etc/acerx/nitro_key.conf`, and enables `acerx-nitrokey.service`.
- When you press your physical Nitro key anytime on desktop, AcerX will launch or focus immediately!
- If you skipped it during installation, you can configure it anytime:
  ```bash
  sudo /usr/local/share/acerx/scripts/nitro-key-detection.sh
  ```

---

### 🔄 Does the hardware daemon run automatically on reboot?

**Yes!** Both services are enabled as permanent systemd services:
* `acerx.service`: Starts `/usr/local/bin/void-controld` on boot and keeps fan control, telemetry sockets (`/tmp/acerx.sock`), and thermal profiles active.
* `acerx-nitrokey.service`: Listens for the physical Nitro key in the background.
* Kernel module autoloading is registered under `/etc/modules-load.d/linuwu_sense.conf`, so the driver loads seamlessly on every reboot.

You can verify their status anytime:
```bash
systemctl status acerx.service
systemctl status acerx-nitrokey.service
```

---

### 🔒 Secure Boot: Driver Installation or Modprobe Error

If Secure Boot is enabled in your UEFI/BIOS, unsigned kernel modules may be blocked with:
```text
modprobe: ERROR: could not insert 'linuwu_sense': Key was rejected by service
```

**Solution**:
1. Generate and enroll a Machine Owner Key (MOK):
   ```bash
   mkdir -p ~/module-signing && cd ~/module-signing
   openssl req -new -x509 -newkey rsa:2048 -keyout MOK.priv -outform DER -out MOK.der -nodes -days 36500 -subj "/CN=AcerX-Key/"
   sudo mokutil --import MOK.der
   ```
2. Enter a temporary password when prompted, then reboot.
3. In the blue UEFI MOK management screen, select **Enroll MOK** → **Continue** → **Yes**, enter your password, and reboot.
4. Sign the module:
   ```bash
   sudo /usr/src/linux-headers-$(uname -r)/scripts/sign-file sha256 ~/module-signing/MOK.priv ~/module-signing/MOK.der /lib/modules/$(uname -r)/kernel/drivers/platform/x86/linuwu_sense.ko
   sudo modprobe linuwu_sense
   ```
*(Alternatively, disable Secure Boot in UEFI BIOS settings).*

---

### 📊 How do the telemetry graphs and monitors work?

AcerX provides simultaneous, zero-overhead telemetry:
* **Dual Simultaneous Real-Time Graphs**:
  * **Load Graph**: Instantaneous CPU and GPU utilization percentages.
  * **Temperature Graph**: Thermal curves tracking package and hotspot temperatures in °C.
* **Secondary Telemetry Grid**:
  * **RAM Usage**: Real-time memory consumption and utilization percentage.
  * **NVMe Storage Usage**: Primary partition storage utilization and remaining capacity.
  * **Intel iGPU Monitor**: Full-width NVIDIA-style hardware card tracking Intel Xe / UHD integrated GPU utilization and clock speed.

---

### 🔋 How do I use the Battery Care Limiter?

In the AcerX desktop interface, navigate to the **Battery** tab:
* **80% Battery Care Limiter**: Toggle the limiter ON. The EC hardware will automatically stop charging at 80% to preserve chemical health and minimize heat during long plugged-in gaming or coding sessions.
* **Calibration Mode**: Cycles the battery through calibration to recalibrate the gas gauge IC.
* **USB Power-Off Charging**: Choose whether USB ports provide 5V power while the laptop is suspended or shut down.

---

### 🌀 How do Fan Controls and Profiles work?

* **Fan Tab**: Real-time tachometers show CPU and GPU blower RPMs. Switch between **Auto** (dynamic EC curve), **Max** (100% duty cycle), and **Custom** (drag fan sliders to precise percentages).
* **Thermal Profiles**: Switch between **Eco**, **Quiet**, **Balanced**, **Performance**, and **Turbo**. The active profile is synchronized directly with ACPI `platform_profile`.

---

### 🗑️ How do I completely uninstall AcerX?

Run the included uninstaller with root privileges:
```bash
sudo ./uninstall.sh
```
This cleanly stops and disables all systemd services, removes `/usr/local/bin/acer-x`, `/usr/local/bin/void-controld`, `/etc/acerx`, desktop launchers, icons, and removes the `linuwu_sense` kernel driver.

---

### 💬 Need More Help or Found a Bug?

Visit our official GitHub repository to report issues, contribute, or discuss features:
👉 **[AcerX GitHub Issues](https://github.com/MonuGurjar/AcerX/issues)**

