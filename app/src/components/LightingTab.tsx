import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export const LightingTab: React.FC = () => {
  // Mode: "per_zone" or "effect"
  const [activeMode, setActiveMode] = useState<"per_zone" | "effect">("per_zone");

  // Per-zone state (as in old fork: default zone1 #4287f5, zone2 #ff5733, zone3 #33ff57, zone4 #ffff01)
  const [zone1, setZone1] = useState("#4287f5");
  const [zone2, setZone2] = useState("#ff5733");
  const [zone3, setZone3] = useState("#33ff57");
  const [zone4, setZone4] = useState("#ffff01");
  const [brightness, setBrightness] = useState<number>(100);

  // Four-zone effects state (as in old fork)
  const [effectMode, setEffectMode] = useState<number>(0);
  const [effectSpeed, setEffectSpeed] = useState<number>(5);
  const [effectBrightness, setEffectBrightness] = useState<number>(100);
  const [effectColor, setEffectColor] = useState<string>("#00e5ff");
  const [effectDirection, setEffectDirection] = useState<number>(1); // 1 = Left to Right, 2 = Right to Left

  // Backlight Timeout
  const [backlightTimeout, setBacklightTimeout] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleApplyZoneColors = async () => {
    try {
      await invoke("set_per_zone_mode", {
        zone1,
        zone2,
        zone3,
        zone4,
        brightness,
      });
      showFeedback("✓ Applied per-zone colors to keyboard");
    } catch (e) {
      console.error(e);
      showFeedback(`✗ Error: ${e}`);
    }
  };

  const handleApplyEffect = async () => {
    try {
      const hex = effectColor.replace("#", "");
      const red = parseInt(hex.substring(0, 2), 16) || 0;
      const green = parseInt(hex.substring(2, 4), 16) || 0;
      const blue = parseInt(hex.substring(4, 6), 16) || 0;

      await invoke("set_four_zone_mode", {
        mode: effectMode,
        speed: effectSpeed,
        brightness: effectBrightness,
        direction: effectDirection,
        red,
        green,
        blue,
      });
      showFeedback("✓ Applied dynamic effect to keyboard");
    } catch (e) {
      console.error(e);
      showFeedback(`✗ Error: ${e}`);
    }
  };

  const handleToggleTimeout = async (enabled: boolean) => {
    try {
      await invoke("set_backlight_timeout", { enabled });
      setBacklightTimeout(enabled);
      showFeedback(enabled ? "✓ Backlight sleep enabled (30s)" : "✓ Backlight sleep disabled");
    } catch (e) {
      console.error(e);
    }
  };

  const effectModesList = [
    "Static Mode",
    "Breathing Mode",
    "Neon Mode",
    "Wave Mode",
    "Shifting Mode",
    "Zoom Mode",
    "Meteor Mode",
    "Twinkling Mode",
  ];

  return (
    <div className="flex-1 p-4 flex flex-col overflow-y-auto bg-gnome-bg space-y-4">
      {/* Tab Switcher & Status Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Keyboard Backlight & RGB</h2>
          <p className="text-xs text-zinc-400">
            Control 4-zone lighting, custom per-zone colors, and dynamic hardware effects.
          </p>
        </div>

        <div className="segmented-control inline-flex items-center gap-0.5 text-xs font-medium text-zinc-400">
          <button
            onClick={() => setActiveMode("per_zone")}
            className={`px-3.5 py-1 rounded-[7px] transition-all focus:outline-none ${
              activeMode === "per_zone"
                ? "text-zinc-100 bg-[#2d2d33] shadow-sm font-medium"
                : "hover:text-zinc-200 text-zinc-400"
            }`}
          >
            Zone Colors
          </button>
          <button
            onClick={() => setActiveMode("effect")}
            className={`px-3.5 py-1 rounded-[7px] transition-all focus:outline-none ${
              activeMode === "effect"
                ? "text-zinc-100 bg-[#2d2d33] shadow-sm font-medium"
                : "hover:text-zinc-200 text-zinc-400"
            }`}
          >
            Dynamic Effects
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="text-xs py-1.5 px-3 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-400 font-medium">
          {statusMsg}
        </div>
      )}

      {/* Mode 1: Per-Zone Mode */}
      {activeMode === "per_zone" && (
        <section className="adw-card rounded-xl p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Per-Zone RGB Configuration</h3>
            <p className="text-[11px] text-zinc-400">
              Customize colors independently across each of the 4 keyboard zones.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Zone 1 */}
            <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: zone1 }}
                />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">Zone 1</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{zone1.toUpperCase()}</span>
                </div>
              </div>
              <input
                type="color"
                value={zone1}
                onChange={(e) => setZone1(e.target.value)}
                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
              />
            </div>

            {/* Zone 2 */}
            <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: zone2 }}
                />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">Zone 2</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{zone2.toUpperCase()}</span>
                </div>
              </div>
              <input
                type="color"
                value={zone2}
                onChange={(e) => setZone2(e.target.value)}
                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
              />
            </div>

            {/* Zone 3 */}
            <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: zone3 }}
                />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">Zone 3</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{zone3.toUpperCase()}</span>
                </div>
              </div>
              <input
                type="color"
                value={zone3}
                onChange={(e) => setZone3(e.target.value)}
                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
              />
            </div>

            {/* Zone 4 */}
            <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: zone4 }}
                />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">Zone 4</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{zone4.toUpperCase()}</span>
                </div>
              </div>
              <input
                type="color"
                value={zone4}
                onChange={(e) => setZone4(e.target.value)}
                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          {/* Brightness */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Keyboard Brightness</span>
              <span className="font-semibold text-zinc-200">{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
          </div>

          <div>
            <button
              onClick={handleApplyZoneColors}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-zinc-100 text-xs font-medium transition-colors focus:outline-none shadow-sm"
            >
              Apply Zone Colors
            </button>
          </div>
        </section>
      )}

      {/* Mode 2: Dynamic Effects */}
      {activeMode === "effect" && (
        <section className="adw-card rounded-xl p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Hardware Lighting Animation</h3>
            <p className="text-[11px] text-zinc-400">
              Choose firmware-driven lighting animations with customized speed and direction.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Effect Dropdown */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 block">Animation Pattern</label>
              <select
                value={effectMode}
                onChange={(e) => setEffectMode(parseInt(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50"
              >
                {effectModesList.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Effect Color */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 block">Primary Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={effectColor}
                  onChange={(e) => setEffectColor(e.target.value)}
                  className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-300">{effectColor.toUpperCase()}</span>
              </div>
            </div>

            {/* Speed Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Animation Speed (0 - 9)</span>
                <span className="font-semibold text-zinc-200">{effectSpeed}</span>
              </div>
              <input
                type="range"
                min="0"
                max="9"
                value={effectSpeed}
                onChange={(e) => setEffectSpeed(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            {/* Brightness Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Brightness</span>
                <span className="font-semibold text-zinc-200">{effectBrightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={effectBrightness}
                onChange={(e) => setEffectBrightness(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
          </div>

          {/* Direction */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Wave Direction</span>
            <div className="inline-flex gap-2">
              <button
                type="button"
                onClick={() => setEffectDirection(1)}
                className={`px-3 py-1 rounded-md text-xs font-medium border ${
                  effectDirection === 1
                    ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Left to Right →
              </button>
              <button
                type="button"
                onClick={() => setEffectDirection(2)}
                className={`px-3 py-1 rounded-md text-xs font-medium border ${
                  effectDirection === 2
                    ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ← Right to Left
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={handleApplyEffect}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-zinc-100 text-xs font-medium transition-colors focus:outline-none shadow-sm"
            >
              Apply Effect
            </button>
          </div>
        </section>
      )}

      {/* Backlight Timeout Card */}
      <section className="adw-card rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-zinc-200">Keyboard Backlight Sleep (30s)</h3>
          <p className="text-[11px] text-zinc-400">
            Automatically shut down keyboard LED illumination after 30 seconds of user inactivity.
          </p>
        </div>
        <label className="relative inline-block w-8 h-4 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={backlightTimeout}
            onChange={(e) => handleToggleTimeout(e.target.checked)}
            className="sr-only adw-switch-input peer"
          />
          <div className="adw-switch-slider w-8 h-4 bg-zinc-700 rounded-full transition-colors relative before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:h-3 before:w-3 before:transition-transform" />
        </label>
      </section>
    </div>
  );
};
