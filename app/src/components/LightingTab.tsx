import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export const LightingTab: React.FC = () => {
  const [backlightTimeout, setBacklightTimeout] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleToggleTimeout = async (enabled: boolean) => {
    try {
      await invoke("set_backlight_timeout", { enabled });
      setBacklightTimeout(enabled);
      showFeedback(enabled ? "✓ Backlight auto-sleep enabled (30s)" : "✓ Backlight auto-sleep disabled");
    } catch (e) {
      console.error(e);
      showFeedback(`✗ Error: ${e}`);
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col overflow-y-auto bg-transparent space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Keyboard Backlight</h2>
          <p className="text-xs text-zinc-400">
            Hardware backlight sleep timeout and illumination settings for Acer Nitro V 15.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="text-xs py-1.5 px-3 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-400 font-medium">
          {statusMsg}
        </div>
      )}

      {/* Backlight Timeout Card */}
      <section className="adw-card rounded-xl p-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-zinc-100">Keyboard Backlight Sleep (30s)</h3>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                backlightTimeout
                  ? "bg-teal-950/50 text-teal-300 border-teal-500/30"
                  : "bg-zinc-800/80 text-zinc-400 border-zinc-700/40"
              }`}
            >
              {backlightTimeout ? "30s Inactivity Sleep" : "Always On"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xl">
            Automatically shuts down keyboard backlight LED illumination after 30 seconds of user inactivity
            to preserve battery life. Tapping any key instantly restores illumination.
          </p>
        </div>
        <label className="relative inline-block w-8 h-4 cursor-pointer shrink-0 ml-4">
          <input
            type="checkbox"
            checked={backlightTimeout}
            onChange={(e) => handleToggleTimeout(e.target.checked)}
            className="sr-only adw-switch-input peer"
          />
          <div className="adw-switch-slider w-8 h-4 bg-zinc-700 rounded-full transition-colors relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:h-3 before:w-3 before:transition-transform" />
        </label>
      </section>

      {/* Hardware Profile Details Card */}
      <section className="adw-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-200">Hardware Illumination Architecture</h3>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-zinc-300 font-mono">
            Acer Nitro V 15
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-tile-inset rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-zinc-400 block font-medium">Backlight Configuration</span>
            <span className="text-xs font-semibold text-zinc-200 block">Single-Zone Monochrome</span>
            <p className="text-[11px] text-zinc-400">
              Hardware array is designed with uniform single-color LED backlighting. Multi-zone RGB methods are disabled.
            </p>
          </div>

          <div className="glass-tile-inset rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-zinc-400 block font-medium">Driver &amp; ACPI Control</span>
            <span className="text-xs font-semibold text-teal-300 block">Linuwu-Sense WMI Bus</span>
            <p className="text-[11px] text-zinc-400">
              Backlight timeout register is controlled via direct ACPI sysfs interface at <code>predator_sense/backlight_timeout</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
