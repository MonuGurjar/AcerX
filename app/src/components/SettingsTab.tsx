import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SystemMetrics } from "../types/telemetry";

interface SettingsTabProps {
  metrics: SystemMetrics | null;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ metrics }) => {
  const [lcdOverride, setLcdOverride] = useState<boolean>(true);
  const [bootSound, setBootSound] = useState<boolean>(false);
  const [backlightTimeout, setBacklightTimeout] = useState<boolean>(true);

  React.useEffect(() => {
    invoke<any>("get_daemon_status")
      .then((data) => {
        if (data) {
          if (typeof data.lcd_override === "boolean") {
            setLcdOverride(data.lcd_override);
          }
          if (typeof data.boot_sound === "boolean") {
            setBootSound(data.boot_sound);
          }
          if (typeof data.backlight_timeout === "boolean") {
            setBacklightTimeout(data.backlight_timeout);
          }
        }
      })
      .catch((e) => console.warn("Failed to load daemon status in SettingsTab:", e));
  }, []);

  const toggleLcd = async (enabled: boolean) => {
    try {
      await invoke("set_lcd_override", { enabled });
      setLcdOverride(enabled);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBootSound = async (enabled: boolean) => {
    try {
      await invoke("set_boot_sound", { enabled });
      setBootSound(enabled);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBacklight = async (enabled: boolean) => {
    try {
      await invoke("set_backlight_timeout", { enabled });
      setBacklightTimeout(enabled);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col overflow-y-auto bg-transparent space-y-4">
      {/* Hardware Toggles */}
      <section className="adw-card rounded-xl p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-zinc-100">Hardware Preferences</h2>
          <p className="text-xs text-zinc-400">Firmware overrides and ACPI accessory behaviors.</p>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {/* LCD Overdrive */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200">LCD 3ms Response Overdrive</h3>
              <p className="text-[11px] text-zinc-400">
                Reduces panel latency and eliminates pixel ghosting in high refresh modes.
              </p>
            </div>
            <label className="relative inline-block w-8 h-4 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={lcdOverride}
                onChange={(e) => toggleLcd(e.target.checked)}
                className="sr-only adw-switch-input peer"
              />
              <div className="adw-switch-slider w-8 h-4 bg-zinc-700 rounded-full transition-colors relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:h-3 before:w-3 before:transition-transform" />
            </label>
          </div>

          {/* Boot Sound */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200">Acer Startup Chime &amp; Logo Animation</h3>
              <p className="text-[11px] text-zinc-400">
                Play Acer Nitro / Predator chime and animation during UEFI boot sequence.
              </p>
            </div>
            <label className="relative inline-block w-8 h-4 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={bootSound}
                onChange={(e) => toggleBootSound(e.target.checked)}
                className="sr-only adw-switch-input peer"
              />
              <div className="adw-switch-slider w-8 h-4 bg-zinc-700 rounded-full transition-colors relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:h-3 before:w-3 before:transition-transform" />
            </label>
          </div>

          {/* Backlight Timeout */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200">Keyboard Backlight Sleep (30s)</h3>
              <p className="text-[11px] text-zinc-400">
                Turn off RGB keyboard illumination after 30 seconds of user inactivity.
              </p>
            </div>
            <label className="relative inline-block w-8 h-4 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={backlightTimeout}
                onChange={(e) => toggleBacklight(e.target.checked)}
                className="sr-only adw-switch-input peer"
              />
              <div className="adw-switch-slider w-8 h-4 bg-zinc-700 rounded-full transition-colors relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:h-3 before:w-3 before:transition-transform" />
            </label>
          </div>
        </div>
      </section>

      {/* System Status Card */}
      <section className="adw-card rounded-xl p-4">
        <h2 className="text-xs font-semibold text-zinc-200 mb-2.5">System &amp; Driver Environment</h2>
        <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Model</span>
            <span className="text-zinc-200 font-medium">{metrics?.laptop_model || "Acer Nitro 16 / 17"}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Kernel Module</span>
            <span className="text-teal-400 font-medium">Linuwu-Sense (acer-wmi)</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Daemon IPC</span>
            <span className="text-zinc-200 font-mono text-[11px]">/run/void-control.sock</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Stack</span>
            <span className="text-zinc-200 font-medium">Libadwaita + React + Tauri v2</span>
          </div>
        </div>
      </section>
    </div>
  );
};
