use std::fs::{self, Permissions};
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{UnixListener, UnixStream};
use tokio::signal;
use tracing::{error, info, warn};

const SOCKET_PATH: &str = "/tmp/acerx.sock";
const FALLBACK_SOCKET_PATH: &str = "/run/void-control.sock";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action", content = "payload")]
enum Request {
    GetStatus,
    SetPlatformProfile { profile: String },
    SetFanSpeed { cpu: u8, gpu: u8 },
    SetBatteryLimiter { enabled: bool },
    SetBatteryCalibration { enabled: bool },
    SetLcdOverride { enabled: bool },
    SetBacklightTimeout { enabled: bool },
    SetBootSound { enabled: bool },
    SetUsbCharging { level: u8 },
    SetPerZoneMode {
        zone1: String,
        zone2: String,
        zone3: String,
        zone4: String,
        brightness: u8,
    },
    SetFourZoneMode {
        mode: u8,
        speed: u8,
        brightness: u8,
        direction: u8,
        red: u8,
        green: u8,
        blue: u8,
    },
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<serde_json::Value>,
}

impl Response {
    fn ok(data: serde_json::Value) -> Self {
        Self { success: true, message: None, data: Some(data) }
    }
    fn success() -> Self {
        Self { success: true, message: None, data: None }
    }
    fn err(msg: impl Into<String>) -> Self {
        Self { success: false, message: Some(msg.into()), data: None }
    }
}

struct HardwareManager {
    sense_dir: Option<PathBuf>,
    kb_dir: Option<PathBuf>,
    laptop_model: String,
}

impl HardwareManager {
    fn new() -> Self {
        let laptop_model = fs::read_to_string("/sys/class/dmi/id/product_name")
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|_| "Acer Gaming Laptop".to_string());

        let mut sense_dir = None;
        let sense_candidates = [
            "/sys/module/linuwu_sense/drivers/platform:acer-wmi/acer-wmi/predator_sense",
            "/sys/module/linuwu_sense/drivers/platform:acer-wmi/acer-wmi/nitro_sense",
            "/sys/devices/platform/acer-wmi/predator_sense",
            "/sys/devices/platform/acer-wmi/nitro_sense",
            "/sys/bus/platform/drivers/acer-wmi/acer-wmi/predator_sense",
            "/sys/bus/platform/drivers/acer-wmi/acer-wmi/nitro_sense",
        ];

        for c in &sense_candidates {
            let p = Path::new(c);
            if p.exists() {
                sense_dir = Some(p.to_path_buf());
                break;
            }
        }

        let mut kb_dir = None;
        let kb_candidates = [
            "/sys/module/linuwu_sense/drivers/platform:acer-wmi/acer-wmi/four_zoned_kb",
            "/sys/devices/platform/acer-wmi/four_zoned_kb",
            "/sys/bus/platform/drivers/acer-wmi/acer-wmi/four_zoned_kb",
        ];

        for c in &kb_candidates {
            let p = Path::new(c);
            if p.exists() {
                kb_dir = Some(p.to_path_buf());
                break;
            }
        }

        Self {
            sense_dir,
            kb_dir,
            laptop_model,
        }
    }

    fn write_sysfs(&self, file_name: &str, content: &str) -> Result<(), String> {
        let dir = self.sense_dir.as_ref().ok_or_else(|| "Linuwu-Sense driver path not found".to_string())?;
        let target = dir.join(file_name);
        fs::write(&target, content).map_err(|e| format!("Failed to write to {}: {}", target.display(), e))
    }

    fn read_sysfs(&self, file_name: &str) -> Result<String, String> {
        let dir = self.sense_dir.as_ref().ok_or_else(|| "Linuwu-Sense driver path not found".to_string())?;
        let target = dir.join(file_name);
        fs::read_to_string(&target).map(|s| s.trim().to_string()).map_err(|e| format!("Failed to read {}: {}", target.display(), e))
    }

    fn write_kb_sysfs(&self, file_name: &str, content: &str) -> Result<(), String> {
        let dir = self.kb_dir.as_ref().ok_or_else(|| "Linuwu-Sense keyboard path not found".to_string())?;
        let target = dir.join(file_name);
        fs::write(&target, content).map_err(|e| format!("Failed to write to {}: {}", target.display(), e))
    }

    fn read_kb_sysfs(&self, file_name: &str) -> Result<String, String> {
        let dir = self.kb_dir.as_ref().ok_or_else(|| "Linuwu-Sense keyboard path not found".to_string())?;
        let target = dir.join(file_name);
        fs::read_to_string(&target).map(|s| s.trim().to_string()).map_err(|e| format!("Failed to read {}: {}", target.display(), e))
    }

    fn get_status(&self) -> serde_json::Value {
        let driver_loaded = self.sense_dir.is_some() || Path::new("/sys/module/linuwu_sense").exists() || Path::new("/sys/module/acer_wmi").exists();
        let current_profile = fs::read_to_string("/sys/firmware/acpi/platform_profile")
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|_| "balanced".to_string());

        let profile_choices = fs::read_to_string("/sys/firmware/acpi/platform_profile_choices")
            .map(|s| s.split_whitespace().map(String::from).collect::<Vec<String>>())
            .unwrap_or_default();

        let fan_speed = self.read_sysfs("fan_speed").unwrap_or_else(|_| "0,0".to_string());
        let battery_limiter = self.read_sysfs("battery_limiter").map(|v| v == "1").unwrap_or(false);
        let battery_calibration = self.read_sysfs("battery_calibration").map(|v| v == "1").unwrap_or(false);
        let lcd_override = self.read_sysfs("lcd_override").map(|v| v == "1").unwrap_or(false);
        let backlight_timeout = self.read_sysfs("backlight_timeout").map(|v| v == "1").unwrap_or(true);
        let boot_sound = self.read_sysfs("boot_animation_sound").map(|v| v == "1").unwrap_or(false);
        let usb_charging = self.read_sysfs("usb_charging").and_then(|v| v.parse::<u8>().map_err(|e| e.to_string())).unwrap_or(0);
        let per_zone_mode = self.read_kb_sysfs("per_zone_mode").unwrap_or_default();
        let four_zone_mode = self.read_kb_sysfs("four_zone_mode").unwrap_or_default();

        serde_json::json!({
            "driver_loaded": driver_loaded,
            "laptop_model": self.laptop_model,
            "current_profile": current_profile,
            "profile_choices": profile_choices,
            "fan_speed": fan_speed,
            "battery_limiter": battery_limiter,
            "battery_calibration": battery_calibration,
            "lcd_override": lcd_override,
            "backlight_timeout": backlight_timeout,
            "boot_sound": boot_sound,
            "usb_charging": usb_charging,
            "per_zone_mode": per_zone_mode,
            "four_zone_mode": four_zone_mode,
            "has_rgb_kb": self.kb_dir.is_some(),
        })
    }

    fn set_platform_profile(&self, profile: &str) -> Result<(), String> {
        let valid_choices = fs::read_to_string("/sys/firmware/acpi/platform_profile_choices")
            .map(|s| s.split_whitespace().map(String::from).collect::<Vec<String>>())
            .unwrap_or_default();

        let lower = profile.to_lowercase();
        let target = match lower.as_str() {
            "eco" => "low-power",
            "silent" | "quiet" => "quiet",
            "balanced" => "balanced",
            "performance" | "turbo" => {
                if valid_choices.contains(&"performance".to_string()) {
                    "performance"
                } else if valid_choices.contains(&"balanced-performance".to_string()) {
                    "balanced-performance"
                } else {
                    "performance"
                }
            }
            other => other,
        };

        if !valid_choices.is_empty() && !valid_choices.contains(&target.to_string()) {
            if target == "low-power" && valid_choices.contains(&"quiet".to_string()) {
                return fs::write("/sys/firmware/acpi/platform_profile", "quiet")
                    .map_err(|e| format!("Failed to write platform profile: {}", e));
            }
            warn!("Requested profile '{}' mapped to '{}' not explicitly in choices {:?}", profile, target, valid_choices);
        }

        fs::write("/sys/firmware/acpi/platform_profile", target)
            .map_err(|e| format!("Failed to write platform profile: {}", e))
    }

    fn set_fan_speed(&self, cpu: u8, gpu: u8) -> Result<(), String> {
        let cpu_val = cpu.min(100);
        let gpu_val = gpu.min(100);
        self.write_sysfs("fan_speed", &format!("{},{}", cpu_val, gpu_val))
    }

    fn set_battery_limiter(&self, enabled: bool) -> Result<(), String> {
        self.write_sysfs("battery_limiter", if enabled { "1" } else { "0" })
    }

    fn set_battery_calibration(&self, enabled: bool) -> Result<(), String> {
        self.write_sysfs("battery_calibration", if enabled { "1" } else { "0" })
    }

    fn set_lcd_override(&self, enabled: bool) -> Result<(), String> {
        self.write_sysfs("lcd_override", if enabled { "1" } else { "0" })
    }

    fn set_backlight_timeout(&self, enabled: bool) -> Result<(), String> {
        self.write_sysfs("backlight_timeout", if enabled { "1" } else { "0" })
    }

    fn set_boot_sound(&self, enabled: bool) -> Result<(), String> {
        self.write_sysfs("boot_animation_sound", if enabled { "1" } else { "0" })
    }

    fn set_usb_charging(&self, level: u8) -> Result<(), String> {
        self.write_sysfs("usb_charging", &level.to_string())
    }

    fn set_per_zone_mode(&self, zone1: &str, zone2: &str, zone3: &str, zone4: &str, brightness: u8) -> Result<(), String> {
        let clean = |s: &str| s.trim().trim_start_matches('#').to_string();
        let payload = format!(
            "{},{},{},{},{}",
            clean(zone1),
            clean(zone2),
            clean(zone3),
            clean(zone4),
            brightness.min(100)
        );
        self.write_kb_sysfs("per_zone_mode", &payload)
    }

    fn set_four_zone_mode(&self, mode: u8, speed: u8, brightness: u8, direction: u8, red: u8, green: u8, blue: u8) -> Result<(), String> {
        let payload = format!(
            "{},{},{},{},{},{},{}",
            mode.min(7),
            speed.min(9),
            brightness.min(100),
            direction.clamp(1, 2),
            red,
            green,
            blue
        );
        self.write_kb_sysfs("four_zone_mode", &payload)
    }
}

async fn handle_connection(mut stream: UnixStream, manager: Arc<HardwareManager>) {
    let mut buffer = vec![0u8; 4096];
    let n = match stream.read(&mut buffer).await {
        Ok(n) if n > 0 => n,
        _ => return,
    };

    let response = match serde_json::from_slice::<Request>(&buffer[..n]) {
        Ok(req) => match req {
            Request::GetStatus => Response::ok(manager.get_status()),
            Request::SetPlatformProfile { profile } => {
                match manager.set_platform_profile(&profile) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
            Request::SetFanSpeed { cpu, gpu } => {
                match manager.set_fan_speed(cpu, gpu) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
            Request::SetBatteryLimiter { enabled } => {
                match manager.set_battery_limiter(enabled) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
            Request::SetBatteryCalibration { enabled } => {
                match manager.set_battery_calibration(enabled) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
            Request::SetLcdOverride { enabled } => {
                match manager.set_lcd_override(enabled) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
            Request::SetBacklightTimeout { enabled } => {
                match manager.set_backlight_timeout(enabled) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
            Request::SetBootSound { enabled } => {
                match manager.set_boot_sound(enabled) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
            Request::SetUsbCharging { level } => {
                match manager.set_usb_charging(level) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
            Request::SetPerZoneMode { zone1, zone2, zone3, zone4, brightness } => {
                match manager.set_per_zone_mode(&zone1, &zone2, &zone3, &zone4, brightness) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
            Request::SetFourZoneMode { mode, speed, brightness, direction, red, green, blue } => {
                match manager.set_four_zone_mode(mode, speed, brightness, direction, red, green, blue) {
                    Ok(_) => Response::success(),
                    Err(e) => Response::err(e),
                }
            }
        },
        Err(e) => Response::err(format!("Invalid request format: {}", e)),
    };

    if let Ok(bytes) = serde_json::to_vec(&response) {
        let _ = stream.write_all(&bytes).await;
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter("acerx_daemon=debug,info")
        .init();

    info!("Starting AcerX Privileged Hardware Daemon...");

    let socket_path = SOCKET_PATH;
    let _ = fs::remove_file(socket_path);

    let (listener, actual_path) = match UnixListener::bind(socket_path) {
        Ok(l) => (l, socket_path),
        Err(e) => {
            warn!("Failed to bind to {}, falling back to {}: {}", socket_path, FALLBACK_SOCKET_PATH, e);
            let _ = fs::remove_file(FALLBACK_SOCKET_PATH);
            (UnixListener::bind(FALLBACK_SOCKET_PATH)?, FALLBACK_SOCKET_PATH)
        }
    };
    #[cfg(unix)]
    {
        use std::ffi::CString;
        let c_path = CString::new(actual_path).unwrap();
        unsafe {
            libc::chmod(c_path.as_ptr(), 0o666);
        }
    }
    info!("AcerX Daemon listening on Unix socket: {}", actual_path);

    let manager = Arc::new(HardwareManager::new());

    let mut sigint = signal::unix::signal(signal::unix::SignalKind::interrupt())?;
    let mut sigterm = signal::unix::signal(signal::unix::SignalKind::terminate())?;

    loop {
        tokio::select! {
            accept_res = listener.accept() => {
                match accept_res {
                    Ok((stream, _)) => {
                        let m = Arc::clone(&manager);
                        tokio::spawn(async move {
                            handle_connection(stream, m).await;
                        });
                    }
                    Err(e) => error!("Failed to accept socket connection: {}", e),
                }
            }
            _ = sigint.recv() => {
                info!("SIGINT received, shutting down daemon...");
                break;
            }
            _ = sigterm.recv() => {
                info!("SIGTERM received, shutting down daemon...");
                break;
            }
        }
    }

    let _ = fs::remove_file(socket_path);
    info!("Socket cleaned up. AcerX daemon terminated cleanly.");
    Ok(())
}
