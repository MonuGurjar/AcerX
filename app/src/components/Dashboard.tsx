import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SystemMetrics } from "../types/telemetry";
import { Sparkline } from "./Sparkline";

interface DashboardProps {
  metrics: SystemMetrics | null;
}

export type TelemetryMetric = "load" | "clock" | "temp" | "power";

export const Dashboard: React.FC<DashboardProps> = ({ metrics }) => {
  const [cpuMetric, setCpuMetric] = useState<TelemetryMetric>("load");
  const [gpuMetric, setGpuMetric] = useState<TelemetryMetric>("load");

  // CPU metric histories (constant length 20 for silky smooth SVG morphing)
  const [cpuLoadHistory, setCpuLoadHistory] = useState<number[]>(() => Array(20).fill(30));
  const [cpuClockHistory, setCpuClockHistory] = useState<number[]>(() => Array(20).fill(2.5));
  const [cpuTempHistory, setCpuTempHistory] = useState<number[]>(() => Array(20).fill(55));
  const [cpuPowerHistory, setCpuPowerHistory] = useState<number[]>(() => Array(20).fill(35));

  // GPU metric histories
  const [gpuLoadHistory, setGpuLoadHistory] = useState<number[]>(() => Array(20).fill(20));
  const [gpuClockHistory, setGpuClockHistory] = useState<number[]>(() => Array(20).fill(800));
  const [gpuTempHistory, setGpuTempHistory] = useState<number[]>(() => Array(20).fill(50));
  const [gpuPowerHistory, setGpuPowerHistory] = useState<number[]>(() => Array(20).fill(40));

  const [cpuFanTarget, setCpuFanTarget] = useState<number>(0);
  const [gpuFanTarget, setGpuFanTarget] = useState<number>(0);
  const [quietProfile, setQuietProfile] = useState(false);

  useEffect(() => {
    if (metrics) {
      setCpuLoadHistory((prev) => [...prev.slice(1), metrics.cpu.utilization_percent]);
      setCpuClockHistory((prev) => [...prev.slice(1), metrics.cpu.clock_ghz]);
      setCpuTempHistory((prev) => [...prev.slice(1), metrics.cpu.temp_celsius]);
      setCpuPowerHistory((prev) => [...prev.slice(1), metrics.cpu.power_watts]);

      setGpuLoadHistory((prev) => [...prev.slice(1), metrics.gpu.utilization_percent]);
      setGpuClockHistory((prev) => [...prev.slice(1), metrics.gpu.core_clock_mhz]);
      setGpuTempHistory((prev) => [...prev.slice(1), metrics.gpu.temp_celsius]);
      setGpuPowerHistory((prev) => [...prev.slice(1), metrics.gpu.power_watts]);

      if (metrics.fans) {
        if (metrics.fans.cpu_duty !== undefined) {
          setCpuFanTarget(metrics.fans.cpu_duty);
        }
        if (metrics.fans.gpu_duty !== undefined) {
          setGpuFanTarget(metrics.fans.gpu_duty);
        }
      }
    }
  }, [metrics]);

  const cpu = metrics?.cpu || {
    name: "AMD Ryzen 7 7840HS (16T)",
    clock_ghz: 4.2,
    utilization_percent: 48,
    temp_celsius: 58,
    power_watts: 45,
  };

  const gpu = metrics?.gpu || {
    name: "NVIDIA GeForce RTX 4070 Laptop",
    core_clock_mhz: 1850,
    vram_used_gb: 5.4,
    vram_total_gb: 8.0,
    temp_celsius: 64,
    power_watts: 95,
    utilization_percent: 42,
  };

  const fans = metrics?.fans || {
    cpu_rpm: 0,
    cpu_is_auto: true,
    cpu_duty: 0,
    gpu_rpm: 0,
    gpu_is_auto: true,
    gpu_duty: 0,
  };

  const getCpuMetricConfig = () => {
    switch (cpuMetric) {
      case "clock":
        return {
          label: "Clock Speed",
          currentValue: `${cpu.clock_ghz.toFixed(2)} GHz`,
          history: cpuClockHistory,
          min: 0,
          max: Math.max(5.0, Math.ceil(cpu.clock_ghz + 0.5)),
          unit: "GHz",
          color: "#38bdf8",
        };
      case "temp":
        return {
          label: "Temperature",
          currentValue: `${cpu.temp_celsius.toFixed(0)}°C`,
          history: cpuTempHistory,
          min: 30,
          max: 105,
          unit: "°C",
          color: "#f87171",
        };
      case "power":
        return {
          label: "Power Draw",
          currentValue: `${cpu.power_watts.toFixed(0)} W`,
          history: cpuPowerHistory,
          min: 0,
          max: Math.max(100, Math.ceil(cpu.power_watts + 15)),
          unit: "W",
          color: "#fbbf24",
        };
      case "load":
      default:
        return {
          label: "Load / Usage",
          currentValue: `${cpu.utilization_percent.toFixed(0)}%`,
          history: cpuLoadHistory,
          min: 0,
          max: 100,
          unit: "%",
          color: "#2dd4bf",
        };
    }
  };

  const getGpuMetricConfig = () => {
    switch (gpuMetric) {
      case "clock":
        return {
          label: "Core Clock",
          currentValue: `${gpu.core_clock_mhz.toFixed(0)} MHz`,
          history: gpuClockHistory,
          min: 0,
          max: Math.max(2600, Math.ceil(gpu.core_clock_mhz + 200)),
          unit: "MHz",
          color: "#38bdf8",
        };
      case "temp":
        return {
          label: "Temperature",
          currentValue: `${gpu.temp_celsius.toFixed(0)}°C`,
          history: gpuTempHistory,
          min: 30,
          max: 100,
          unit: "°C",
          color: "#f87171",
        };
      case "power":
        return {
          label: "Power Draw",
          currentValue: `${gpu.power_watts.toFixed(0)} W`,
          history: gpuPowerHistory,
          min: 0,
          max: Math.max(140, Math.ceil(gpu.power_watts + 20)),
          unit: "W",
          color: "#fbbf24",
        };
      case "load":
      default:
        return {
          label: "Load / Usage",
          currentValue: `${gpu.utilization_percent.toFixed(0)}%`,
          history: gpuLoadHistory,
          min: 0,
          max: 100,
          unit: "%",
          color: "#06b6d4",
        };
    }
  };

  const cpuConfig = getCpuMetricConfig();
  const gpuConfig = getGpuMetricConfig();

  // Hardware max RPM: CPU blower reaches ~8100 RPM, GPU blower reaches ~7500 RPM on full 100% duty
  const cpuPct = Math.min(Math.max(Math.round((fans.cpu_rpm / 8100) * 100), fans.cpu_rpm > 0 ? 5 : 0), 100);
  const gpuPct = Math.min(Math.max(Math.round((fans.gpu_rpm / 7500) * 100), fans.gpu_rpm > 0 ? 5 : 0), 100);

  const handleSliderChange = async (type: "cpu" | "gpu", val: number) => {
    if (type === "cpu") {
      setCpuFanTarget(val);
      try {
        await invoke("set_fan_speeds", { cpu: val, gpu: gpuFanTarget });
      } catch (e) {
        console.error(e);
      }
    } else {
      setGpuFanTarget(val);
      try {
        await invoke("set_fan_speeds", { cpu: cpuFanTarget, gpu: val });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto bg-transparent space-y-3.5" data-purpose="telemetry-dashboard">
      {/* Top Telemetry Row: CPU & GPU Cards */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* CPU Card */}
        <section className="adw-card rounded-xl p-3.5 flex flex-col justify-between" data-purpose="cpu-monitor-card">
          {/* Header Row with Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-gnome-accent shadow-inner backdrop-blur-sm">
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <rect height="16" rx="2" width="16" x="4" y="4" />
                  <rect height="6" width="6" x="9" y="9" />
                  <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
                </svg>
              </div>
              <div>
                <h2 className="text-xs font-semibold text-zinc-100 tracking-tight">CPU Telemetry</h2>
                <p className="text-[11px] text-zinc-400 max-w-[200px] truncate">{cpu.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/50 backdrop-blur-sm border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Normal</span>
            </div>
          </div>

          {/* Crisp Glass Metric Grid (Clickable to switch graph view) */}
          <div className="grid grid-cols-4 gap-2 my-2 glass-tile-inset p-1.5 rounded-lg">
            <button
              type="button"
              onClick={() => setCpuMetric("clock")}
              className={`p-1.5 rounded-md text-left transition-all focus:outline-none ${
                cpuMetric === "clock"
                  ? "bg-sky-950/60 border border-sky-400/50 shadow-sm ring-1 ring-sky-400/30 backdrop-blur-sm"
                  : "hover:bg-white/[0.06] hover:border-white/[0.1] border border-transparent"
              }`}
            >
              <span className={`text-[10px] font-medium block ${cpuMetric === "clock" ? "text-sky-400" : "text-zinc-400"}`}>Clock</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {cpu.clock_ghz.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-400">GHz</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCpuMetric("load")}
              className={`p-1.5 rounded-md text-left transition-all focus:outline-none ${
                cpuMetric === "load"
                  ? "bg-teal-950/60 border border-teal-400/50 shadow-sm ring-1 ring-teal-400/30 backdrop-blur-sm"
                  : "hover:bg-white/[0.06] hover:border-white/[0.1] border border-transparent"
              }`}
            >
              <span className={`text-[10px] font-medium block ${cpuMetric === "load" ? "text-teal-400" : "text-zinc-400"}`}>Load</span>
              <div className="flex items-baseline mt-0.5">
                <span className="text-base font-bold tracking-tight text-gnome-accent">
                  {cpu.utilization_percent.toFixed(0)}
                </span>
                <span className="text-[10px] text-gnome-accent font-medium ml-0.5">%</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCpuMetric("temp")}
              className={`p-1.5 rounded-md text-left transition-all focus:outline-none ${
                cpuMetric === "temp"
                  ? "bg-rose-950/60 border border-rose-400/50 shadow-sm ring-1 ring-rose-400/30 backdrop-blur-sm"
                  : "hover:bg-white/[0.06] hover:border-white/[0.1] border border-transparent"
              }`}
            >
              <span className={`text-[10px] font-medium block ${cpuMetric === "temp" ? "text-rose-400" : "text-zinc-400"}`}>Temp</span>
              <div className="flex items-baseline mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {cpu.temp_celsius.toFixed(0)}
                </span>
                <span className="text-[10px] text-zinc-400 ml-0.5">°C</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCpuMetric("power")}
              className={`p-1.5 rounded-md text-left transition-all focus:outline-none ${
                cpuMetric === "power"
                  ? "bg-amber-950/60 border border-amber-400/50 shadow-sm ring-1 ring-amber-400/30 backdrop-blur-sm"
                  : "hover:bg-white/[0.06] hover:border-white/[0.1] border border-transparent"
              }`}
            >
              <span className={`text-[10px] font-medium block ${cpuMetric === "power" ? "text-amber-400" : "text-zinc-400"}`}>Power</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {cpu.power_watts.toFixed(0)}
                </span>
                <span className="text-[10px] text-zinc-400">W</span>
              </div>
            </button>
          </div>

          {/* Graph View Selector & Real-Time Label */}
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
                Graph:
              </span>
              <div className="inline-flex glass-tile-inset p-0.5 rounded-md gap-0.5">
                {[
                  { id: "load", label: "Load" },
                  { id: "clock", label: "Clock" },
                  { id: "temp", label: "Temp" },
                  { id: "power", label: "Power" },
                ].map((btn) => {
                  const isActive = cpuMetric === btn.id;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setCpuMetric(btn.id as TelemetryMetric)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all focus:outline-none ${
                        isActive
                          ? "bg-white/[0.14] text-teal-300 font-semibold shadow-sm border border-teal-400/40 backdrop-blur-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[10px] text-zinc-400 font-sans">
                {cpuConfig.label}:
              </span>
              <span
                className="font-mono font-bold text-xs"
                style={{ color: cpuConfig.color }}
              >
                {cpuConfig.currentValue}
              </span>
            </div>
          </div>

          {/* CPU Sparkline with smooth animation and dynamic scaling */}
          <Sparkline
            data={cpuConfig.history}
            strokeColor={cpuConfig.color}
            gradientColor={cpuConfig.color}
            min={cpuConfig.min}
            max={cpuConfig.max}
            unit={cpuConfig.unit}
          />
        </section>

        {/* GPU Card */}
        <section className="adw-card rounded-xl p-3.5 flex flex-col justify-between" data-purpose="gpu-monitor-card">
          {/* Header Row with Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-teal-400 shadow-inner backdrop-blur-sm">
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <rect height="12" rx="2" width="20" x="2" y="6" />
                  <path d="M6 18v2M10 18v2M14 18v2M18 18v2M7 10h3v4H7zM14 10h3v4h-3z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold text-zinc-100 tracking-tight">GPU Telemetry</h2>
                  <span className="text-[9px] text-zinc-300 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.1] font-mono backdrop-blur-sm">
                    VRAM: {gpu.vram_used_gb.toFixed(1)}/{gpu.vram_total_gb.toFixed(0)}GB
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 max-w-[200px] truncate">{gpu.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/50 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Active</span>
            </div>
          </div>

          {/* Crisp Glass Metric Grid (Clickable to switch graph view) */}
          <div className="grid grid-cols-4 gap-2 my-2 glass-tile-inset p-1.5 rounded-lg">
            <button
              type="button"
              onClick={() => setGpuMetric("clock")}
              className={`p-1.5 rounded-md text-left transition-all focus:outline-none ${
                gpuMetric === "clock"
                  ? "bg-sky-950/60 border border-sky-400/50 shadow-sm ring-1 ring-sky-400/30 backdrop-blur-sm"
                  : "hover:bg-white/[0.06] hover:border-white/[0.1] border border-transparent"
              }`}
            >
              <span className={`text-[10px] font-medium block ${gpuMetric === "clock" ? "text-sky-400" : "text-zinc-400"}`}>Clock</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {gpu.core_clock_mhz.toFixed(0)}
                </span>
                <span className="text-[10px] text-zinc-400">MHz</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setGpuMetric("load")}
              className={`p-1.5 rounded-md text-left transition-all focus:outline-none ${
                gpuMetric === "load"
                  ? "bg-cyan-950/60 border border-cyan-400/50 shadow-sm ring-1 ring-cyan-400/30 backdrop-blur-sm"
                  : "hover:bg-white/[0.06] hover:border-white/[0.1] border border-transparent"
              }`}
            >
              <span className={`text-[10px] font-medium block ${gpuMetric === "load" ? "text-cyan-400" : "text-zinc-400"}`}>Load</span>
              <div className="flex items-baseline mt-0.5">
                <span className="text-base font-bold tracking-tight text-cyan-400">
                  {gpu.utilization_percent.toFixed(0)}
                </span>
                <span className="text-[10px] text-cyan-400 font-medium ml-0.5">%</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setGpuMetric("temp")}
              className={`p-1.5 rounded-md text-left transition-all focus:outline-none ${
                gpuMetric === "temp"
                  ? "bg-rose-950/60 border border-rose-400/50 shadow-sm ring-1 ring-rose-400/30 backdrop-blur-sm"
                  : "hover:bg-white/[0.06] hover:border-white/[0.1] border border-transparent"
              }`}
            >
              <span className={`text-[10px] font-medium block ${gpuMetric === "temp" ? "text-rose-400" : "text-zinc-400"}`}>Temp</span>
              <div className="flex items-baseline mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {gpu.temp_celsius.toFixed(0)}
                </span>
                <span className="text-[10px] text-zinc-400 ml-0.5">°C</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setGpuMetric("power")}
              className={`p-1.5 rounded-md text-left transition-all focus:outline-none ${
                gpuMetric === "power"
                  ? "bg-amber-950/60 border border-amber-400/50 shadow-sm ring-1 ring-amber-400/30 backdrop-blur-sm"
                  : "hover:bg-white/[0.06] hover:border-white/[0.1] border border-transparent"
              }`}
            >
              <span className={`text-[10px] font-medium block ${gpuMetric === "power" ? "text-amber-400" : "text-zinc-400"}`}>Power</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {gpu.power_watts.toFixed(0)}
                </span>
                <span className="text-[10px] text-zinc-400">W</span>
              </div>
            </button>
          </div>

          {/* Graph View Selector & Real-Time Label */}
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
                Graph:
              </span>
              <div className="inline-flex glass-tile-inset p-0.5 rounded-md gap-0.5">
                {[
                  { id: "load", label: "Load" },
                  { id: "clock", label: "Clock" },
                  { id: "temp", label: "Temp" },
                  { id: "power", label: "Power" },
                ].map((btn) => {
                  const isActive = gpuMetric === btn.id;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setGpuMetric(btn.id as TelemetryMetric)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all focus:outline-none ${
                        isActive
                          ? "bg-white/[0.14] text-cyan-300 font-semibold shadow-sm border border-cyan-400/40 backdrop-blur-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[10px] text-zinc-400 font-sans">
                {gpuConfig.label}:
              </span>
              <span
                className="font-mono font-bold text-xs"
                style={{ color: gpuConfig.color }}
              >
                {gpuConfig.currentValue}
              </span>
            </div>
          </div>

          {/* GPU Sparkline with smooth animation and dynamic scaling */}
          <Sparkline
            data={gpuConfig.history}
            strokeColor={gpuConfig.color}
            gradientColor={gpuConfig.color}
            min={gpuConfig.min}
            max={gpuConfig.max}
            unit={gpuConfig.unit}
          />
        </section>
      </div>

      {/* BEGIN: Cooling and Fan Section (Libadwaita System Card) */}
      <section className="adw-card rounded-xl p-3.5" data-purpose="fans-telemetry-card">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">Cooling System</span>
            <span className="text-[10px] text-zinc-300 bg-white/[0.07] px-2 py-0.5 rounded border border-white/[0.12] backdrop-blur-sm">
              Dynamic PWM Curve
            </span>
          </div>
          {/* Quiet Mode Switch */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Quiet Profile</span>
            <label className="relative inline-block w-7 h-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={quietProfile}
                onChange={(e) => setQuietProfile(e.target.checked)}
                className="sr-only adw-switch-input peer"
              />
              <div className="adw-switch-slider w-7 h-3.5 bg-zinc-700 rounded-full transition-colors relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:h-2.5 before:w-2.5 before:transition-transform" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* CPU Fan Gauge & Slider */}
          <div className="glass-tile-inset rounded-lg p-2.5 flex items-center justify-between gap-4 hover:border-white/[0.14] transition-all">
            {/* Radial Meter */}
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/[0.08]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="75, 100"
                    strokeWidth="3"
                  />
                  <path
                    className="text-gnome-accent drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${Math.round((cpuPct * 75) / 100)}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <span className="absolute text-[10px] font-semibold text-zinc-100">{cpuPct}%</span>
              </div>
              <div>
                <h3 className="text-xs font-medium text-zinc-200">CPU Blower</h3>
                <p className="text-[11px] text-gnome-accent font-mono font-medium">
                  {fans.cpu_rpm.toLocaleString()} RPM
                </p>
              </div>
            </div>
            {/* Curve Slider */}
            <div className="flex-1 max-w-[170px] space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Duty target</span>
                <span className="font-medium text-zinc-200">
                  {fans.cpu_is_auto ? "Auto (Dynamic)" : `${cpuFanTarget}%`}
                </span>
              </div>
              <input
                className="w-full h-1.5 bg-black/40 border border-white/[0.08] rounded-lg appearance-none cursor-pointer accent-teal-400"
                max="100"
                min="0"
                type="range"
                value={cpuFanTarget}
                onChange={(e) => handleSliderChange("cpu", parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* GPU Fan Gauge & Slider */}
          <div className="glass-tile-inset rounded-lg p-2.5 flex items-center justify-between gap-4 hover:border-white/[0.14] transition-all">
            {/* Radial Meter */}
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/[0.08]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="75, 100"
                    strokeWidth="3"
                  />
                  <path
                    className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${Math.round((gpuPct * 75) / 100)}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <span className="absolute text-[10px] font-semibold text-zinc-100">{gpuPct}%</span>
              </div>
              <div>
                <h3 className="text-xs font-medium text-zinc-200">GPU Blower</h3>
                <p className="text-[11px] text-cyan-400 font-mono font-medium">
                  {fans.gpu_rpm.toLocaleString()} RPM
                </p>
              </div>
            </div>
            {/* Curve Slider */}
            <div className="flex-1 max-w-[170px] space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Duty target</span>
                <span className="font-medium text-zinc-200">
                  {fans.gpu_is_auto ? "Auto (Dynamic)" : `${gpuFanTarget}%`}
                </span>
              </div>
              <input
                className="w-full h-1.5 bg-black/40 border border-white/[0.08] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                max="100"
                min="0"
                type="range"
                value={gpuFanTarget}
                onChange={(e) => handleSliderChange("gpu", parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Small Animated Fan Indicator at bottom */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <img
              src="/acerx-animated-fan.svg"
              alt="AcerX Turbine"
              className="w-5 h-5 drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]"
            />
            <span className="text-[11px] font-medium text-zinc-300">Dual Aerodynamic Blade Arrays Active</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="text-gnome-accent">CPU: {fans.cpu_rpm} RPM</span>
            <span className="text-cyan-400">GPU: {fans.gpu_rpm} RPM</span>
          </div>
        </div>
      </section>
    </div>
  );
};
