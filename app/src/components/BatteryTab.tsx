import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SystemMetrics } from "../types/telemetry";

interface BatteryTabProps {
  metrics: SystemMetrics | null;
}

export const BatteryTab: React.FC<BatteryTabProps> = ({ metrics }) => {
  const [batteryLimiter, setBatteryLimiter] = useState<boolean>(true);
  const [batteryCalibration, setBatteryCalibration] = useState<boolean>(false);
  const [usbCharging, setUsbCharging] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const batteryPercent = metrics?.battery_percent ?? 100;
  const isPluggedIn = metrics?.is_plugged_in ?? true;
  const batteryStatus = metrics?.battery_status ?? (isPluggedIn ? "Charging" : "Discharging");

  useEffect(() => {
    invoke<any>("get_daemon_status")
      .then((data) => {
        if (data) {
          if (typeof data.battery_limiter === "boolean") {
            setBatteryLimiter(data.battery_limiter);
          }
          if (typeof data.battery_calibration === "boolean") {
            setBatteryCalibration(data.battery_calibration);
          }
          if (typeof data.usb_charging === "number") {
            setUsbCharging(data.usb_charging);
          }
        }
      })
      .catch((e) => console.warn("Failed to load daemon status in BatteryTab:", e));
  }, []);

  const showFeedback = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleLimiterToggle = async (enabled: boolean) => {
    try {
      await invoke("set_battery_limiter", { enabled });
      setBatteryLimiter(enabled);
      showFeedback(enabled ? "✓ 80% Battery Care Limiter Enabled" : "✓ Battery Care Limiter Disabled");
    } catch (e) {
      console.error(e);
      showFeedback(`✗ Error: ${e}`);
    }
  };

  const handleCalibrationToggle = async (enabled: boolean) => {
    try {
      await invoke("set_battery_calibration", { enabled });
      setBatteryCalibration(enabled);
      showFeedback(enabled ? "✓ Battery calibration initiated (Keep AC plugged)" : "✓ Battery calibration cancelled");
    } catch (e) {
      console.error(e);
      showFeedback(`✗ Error: ${e}`);
    }
  };

  const handleUsbChargingChange = async (level: number) => {
    try {
      await invoke("set_usb_charging", { level });
      setUsbCharging(level);
      showFeedback(`✓ USB power off charging set to ${level === 0 ? "Disabled" : `until ${level}%`}`);
    } catch (e) {
      console.error(e);
      showFeedback(`✗ Error: ${e}`);
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col overflow-y-auto bg-transparent space-y-4">
      {statusMsg && (
        <div className="text-xs py-1.5 px-3 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-400 font-medium animate-fade-in">
          {statusMsg}
        </div>
      )}

      {/* Live Battery Status Card */}
      <section className="adw-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
                <line x1="22" y1="11" x2="22" y2="13" />
                {batteryPercent > 10 && <line x1="6" y1="10" x2="6" y2="14" />}
                {batteryPercent > 35 && <line x1="9" y1="10" x2="9" y2="14" />}
                {batteryPercent > 65 && <line x1="12" y1="10" x2="12" y2="14" />}
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Live Battery Telemetry</h2>
              <p className="text-xs text-zinc-400">Embedded Controller power fuel gauge & health telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                isPluggedIn
                  ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-950/60 border-amber-500/30 text-amber-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPluggedIn ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span>{isPluggedIn ? "AC Connected" : "On Battery"}</span>
            </span>
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] text-zinc-300">
              {batteryStatus}
            </span>
          </div>
        </div>

        {/* Big Meter & Key Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 glass-tile-inset rounded-lg">
          <div className="col-span-1 flex flex-col justify-center">
            <span className="text-xs text-zinc-400">Current Charge</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold font-mono text-zinc-100">{batteryPercent}%</span>
              <span className="text-xs text-zinc-400 font-medium">State of Charge</span>
            </div>
            {/* Battery bar */}
            <div className="w-full h-2 bg-black/40 border border-white/[0.08] rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  batteryPercent > 40
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : batteryPercent > 20
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                    : "bg-gradient-to-r from-rose-500 to-red-400"
                }`}
                style={{ width: `${batteryPercent}%` }}
              />
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-2 border-l border-white/[0.08] pl-3">
            <div className="p-2 rounded-md bg-white/[0.02]">
              <span className="text-[11px] text-zinc-400 block">Care Threshold</span>
              <span className="text-sm font-semibold font-mono text-teal-300 mt-0.5 block">
                {batteryLimiter ? "80% Cap Active" : "100% Full Charge"}
              </span>
              <span className="text-[10px] text-zinc-500">EC Firmware Limiter</span>
            </div>

            <div className="p-2 rounded-md bg-white/[0.02]">
              <span className="text-[11px] text-zinc-400 block">Calibration State</span>
              <span className="text-sm font-semibold font-mono text-cyan-300 mt-0.5 block">
                {batteryCalibration ? "Cycle Active" : "Standard"}
              </span>
              <span className="text-[10px] text-zinc-500">Fuel gauge sensor sync</span>
            </div>

            <div className="p-2 rounded-md bg-white/[0.02]">
              <span className="text-[11px] text-zinc-400 block">Power Source</span>
              <span className="text-sm font-semibold font-mono text-zinc-200 mt-0.5 block">
                {isPluggedIn ? "135W AC Adapter" : "Li-ion Pack"}
              </span>
              <span className="text-[10px] text-zinc-500">DC Barrel Input</span>
            </div>

            <div className="p-2 rounded-md bg-white/[0.02]">
              <span className="text-[11px] text-zinc-400 block">Off-State USB</span>
              <span className="text-sm font-semibold font-mono text-zinc-200 mt-0.5 block">
                {usbCharging === 0 ? "Disabled" : `Limit ≥${usbCharging}%`}
              </span>
              <span className="text-[10px] text-zinc-500">Sleep/Shutdown charging</span>
            </div>
          </div>
        </div>
      </section>

      {/* Battery Care & Health Controls */}
      <section className="adw-card rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Battery Care & Lifespan Protection</h2>
          <p className="text-xs text-zinc-400">Firmware battery health optimization and charging thresholds.</p>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {/* 80% Battery Care Charge Limiter */}
          <div className="py-3 flex items-center justify-between">
            <div className="max-w-[80%]">
              <h3 className="text-xs font-semibold text-zinc-200">80% Battery Care Charge Limiter</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Caps AC charging threshold at 80% to protect the lithium-ion polymer chemistry from degradation and heat stress during continuous desk/gaming usage.
              </p>
            </div>
            <label className="relative inline-block w-8 h-4 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={batteryLimiter}
                onChange={(e) => handleLimiterToggle(e.target.checked)}
                className="sr-only adw-switch-input peer"
              />
              <div className="adw-switch-slider w-8 h-4 bg-zinc-700 rounded-full transition-colors relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:h-3 before:w-3 before:transition-transform" />
            </label>
          </div>

          {/* Battery Fuel Gauge Calibration */}
          <div className="py-3 flex items-center justify-between">
            <div className="max-w-[80%]">
              <h3 className="text-xs font-semibold text-zinc-200">Battery Fuel Gauge Calibration</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Automatically triggers a complete cycle (charge to 100%, discharge, recharge) to recalibrate the battery gauge reporting accuracy. Keep AC power connected.
              </p>
            </div>
            <label className="relative inline-block w-8 h-4 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={batteryCalibration}
                onChange={(e) => handleCalibrationToggle(e.target.checked)}
                className="sr-only adw-switch-input peer"
              />
              <div className="adw-switch-slider w-8 h-4 bg-zinc-700 rounded-full transition-colors relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:h-3 before:w-3 before:transition-transform" />
            </label>
          </div>

          {/* USB Power Delivery while laptop is off */}
          <div className="pt-3 flex items-center justify-between">
            <div className="max-w-[70%]">
              <h3 className="text-xs font-semibold text-zinc-200">USB Power-Off Device Charging</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Provides continuous 5V power to the rear USB-A port to charge mobile devices when the laptop is shutdown, hibernating, or suspended.
              </p>
            </div>
            <div className="segmented-control inline-flex items-center gap-0.5 text-xs font-medium text-zinc-400">
              {[
                { val: 0, label: "Off" },
                { val: 10, label: "≥10%" },
                { val: 20, label: "≥20%" },
                { val: 30, label: "≥30%" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleUsbChargingChange(opt.val)}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] transition-all focus:outline-none ${
                    usbCharging === opt.val
                      ? "text-zinc-100 bg-[#2d2d33] shadow-sm font-medium"
                      : "hover:text-zinc-200 text-zinc-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
