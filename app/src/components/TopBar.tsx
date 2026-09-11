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

  const handleMinimize = () => {
    try {
      getCurrentWindow().minimize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMaximize = () => {
    try {
      getCurrentWindow().toggleMaximize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = () => {
    try {
      getCurrentWindow().close();
    } catch (e) {
      console.error(e);
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
      className="h-[46px] bg-gnome-headerbar border-b border-zinc-800/80 px-3.5 flex items-center justify-between select-none z-20 shrink-0 cursor-default"
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
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            Linux
          </span>
        </div>
      </div>

      {/* Center: Segmented Button Control (Power Profiles) */}
      <div className="flex items-center gap-3" data-purpose="power-modes-navigation">
        <div className="segmented-control inline-flex items-center gap-1 text-xs font-medium text-zinc-400 bg-[#161619] p-1 rounded-lg border border-zinc-800">
          {profiles.map((p) => {
            const isActive = isProfileActive(currentProfile, p.id);
            return (
              <button
                key={p.id}
                onClick={() => handleProfileSelect(p.id)}
                className={`px-3 py-1 rounded-[6px] transition-all flex items-center gap-1.5 focus:outline-none ${
                  isActive
                    ? "text-teal-300 bg-zinc-800/90 shadow-sm font-semibold border border-teal-500/40 ring-1 ring-teal-500/20"
                    : "hover:text-zinc-200 text-zinc-400 border border-transparent"
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
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none"
          title="Search Sensors"
        >
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
          </svg>
        </button>
        <div className="h-4 w-[1px] bg-zinc-800 mx-0.5" />
        <button
          onClick={handleMinimize}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none"
          title="Minimize"
        >
          <span className="text-xs leading-none">−</span>
        </button>
        <button
          onClick={handleMaximize}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none"
          title="Maximize"
        >
          <span className="text-[10px] leading-none">□</span>
        </button>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-rose-900/40 text-zinc-400 hover:text-rose-300 transition-colors focus:outline-none"
          title="Close"
        >
          <span className="text-xs leading-none">✕</span>
        </button>
      </div>
    </header>
  );
};
