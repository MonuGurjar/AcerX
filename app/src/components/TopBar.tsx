import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const isProfileActive = (current: string, profileId: string): boolean => {
  if (!current || !profileId) return false;
  const c = current.toLowerCase().trim();
  const id = profileId.toLowerCase().trim();
  if (c === id) return true;
  if (id === "eco" && (c === "low-power" || c === "power-saver" || c === "powersave")) return true;
  if (id === "silent" && (c === "quiet" || c === "silent")) return true;
  if (id === "balanced" && c === "balanced") return true;
  if (id === "performance" && (c === "balanced-performance" || c === "performance" || c === "turbo" || c === "performance-turbo")) return true;
  return false;
};

interface TopBarProps {
  currentProfile: string;
  isPluggedIn: boolean;
  batteryPercent: number;
  batteryStatus?: string;
  onProfileChange: (profile: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentProfile,
  isPluggedIn,
  batteryPercent,
  batteryStatus,
  onProfileChange,
}) => {
  const isTurbo =
    currentProfile.toLowerCase() === "turbo" ||
    currentProfile.toLowerCase() === "performance-turbo";

  const handleProfileSelect = async (profile: string) => {
    try {
      await invoke("set_thermal_profile", { profile });
      onProfileChange(profile);
    } catch (e) {
      console.error("Failed to set thermal profile:", e);
    }
  };

  const handleTurboToggle = async (checked: boolean) => {
    const target = checked ? "performance" : "balanced";
    await handleProfileSelect(target);
  };

  const handleMinimize = async () => {
    try {
      await invoke("app_minimize");
    } catch {
      try {
        await getCurrentWindow().minimize();
      } catch (e) {
        console.error("Minimize error:", e);
      }
    }
  };

  const handleMaximize = async () => {
    try {
      await invoke("app_toggle_maximize");
    } catch {
      try {
        await getCurrentWindow().toggleMaximize();
      } catch (e) {
        console.error("Maximize error:", e);
      }
    }
  };

  const handleClose = async () => {
    try {
      await invoke("app_close");
    } catch {
      try {
        await getCurrentWindow().close();
      } catch (e) {
        console.error("Close error:", e);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.target as HTMLElement).closest("button, input, a, label")) {
      getCurrentWindow().startDragging().catch(() => {});
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest("button, input, a, label")) {
      handleMaximize();
    }
  };

  const profiles = [
    { id: "eco", label: "Eco" },
    { id: "silent", label: "Silent" },
    { id: "balanced", label: "Balanced" },
    { id: "performance", label: "Performance" },
  ];

  return (
    <header
      className="h-[46px] bg-[#0c0d12]/50 backdrop-blur-xl border-b border-white/[0.08] px-3.5 flex items-center justify-between select-none z-20 shrink-0 cursor-default"
      data-purpose="window-headerbar"
      data-tauri-drag-region
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Left: App Identity & Status Indicator */}
      <div className="flex items-center gap-2.5 w-56">
        <img
          src="/logo.png"
          alt="AcerX Logo"
          className="h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(45,212,191,0.35)]"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-normal text-zinc-100 font-sans">
            AcerX
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-300 border border-white/[0.12] backdrop-blur-sm">
            Linux
          </span>
        </div>
      </div>

      {/* Center: Segmented Button Control (Power Profiles) */}
      <div className="flex items-center gap-3" data-purpose="power-modes-navigation">
        <div className="segmented-control inline-flex items-center gap-1 text-xs font-medium text-zinc-400 glass-tile-inset p-1 rounded-lg">
          {profiles.map((p) => {
            const isActive = isProfileActive(currentProfile, p.id);
            return (
              <button
                key={p.id}
                onClick={() => handleProfileSelect(p.id)}
                className={`px-3 py-1 rounded-[6px] transition-all flex items-center gap-1.5 focus:outline-none ${
                  isActive
                    ? "text-teal-300 bg-white/[0.14] shadow-sm font-semibold border border-teal-400/40 ring-1 ring-teal-400/20 backdrop-blur-sm"
                    : "hover:text-zinc-200 text-zinc-400 border border-transparent hover:bg-white/[0.04]"
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
                )}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Turbo Mode Toggle */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <span className="text-xs text-zinc-400 font-normal">Turbo</span>
          <label className="relative inline-block w-8 h-4 cursor-pointer">
            <input
              type="checkbox"
              checked={isTurbo}
              onChange={(e) => handleTurboToggle(e.target.checked)}
              className="sr-only adw-switch-input peer"
            />
            <div className="adw-switch-slider w-8 h-4 bg-zinc-700 rounded-full transition-colors relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:h-3 before:w-3 before:transition-transform" />
          </label>
        </div>
      </div>

      {/* Right: Battery, Search & Standard GNOME Window Controls */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 mr-1"
          title={`${isPluggedIn ? "AC Power Connected" : "On Battery Power"}${batteryStatus ? ` • ${batteryStatus}` : ""}`}
        >
          <span className={isPluggedIn ? "text-teal-400" : "text-zinc-400"}>
            {isPluggedIn ? "⚡" : "🔋"}
          </span>
          <span>{batteryPercent}%</span>
          {batteryStatus && batteryStatus !== "Unknown" && (
            <span className="text-[10px] text-zinc-500 font-normal">({batteryStatus})</span>
          )}
        </div>

        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 active:bg-white/20 text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none cursor-pointer"
          title="Minimize"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
            <path d="M2 8a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 8z" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 active:bg-white/20 text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none cursor-pointer"
          title="Maximize / Restore"
        >
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]" viewBox="0 0 16 16">
            <rect x="3" y="3" width="10" height="10" rx="1.5" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-600 hover:text-white active:bg-rose-700 text-zinc-400 transition-colors focus:outline-none cursor-pointer"
          title="Close"
        >
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 16 16">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </header>
  );
};
