import React, { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { SystemMetrics } from "./types/telemetry";
import { TopBar } from "./components/TopBar";
import { Sidebar, TabType } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { FansTab } from "./components/FansTab";
import { PerformanceTab } from "./components/PerformanceTab";
import { LightingTab } from "./components/LightingTab";
import { GraphsTab } from "./components/GraphsTab";
import { SettingsTab } from "./components/SettingsTab";
import "./styles/cyberpunk.css";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [currentProfile, setCurrentProfile] = useState<string>("balanced");

  useEffect(() => {
    const fetchTelemetry = () => {
      invoke<SystemMetrics>("get_telemetry")
        .then((m) => {
          setMetrics(m);
          if (m.current_profile) {
            setCurrentProfile(m.current_profile);
          }
        })
        .catch((err) => {
          console.warn("Telemetry fetch error:", err);
        });
    };

    fetchTelemetry();

    // Listen to real-time events streamed from Tauri Rust background task
    const unlistenPromise = listen<SystemMetrics>("telemetry-update", (event) => {
      setMetrics(event.payload);
      if (event.payload.current_profile) {
        setCurrentProfile(event.payload.current_profile);
      }
    });

    // Fallback polling interval every 1 second to ensure UI never desyncs
    const pollInterval = setInterval(fetchTelemetry, 1000);

    return () => {
      clearInterval(pollInterval);
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-gnome-bg overflow-hidden select-none font-sans text-zinc-200 border border-zinc-800/80 rounded-lg shadow-2xl">
      <TopBar
        currentProfile={currentProfile}
        isPluggedIn={metrics?.is_plugged_in ?? true}
        batteryPercent={metrics?.battery_percent ?? 100}
        batteryStatus={metrics?.battery_status}
        onProfileChange={(p) => setCurrentProfile(p)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} />

        <main className="flex-1 flex flex-col overflow-y-auto bg-gnome-bg">
          {activeTab === "dashboard" && <Dashboard metrics={metrics} />}
          {activeTab === "fans" && <FansTab fans={metrics?.fans ?? null} />}
          {activeTab === "performance" && (
            <PerformanceTab
              currentProfile={currentProfile}
              onProfileChange={(p) => setCurrentProfile(p)}
            />
          )}
          {activeTab === "lighting" && <LightingTab />}
          {activeTab === "graphs" && <GraphsTab metrics={metrics} />}
          {activeTab === "settings" && <SettingsTab metrics={metrics} />}
        </main>
      </div>
    </div>
  );
};
