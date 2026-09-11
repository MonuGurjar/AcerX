use std::path::Path;
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::UnixStream;

const PRIMARY_SOCKET_PATH: &str = "/tmp/acerx.sock";
const FALLBACK_SOCKET_PATH1: &str = "/tmp/void-control.sock";
const FALLBACK_SOCKET_PATH2: &str = "/run/void-control.sock";

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "action", content = "payload")]
pub enum DaemonRequest {
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
pub struct DaemonResponse {
    pub success: bool,
    pub message: Option<String>,
    pub data: Option<serde_json::Value>,
}

pub async fn send_command(req: DaemonRequest) -> Result<DaemonResponse, String> {
    let candidates = [
        PRIMARY_SOCKET_PATH,
        FALLBACK_SOCKET_PATH1,
        FALLBACK_SOCKET_PATH2,
    ];

    let mut stream = None;
    let mut last_err = String::new();

    for sock in &candidates {
        if Path::new(sock).exists() {
            match UnixStream::connect(sock).await {
                Ok(s) => {
                    stream = Some(s);
                    break;
                }
                Err(e) => {
                    last_err = format!("Failed to connect to {}: {}", sock, e);
                }
            }
        }
    }

    let mut stream = match stream {
        Some(s) => s,
        None => {
            if last_err.is_empty() {
                return Err("AcerX daemon socket not found. Ensure acerx.service is running.".to_string());
            } else {
                return Err(format!("Could not connect to AcerX daemon: {}", last_err));
            }
        }
    };

    let payload = serde_json::to_vec(&req)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;

    stream.write_all(&payload)
        .await
        .map_err(|e| format!("Failed to write to daemon socket: {}", e))?;

    let mut buffer = vec![0u8; 4096];
    let n = stream.read(&mut buffer)
        .await
        .map_err(|e| format!("Failed to read from daemon socket: {}", e))?;

    if n == 0 {
        return Err("Empty response from daemon".to_string());
    }

    serde_json::from_slice::<DaemonResponse>(&buffer[..n])
        .map_err(|e| format!("Invalid JSON response from daemon: {}", e))
}
