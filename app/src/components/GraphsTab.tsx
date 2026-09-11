import React, { useState, useEffect } from "react";
import { SystemMetrics } from "../types/telemetry";
import { Sparkline } from "./Sparkline";

interface GraphsTabProps {
  metrics: SystemMetrics | null;
}

export const GraphsTab: React.FC<GraphsTabProps> = ({ metrics }) => {
  const [cpuTemps, setCpuTemps] = useState<number[]>(() => Array(30).fill(50));
  const [gpuTemps, setGpuTemps] = useState<number[]>(() => Array(30).fill(55));
  const [cpuPowers, setCpuPowers] = useState<number[]>(() => Array(30).fill(35));

  useEffect(() => {
    if (metrics) {
      setCpuTemps((prev) => [...prev.slice(1), metrics.cpu.temp_celsius]);
      setGpuTemps((prev) => [...prev.slice(1), metrics.gpu.temp_celsius]);
      setCpuPowers((prev) => [...prev.slice(1), metrics.cpu.power_watts]);
    }
  }, [metrics]);

  return (
    <div className="flex-1 p-4 flex flex-col overflow-y-auto bg-transparent space-y-3.5">
      <section className="adw-card rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-200">CPU Thermal Curve (°C)</span>
          <span className="text-xs font-mono font-medium text-teal-400">
            {metrics?.cpu.temp_celsius || 58}°C
          </span>
        </div>
        <Sparkline data={cpuTemps} min={30} max={100} strokeColor="#2dd4bf" gradientColor="#2dd4bf" />
      </section>

      <section className="adw-card rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-200">GPU Thermal Curve (°C)</span>
          <span className="text-xs font-mono font-medium text-cyan-400">
            {metrics?.gpu.temp_celsius || 64}°C
          </span>
        </div>
        <Sparkline data={gpuTemps} min={30} max={100} strokeColor="#06b6d4" gradientColor="#06b6d4" />
      </section>

      <section className="adw-card rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-200">Package Power Draw (Watts)</span>
          <span className="text-xs font-mono font-medium text-amber-400">
            {metrics?.cpu.power_watts || 45}W
          </span>
        </div>
        <Sparkline data={cpuPowers} min={5} max={120} strokeColor="#f59e0b" gradientColor="#f59e0b" />
      </section>
    </div>
  );
};
