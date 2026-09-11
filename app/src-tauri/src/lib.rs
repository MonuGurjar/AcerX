mod telemetry;
mod daemon_client;

use std::sync::Arc;
use std::time::Duration;
use tauri::{Emitter, State};
use telemetry::{SystemMetrics, TelemetryCollector};
use daemon_client::{send_command, DaemonRequest};

struct AppState {
    telemetry: Arc<TelemetryCollector>,
}

#[tauri::command]
async fn get_telemetry(state: State<'_, AppState>) -> Result<SystemMetrics, String> {
    Ok(state.telemetry.collect())
}

#[tauri::command]
async fn get_daemon_status() -> Result<serde_json::Value, String> {
    let res = send_command(DaemonRequest::GetStatus).await?;
    if res.success {
        Ok(res.data.unwrap_or_default())
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to get status".to_string()))
    }
}

#[tauri::command]
async fn set_thermal_profile(profile: String) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetPlatformProfile { profile }).await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set profile".to_string()))
    }
}

#[tauri::command]
async fn set_fan_speeds(cpu: u8, gpu: u8) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetFanSpeed { cpu, gpu }).await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set fan speeds".to_string()))
    }
}

#[tauri::command]
async fn set_battery_limiter(enabled: bool) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetBatteryLimiter { enabled }).await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set battery limiter".to_string()))
    }
}

#[tauri::command]
async fn set_lcd_override(enabled: bool) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetLcdOverride { enabled }).await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set LCD override".to_string()))
    }
}

#[tauri::command]
async fn set_backlight_timeout(enabled: bool) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetBacklightTimeout { enabled }).await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set backlight timeout".to_string()))
    }
}

#[tauri::command]
async fn set_boot_sound(enabled: bool) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetBootSound { enabled }).await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set boot sound".to_string()))
    }
}

#[tauri::command]
async fn set_battery_calibration(enabled: bool) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetBatteryCalibration { enabled }).await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set battery calibration".to_string()))
    }
}

#[tauri::command]
async fn set_usb_charging(level: u8) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetUsbCharging { level }).await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set USB charging".to_string()))
    }
}

#[tauri::command]
async fn set_per_zone_mode(
    zone1: String,
    zone2: String,
    zone3: String,
    zone4: String,
    brightness: u8,
) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetPerZoneMode {
        zone1,
        zone2,
        zone3,
        zone4,
        brightness,
    })
    .await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set per-zone RGB".to_string()))
    }
}

#[tauri::command]
async fn set_four_zone_mode(
    mode: u8,
    speed: u8,
    brightness: u8,
    direction: u8,
    red: u8,
    green: u8,
    blue: u8,
) -> Result<bool, String> {
    let res = send_command(DaemonRequest::SetFourZoneMode {
        mode,
        speed,
        brightness,
        direction,
        red,
        green,
        blue,
    })
    .await?;
    if res.success {
        Ok(true)
    } else {
        Err(res.message.unwrap_or_else(|| "Failed to set four-zone RGB".to_string()))
    }
}

pub fn run() {
    let telemetry = Arc::new(TelemetryCollector::new());
    let telemetry_bg = Arc::clone(&telemetry);

    tauri::Builder::default()
        .manage(AppState { telemetry })
        .setup(move |app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(Duration::from_millis(1500));
                loop {
                    interval.tick().await;
                    let payload = telemetry_bg.collect();
                    let _ = handle.emit("telemetry-update", payload);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_telemetry,
            get_daemon_status,
            set_thermal_profile,
            set_fan_speeds,
            set_battery_limiter,
            set_battery_calibration,
            set_usb_charging,
            set_lcd_override,
            set_backlight_timeout,
            set_boot_sound,
            set_per_zone_mode,
            set_four_zone_mode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AcerX application");
}
