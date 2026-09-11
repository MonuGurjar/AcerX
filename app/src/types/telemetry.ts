export interface CpuMetrics {
  name: string;
  clock_ghz: number;
  utilization_percent: number;
  temp_celsius: number;
  power_watts: number;
}

export interface GpuMetrics {
  name: string;
  core_clock_mhz: number;
  vram_used_gb: number;
  vram_total_gb: number;
  temp_celsius: number;
  power_watts: number;
  utilization_percent: number;
}

export interface FanMetrics {
  cpu_rpm: number;
  cpu_is_auto: boolean;
  cpu_duty?: number;
  gpu_rpm: number;
  gpu_is_auto: boolean;
  gpu_duty?: number;
}

export interface SystemMetrics {
  cpu: CpuMetrics;
  gpu: GpuMetrics;
  fans: FanMetrics;
  is_plugged_in: boolean;
  battery_percent: number;
  battery_status?: string;
  current_profile: string;
  laptop_model: string;
}
