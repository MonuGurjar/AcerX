import React from "react";

export type TabType = "dashboard" | "fans" | "performance" | "lighting" | "graphs" | "settings";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside
      className="w-52 bg-gnome-sidebar border-r border-zinc-800/80 flex flex-col justify-between py-2.5 px-2 select-none shrink-0"
      data-purpose="sidebar-navigation"
    >
      <nav className="space-y-1">
        {/* Item: Dashboard */}
        <button
          onClick={() => onTabChange("dashboard")}
          className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg font-medium text-xs transition-colors focus:outline-none ${
            activeTab === "dashboard"
              ? "adw-row-active text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          }`}
        >
          <svg
            className={`w-4 h-4 shrink-0 ${
              activeTab === "dashboard" ? "text-gnome-accent" : "text-zinc-400"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 4.75C2 3.784 2.784 3 3.75 3h4.5c.966 0 1.75.784 1.75 1.75v4.5A1.75 1.75 0 018.25 11h-4.5A1.75 1.75 0 012 9.25v-4.5zm0 8c0-.966.784-1.75 1.75-1.75h4.5c.966 0 1.75.784 1.75 1.75v4.5A1.75 1.75 0 018.25 21h-4.5A1.75 1.75 0 012 19.25v-4.5zm10-8c0-.966.784-1.75 1.75-1.75h4.5c.966 0 1.75.784 1.75 1.75v4.5a1.75 1.75 0 01-1.75 1.75h-4.5A1.75 1.75 0 0112 9.25v-4.5zm0 8c0-.966.784-1.75 1.75-1.75h4.5c.966 0 1.75.784 1.75 1.75v4.5a1.75 1.75 0 01-1.75 1.75h-4.5a1.75 1.75 0 01-1.75-1.75v-4.5z" />
          </svg>
          <span className="tracking-tight font-medium">Dashboard</span>
        </button>

        {/* Item: Fan Controls */}
        <button
          onClick={() => onTabChange("fans")}
          className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg font-medium text-xs transition-colors focus:outline-none ${
            activeTab === "fans"
              ? "adw-row-active text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          }`}
        >
          <svg
            className={`w-4 h-4 stroke-current fill-none stroke-2 shrink-0 ${
              activeTab === "fans" ? "text-gnome-accent" : "text-zinc-400"
            }`}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 12c2 0 3-2 3-3.5S13.5 6 12 6s-1 1.5 0 3.5zm0 0c0 2 2 3 3.5 3S19 13.5 19 12s-1.5-1-3.5 0zm0 0c-2 0-3 2-3 3.5S10.5 18 12 18s1-1.5 0-3.5zm0 0c0-2-2-3-3.5-3S5 10.5 5 12s1.5 1 3.5 0z" />
          </svg>
          <span>Fan Controls</span>
        </button>

        {/* Item: Performance Tuning */}
        <button
          onClick={() => onTabChange("performance")}
          className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg font-medium text-xs transition-colors focus:outline-none ${
            activeTab === "performance"
              ? "adw-row-active text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          }`}
        >
          <svg
            className={`w-4 h-4 stroke-current fill-none stroke-2 shrink-0 ${
              activeTab === "performance" ? "text-gnome-accent" : "text-zinc-400"
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M12 4a8 8 0 00-8 8c0 2.2 1 4.2 2.6 5.6M20 12a8 8 0 00-2.6-5.6" />
            <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" />
            <path d="M13.4 10.6L17 7" />
          </svg>
          <span>Performance Tuning</span>
        </button>

        {/* Item: Keyboard Lighting */}
        <button
          onClick={() => onTabChange("lighting")}
          className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg font-medium text-xs transition-colors focus:outline-none ${
            activeTab === "lighting"
              ? "adw-row-active text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          }`}
        >
          <svg
            className={`w-4 h-4 stroke-current fill-none stroke-2 shrink-0 ${
              activeTab === "lighting" ? "text-gnome-accent" : "text-zinc-400"
            }`}
            viewBox="0 0 24 24"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
          </svg>
          <span>Keyboard RGB</span>
        </button>

        {/* Item: Hardware Graphs */}
        <button
          onClick={() => onTabChange("graphs")}
          className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg font-medium text-xs transition-colors focus:outline-none ${
            activeTab === "graphs"
              ? "adw-row-active text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          }`}
        >
          <svg
            className={`w-4 h-4 stroke-current fill-none stroke-2 shrink-0 ${
              activeTab === "graphs" ? "text-gnome-accent" : "text-zinc-400"
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M3 3v18h18" />
            <path d="M19 9l-5 5-4-4-3 3" />
          </svg>
          <span>Hardware Graphs</span>
        </button>
      </nav>

      {/* Sidebar Bottom Settings */}
      <div className="pt-2 border-t border-zinc-800/80">
        <button
          onClick={() => onTabChange("settings")}
          className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-lg font-medium text-xs transition-colors focus:outline-none ${
            activeTab === "settings"
              ? "adw-row-active text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          }`}
        >
          <svg
            className={`w-4 h-4 stroke-current fill-none stroke-2 shrink-0 ${
              activeTab === "settings" ? "text-gnome-accent" : "text-zinc-400"
            }`}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span>App Settings</span>
        </button>
      </div>
    </aside>
  );
};
