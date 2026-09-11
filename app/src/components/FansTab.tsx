import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FanMetrics } from "../types/telemetry";

interface FansTabProps {
  fans: FanMetrics | null;
}

export const FansTab: React.FC<FansTabProps> = ({ fans }) => {
  const [cpuSpeed, setCpuSpeed] = useState<number>(75);
  const [gpuSpeed, setGpuSpeed] = useState<number>(75);
  const [mode, setMode] = useState<"auto" | "max" | "custom">("auto");
  const [applied, setApplied] = useState(false);

  // Sync mode and duty targets from hardware when telemetry updates
  useEffect(() => {
    if (fans) {
      if (fans.cpu_is_auto && fans.gpu_is_auto) {
        setMode("auto");
      } else if (fans.cpu_duty === 100 && fans.gpu_duty === 100) {
        setMode("max");
      } else {
        setMode("custom");
      }

      if (fans.cpu_duty !== undefined && fans.cpu_duty > 0) {
        setCpuSpeed(fans.cpu_duty);
      }
      if (fans.gpu_duty !== undefined && fans.gpu_duty > 0) {
        setGpuSpeed(fans.gpu_duty);
      }
    }
  }, [fans?.cpu_is_auto, fans?.gpu_is_auto, fans?.cpu_duty, fans?.gpu_duty]);

  const applySpeeds = async (cSpeed: number, gSpeed: number) => {
    try {
      await invoke("set_fan_speeds", { cpu: cSpeed, gpu: gSpeed });
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    } catch (e) {
      console.error("Failed to set fan speeds:", e);
    }
  };

  const handleModeChange = (newMode: "auto" | "max" | "custom") => {
    setMode(newMode);
    if (newMode === "auto") {
      applySpeeds(0, 0);
    } else if (newMode === "max") {
      applySpeeds(100, 100);
    } else {
      applySpeeds(cpuSpeed, gpuSpeed);
    }
  };

  // Hardware max RPM: CPU blower reaches ~8100 RPM, GPU blower reaches ~7500 RPM on full 100% duty
  const cpuPct = Math.min(Math.max(Math.round(((fans?.cpu_rpm || 0) / 8100) * 100), fans?.cpu_rpm ? 5 : 0), 100);
  const gpuPct = Math.min(Math.max(Math.round(((fans?.gpu_rpm || 0) / 7500) * 100), fans?.gpu_rpm ? 5 : 0), 100);

  return (
    <div className="flex-1 p-4 flex flex-col overflow-y-auto bg-transparent space-y-4">
      <section className="adw-card rounded-xl p-5 flex flex-col relative overflow-hidden" data-purpose="fan-controls-panel">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Top Header Row with Mode Selector */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Cooling &amp; Acoustics</h2>
            <p className="text-xs text-zinc-400">AeroBlade 3D Turbine acoustics and duty control.</p>
          </div>

          {/* Mode Selector */}
          <div className="segmented-control inline-flex items-center gap-0.5 text-xs font-medium text-zinc-400 glass-tile-inset p-1 rounded-lg">
            {(["auto", "max", "custom"] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-3.5 py-1 rounded-[7px] capitalize transition-all focus:outline-none ${
                  mode === m
                    ? "text-zinc-100 bg-white/[0.14] border border-white/15 shadow-sm font-medium backdrop-blur-sm"
                    : "hover:text-zinc-200 text-zinc-400"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Big Animated Fans Section Above */}
        <div className="grid grid-cols-2 gap-6 relative z-10">
          {/* CPU Turbine Card */}
          <div className="glass-tile-inset rounded-xl p-4 flex flex-col items-center gap-4">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">CPU Blower</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/[0.08] text-zinc-300 border border-white/[0.12] backdrop-blur-sm">
                {fans?.cpu_is_auto ? "Auto PWM" : "Manual"}
              </span>
            </div>

            {/* Big Animated Fan Circle */}
            <div className="relative w-32 h-32 flex items-center justify-center my-1">
              <img
                src="/acerx-animated-fan.svg"
                alt="CPU Aerodynamic Turbine"
                className="w-32 h-32 drop-shadow-[0_0_22px_rgba(45,212,191,0.4)]"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-white bg-zinc-950/85 px-2.5 py-0.5 rounded-full border border-teal-500/50 backdrop-blur-sm shadow-md">
                  {cpuPct}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gnome-accent font-mono font-semibold">
                {(fans?.cpu_rpm ?? 0).toLocaleString()} RPM
              </p>
            </div>

            {/* Slider Config Below the Fan */}
            <div className="w-full space-y-1.5 pt-2 border-t border-white/[0.08]">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Manual Duty Target</span>
                <span className="font-medium text-zinc-200">{cpuSpeed}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={cpuSpeed}
                disabled={mode !== "custom"}
                onChange={(e) => setCpuSpeed(parseInt(e.target.value))}
                className="w-full h-1.5 bg-black/40 border border-white/[0.08] rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
          </div>

          {/* GPU Turbine Card */}
          <div className="glass-tile-inset rounded-xl p-4 flex flex-col items-center gap-4">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">GPU Blower</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/[0.08] text-zinc-300 border border-white/[0.12] backdrop-blur-sm">
                {fans?.gpu_is_auto ? "Auto PWM" : "Manual"}
              </span>
            </div>

            {/* Big Animated Fan Circle */}
            <div className="relative w-32 h-32 flex items-center justify-center my-1">
              <img
                src="/acerx-animated-fan.svg"
                alt="GPU Aerodynamic Turbine"
                className="w-32 h-32 drop-shadow-[0_0_22px_rgba(6,182,212,0.4)]"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-white bg-zinc-950/85 px-2.5 py-0.5 rounded-full border border-cyan-500/50 backdrop-blur-sm shadow-md">
                  {gpuPct}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-cyan-400 font-mono font-semibold">
                {(fans?.gpu_rpm ?? 0).toLocaleString()} RPM
              </p>
            </div>

            {/* Slider Config Below the Fan */}
            <div className="w-full space-y-1.5 pt-2 border-t border-white/[0.08]">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Manual Duty Target</span>
                <span className="font-medium text-zinc-200">{gpuSpeed}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={gpuSpeed}
                disabled={mode !== "custom"}
                onChange={(e) => setGpuSpeed(parseInt(e.target.value))}
                className="w-full h-1.5 bg-black/40 border border-white/[0.08] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Custom Mode Apply Action */}
        {mode === "custom" && (
          <div className="mt-5 flex items-center justify-center gap-3 relative z-10">
            <button
              onClick={() => applySpeeds(cpuSpeed, gpuSpeed)}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-zinc-100 text-xs font-medium transition-colors focus:outline-none shadow-md"
            >
              Apply Fan Speeds
            </button>
            {applied && (
              <span className="text-xs text-teal-400 flex items-center gap-1.5">
                ✓ Speeds applied to hardware
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
