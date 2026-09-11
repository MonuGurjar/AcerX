import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { isProfileActive } from "./TopBar";

interface PerformanceTabProps {
  currentProfile: string;
  onProfileChange: (p: string) => void;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
  currentProfile,
  onProfileChange,
}) => {
  const [batteryLimiter, setBatteryLimiter] = useState<boolean>(true);
  const [batteryCalibration, setBatteryCalibration] = useState<boolean>(false);
  const [usbCharging, setUsbCharging] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  React.useEffect(() => {
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
      .catch((e) => console.warn("Failed to load daemon status in PerformanceTab:", e));
  }, []);

  const showFeedback = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleProfileClick = async (profile: string) => {
    try {
      await invoke("set_thermal_profile", { profile });
      onProfileChange(profile);
      showFeedback(`✓ Switched profile to ${profile.toUpperCase()}`);
    } catch (e) {
      console.error(e);
      showFeedback(`✗ Error: ${e}`);
    }
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
      showFeedback(enabled ? "✓ Battery calibration started (keep AC connected)" : "✓ Battery calibration cancelled");
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

  const profiles = [
    {
      id: "eco",
      title: "Eco",
      desc: "Minimizes CPU energy dissipation and caps clocks for maximum battery longevity.",
    },
    {
      id: "silent",
      title: "Silent",
      desc: "Strictly acoustic-first throttling to keep fans near inaudible levels.",
    },
    {
      id: "balanced",
      title: "Balanced",
      desc: "Standard dynamic operating envelope adapting to real-time process load.",
    },
    {
      id: "performance",
      title: "Performance",
      desc: "Unlocks maximum sustained wattage, aggressive fan response, and high boost clocks.",
    },
  ];

  return (
    <div className="flex-1 p-4 flex flex-col overflow-y-auto bg-gnome-bg space-y-4">
      {statusMsg && (
        <div className="text-xs py-1.5 px-3 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-400 font-medium">
          {statusMsg}
        </div>
      )}

      {/* Profiles Card */}
      <section className="adw-card rounded-xl p-4">
        <div className="mb-3.5">
          <h2 className="text-sm font-semibold text-zinc-100">Performance Envelopes</h2>
          <p className="text-xs text-zinc-400">
            Hardware power envelopes tuned through ACPI platform profiles.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2">
          {profiles.map((p) => {
            const isActive = isProfileActive(currentProfile, p.id);
            return (
              <div
                key={p.id}
                onClick={() => handleProfileClick(p.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? "bg-zinc-800 border-teal-500/60 shadow-sm ring-1 ring-teal-500/30"
                    : "bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${isActive ? "text-teal-300" : "text-zinc-200"}`}>
                    {p.title}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-950/60 border border-teal-500/40 text-teal-300">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Battery & Power Hardware Controls */}
      <section className="adw-card rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Battery & Power Health</h2>
          <p className="text-xs text-zinc-400">Firmware battery care and external device charging configuration.</p>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {/* 80% Battery Care Charge Limiter */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200">80% Battery Care Charge Limiter</h3>
              <p className="text-[11px] text-zinc-400">
                Preserves lithium battery chemistry health by capping AC charging at 80%.
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

          {/* Battery Calibration */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200">Battery Fuel Gauge Calibration</h3>
              <p className="text-[11px] text-zinc-400">
                Calibrates battery gauge (charges to 100%, drains to 0%, recharges to 100%). Do not disconnect AC.
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
            <div>
              <h3 className="text-xs font-semibold text-zinc-200">USB Power-Off Charging</h3>
              <p className="text-[11px] text-zinc-400">
                Supply power to USB charging ports while the laptop is shut down or sleeping.
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
