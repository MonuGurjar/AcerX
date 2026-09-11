import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SystemMetrics } from "../types/telemetry";
import { Sparkline } from "./Sparkline";

interface DashboardProps {
  metrics: SystemMetrics | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ metrics }) => {
  // CPU metric histories (constant length 20 for silky smooth SVG morphing)
  const [cpuLoadHistory, setCpuLoadHistory] = useState<number[]>(() => Array(20).fill(30));
  const [cpuTempHistory, setCpuTempHistory] = useState<number[]>(() => Array(20).fill(55));

  // GPU metric histories
  const [gpuLoadHistory, setGpuLoadHistory] = useState<number[]>(() => Array(20).fill(20));
  const [gpuTempHistory, setGpuTempHistory] = useState<number[]>(() => Array(20).fill(50));

  // iGPU metric histories
  const [igpuLoadHistory, setIgpuLoadHistory] = useState<number[]>(() => Array(20).fill(15));
  const [igpuFreqHistory, setIgpuFreqHistory] = useState<number[]>(() => Array(20).fill(1200));

  const [cpuFanTarget, setCpuFanTarget] = useState<number>(0);
  const [gpuFanTarget, setGpuFanTarget] = useState<number>(0);
  const [quietProfile, setQuietProfile] = useState(false);

  useEffect(() => {
    if (metrics) {
      setCpuLoadHistory((prev) => [...prev.slice(1), metrics.cpu.utilization_percent]);
      setCpuTempHistory((prev) => [...prev.slice(1), metrics.cpu.temp_celsius]);

      setGpuLoadHistory((prev) => [...prev.slice(1), metrics.gpu.utilization_percent]);
      setGpuTempHistory((prev) => [...prev.slice(1), metrics.gpu.temp_celsius]);

      if (metrics.igpu) {
        setIgpuLoadHistory((prev) => [...prev.slice(1), metrics.igpu!.utilization_percent]);
        setIgpuFreqHistory((prev) => [...prev.slice(1), metrics.igpu!.cur_freq_mhz]);
      }

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

  const igpu = metrics?.igpu || {
    name: "Intel® UHD Graphics (Raptor Lake)",
    cur_freq_mhz: 1400,
    max_freq_mhz: 1400,
    utilization_percent: 22,
  };

  const ram = metrics?.ram || {
    used_gb: 8.9,
    total_gb: 15.3,
    percent: 58,
  };

  const storage = metrics?.storage || {
    used_gb: 250,
    total_gb: 477,
    percent: 52,
  };

  const fans = metrics?.fans || {
    cpu_rpm: 0,
    cpu_is_auto: true,
    cpu_duty: 0,
    gpu_rpm: 0,
    gpu_is_auto: true,
    gpu_duty: 0,
  };

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
    <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto bg-transparent space-y-4" data-purpose="telemetry-dashboard">
      {/* Top Telemetry Row: CPU & GPU Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* CPU Card */}
        <section className="adw-card rounded-xl p-4 flex flex-col justify-between" data-purpose="cpu-monitor-card">
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

          {/* Crisp Glass Metric Grid: Clock & Power */}
          <div className="grid grid-cols-2 gap-2 my-2.5 glass-tile-inset p-2 rounded-lg">
            <div className="p-1.5 rounded-md text-left">
              <span className="text-[10px] font-medium block text-sky-400">Clock Speed</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {cpu.clock_ghz.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-400">GHz</span>
              </div>
            </div>

            <div className="p-1.5 rounded-md text-left">
              <span className="text-[10px] font-medium block text-amber-400">Package Power</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {cpu.power_watts.toFixed(0)}
                </span>
                <span className="text-[10px] text-zinc-400">W</span>
              </div>
            </div>
          </div>

          {/* Dual Side-by-Side Half-Size Graphs: Load & Temperature */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {/* CPU Load Graph */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between px-1 text-[10px]">
                <span className="text-zinc-400 font-medium">CPU Load</span>
                <span className="font-mono font-bold text-teal-300">
                  {cpu.utilization_percent.toFixed(0)}%
                </span>
              </div>
              <Sparkline
                data={cpuLoadHistory}
                strokeColor="#2dd4bf"
                gradientColor="#2dd4bf"
                min={0}
                max={100}
                unit="%"
                className="h-16"
                height={58}
              />
            </div>

            {/* CPU Temp Graph */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between px-1 text-[10px]">
                <span className="text-zinc-400 font-medium">CPU Temp</span>
                <span className="font-mono font-bold text-rose-400">
                  {cpu.temp_celsius.toFixed(0)}°C
                </span>
              </div>
              <Sparkline
                data={cpuTempHistory}
                strokeColor="#f87171"
                gradientColor="#f87171"
                min={30}
                max={105}
                unit="°C"
                className="h-16"
                height={58}
              />
            </div>
          </div>
        </section>

        {/* GPU Card */}
        <section className="adw-card rounded-xl p-4 flex flex-col justify-between" data-purpose="gpu-monitor-card">
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
                <h2 className="text-xs font-semibold text-zinc-100 tracking-tight">GPU Telemetry</h2>
                <p className="text-[11px] text-zinc-400 max-w-[200px] truncate">{gpu.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/50 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Active</span>
            </div>
          </div>

          {/* Crisp Glass Metric Grid: Clock, Memory Usage (VRAM), Power */}
          <div className="grid grid-cols-3 gap-2 my-2.5 glass-tile-inset p-2 rounded-lg">
            <div className="p-1.5 rounded-md text-left">
              <span className="text-[10px] font-medium block text-sky-400">Core Clock</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {gpu.core_clock_mhz.toFixed(0)}
                </span>
                <span className="text-[10px] text-zinc-400">MHz</span>
              </div>
            </div>

            <div className="p-1.5 rounded-md text-left bg-cyan-950/30 border border-cyan-500/20">
              <span className="text-[10px] font-medium block text-cyan-400">Memory Usage</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-cyan-300 font-mono">
                  {gpu.vram_used_gb.toFixed(1)}
                </span>
                <span className="text-[10px] text-zinc-400">/ {gpu.vram_total_gb.toFixed(0)} GB</span>
              </div>
            </div>

            <div className="p-1.5 rounded-md text-left">
              <span className="text-[10px] font-medium block text-amber-400">Power Draw</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {gpu.power_watts.toFixed(0)}
                </span>
                <span className="text-[10px] text-zinc-400">W</span>
              </div>
            </div>
          </div>

          {/* Dual Side-by-Side Half-Size Graphs: Load & Temperature */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {/* GPU Load Graph */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between px-1 text-[10px]">
                <span className="text-zinc-400 font-medium">GPU Load</span>
                <span className="font-mono font-bold text-cyan-300">
                  {gpu.utilization_percent.toFixed(0)}%
                </span>
              </div>
              <Sparkline
                data={gpuLoadHistory}
                strokeColor="#06b6d4"
                gradientColor="#06b6d4"
                min={0}
                max={100}
                unit="%"
                className="h-16"
                height={58}
              />
            </div>

            {/* GPU Temp Graph */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between px-1 text-[10px]">
                <span className="text-zinc-400 font-medium">GPU Temp</span>
                <span className="font-mono font-bold text-rose-400">
                  {gpu.temp_celsius.toFixed(0)}°C
                </span>
              </div>
              <Sparkline
                data={gpuTempHistory}
                strokeColor="#f87171"
                gradientColor="#f87171"
                min={30}
                max={100}
                unit="°C"
                className="h-16"
                height={58}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Middle Row: Left 2 columns (RAM & Storage) + Right 1 column (iGPU styled like NVIDIA GPU) */}
      <div className="grid grid-cols-2 gap-4" data-purpose="secondary-telemetry-row">
        {/* Left Half: RAM & Storage side-by-side matching CPU width */}
        <div className="grid grid-cols-2 gap-3.5 h-full">
          {/* RAM Usage Card */}
          <section className="adw-card rounded-xl p-4 flex flex-col justify-between h-full" data-purpose="ram-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                  <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">RAM Telemetry</h3>
                  <p className="text-[10px] text-zinc-400">System Memory</p>
                </div>
              </div>
              <span className="font-mono font-bold text-xs text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                {ram.percent.toFixed(0)}%
              </span>
            </div>

            <div className="my-2.5">
              <span className="text-[10px] font-medium text-zinc-400 block">Allocated Memory</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-purple-300">
                  {ram.used_gb.toFixed(1)}
                </span>
                <span className="text-xs text-zinc-400 font-mono">/ {ram.total_gb.toFixed(1)} GB</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-black/40 border border-white/[0.08] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${ram.percent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] text-[10px]">
              <div className="flex flex-col">
                <span className="text-zinc-400">Available</span>
                <span className="font-mono font-semibold text-zinc-200">
                  {(ram.total_gb - ram.used_gb).toFixed(1)} GB
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-zinc-400">Channels</span>
                <span className="font-mono font-semibold text-teal-400">Dual DDR5</span>
              </div>
            </div>
          </section>

          {/* Storage Usage Card */}
          <section className="adw-card rounded-xl p-4 flex flex-col justify-between h-full" data-purpose="storage-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                  <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                    <path d="M4 6h16a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zM4 14h16a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 012-2z" />
                    <circle cx="6" cy="9" r="1" />
                    <circle cx="6" cy="17" r="1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">NVMe Storage</h3>
                  <p className="text-[10px] text-zinc-400">Root Partition (/)</p>
                </div>
              </div>
              <span className="font-mono font-bold text-xs text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/30">
                {storage.percent.toFixed(0)}%
              </span>
            </div>

            <div className="my-2.5">
              <span className="text-[10px] font-medium text-zinc-400 block">Capacity Used</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-blue-300">
                  {storage.used_gb.toFixed(0)}
                </span>
                <span className="text-xs text-zinc-400 font-mono">/ {storage.total_gb.toFixed(0)} GB</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-black/40 border border-white/[0.08] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${storage.percent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] text-[10px]">
              <div className="flex flex-col">
                <span className="text-zinc-400">Free Space</span>
                <span className="font-mono font-semibold text-zinc-200">
                  {(storage.total_gb - storage.used_gb).toFixed(0)} GB
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-zinc-400">Interface</span>
                <span className="font-mono font-semibold text-sky-400">PCIe Gen4</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Half: Intel iGPU Card (styled exactly like NVIDIA GPU) */}
        <section className="adw-card rounded-xl p-4 flex flex-col justify-between h-full" data-purpose="igpu-monitor-card">
          {/* Header Row with Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-emerald-400 shadow-inner backdrop-blur-sm">
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <rect height="16" rx="2" width="16" x="4" y="4" />
                  <path d="M9 9h6v6H9z" />
                  <path d="M1 9h3M1 15h3M20 9h3M20 15h3M9 1v3M15 1v3M9 20v3M15 20v3" />
                </svg>
              </div>
              <div>
                <h2 className="text-xs font-semibold text-zinc-100 tracking-tight">iGPU Telemetry</h2>
                <p className="text-[11px] text-zinc-400 max-w-[200px] truncate">{igpu.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/50 backdrop-blur-sm border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active</span>
            </div>
          </div>

          {/* Crisp Glass Metric Grid: Core Clock, Shared Memory, Boost */}
          <div className="grid grid-cols-3 gap-2 my-2.5 glass-tile-inset p-2 rounded-lg">
            <div className="p-1.5 rounded-md text-left">
              <span className="text-[10px] font-medium block text-sky-400">Core Clock</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {igpu.cur_freq_mhz}
                </span>
                <span className="text-[10px] text-zinc-400">MHz</span>
              </div>
            </div>

            <div className="p-1.5 rounded-md text-left bg-emerald-950/30 border border-emerald-500/20">
              <span className="text-[10px] font-medium block text-emerald-400">Shared VRAM</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-emerald-300 font-mono">
                  {(ram.used_gb * 0.2).toFixed(1)}
                </span>
                <span className="text-[10px] text-zinc-400">/ {(ram.total_gb * 0.5).toFixed(0)} GB</span>
              </div>
            </div>

            <div className="p-1.5 rounded-md text-left">
              <span className="text-[10px] font-medium block text-amber-400">Max Boost</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  {igpu.max_freq_mhz}
                </span>
                <span className="text-[10px] text-zinc-400">MHz</span>
              </div>
            </div>
          </div>

          {/* Dual Side-by-Side Half-Size Graphs: Load & Frequency */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {/* iGPU Load Graph */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between px-1 text-[10px]">
                <span className="text-zinc-400 font-medium">iGPU Load</span>
                <span className="font-mono font-bold text-emerald-300">
                  {igpu.utilization_percent.toFixed(0)}%
                </span>
              </div>
              <Sparkline
                data={igpuLoadHistory}
                strokeColor="#10b981"
                gradientColor="#10b981"
                min={0}
                max={100}
                unit="%"
                className="h-16"
                height={58}
              />
            </div>

            {/* iGPU Frequency Graph */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between px-1 text-[10px]">
                <span className="text-zinc-400 font-medium">Frequency</span>
                <span className="font-mono font-bold text-sky-400">
                  {igpu.cur_freq_mhz} MHz
                </span>
              </div>
              <Sparkline
                data={igpuFreqHistory}
                strokeColor="#38bdf8"
                gradientColor="#38bdf8"
                min={300}
                max={1500}
                unit="MHz"
                className="h-16"
                height={58}
              />
            </div>
          </div>
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
