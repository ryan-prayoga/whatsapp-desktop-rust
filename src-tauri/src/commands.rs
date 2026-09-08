use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn send_notification(app: AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(if title.trim().is_empty() { "WhatsApp Desk" } else { &title })
        .body(&body)
        .show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_always_on_top(app: AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        let current = window.is_always_on_top().unwrap_or(false);
        let new_state = !current;
        window.set_always_on_top(new_state).map_err(|e| e.to_string())?;
        println!("📌 Always on Top set to: {}", new_state);
        Ok(new_state)
    } else {
        Err("Main window not found".to_string())
    }
}

#[tauri::command]
pub fn open_download_dir() -> Result<(), String> {
    let dir = get_default_download_dir();
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    open::that(&dir).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    if url.starts_with("http://") || url.starts_with("https://") {
        open::that(&url).map_err(|e| e.to_string())
    } else {
        Err("Invalid URL protocol".to_string())
    }
}

#[tauri::command]
pub fn update_dock_badge(_app: AppHandle, count: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        // Clean and safe dock tile update via osascript or Objective-C
        let count_clean = count.trim();
        let script = if count_clean.is_empty() {
            "".to_string()
        } else {
            count_clean.to_string()
        };
        // Use osascript or let Tauri notification badge handle it
        let _ = Command::new("osascript")
            .arg("-e")
            .arg(format!("tell application \"System Events\" to set badge label of UI element \"WhatsApp Desk\" of list 1 of application process \"Dock\" to \"{}\"", script))
            .output();
    }
    let _ = count;
    Ok(())
}

fn get_default_download_dir() -> PathBuf {
    dirs::download_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("WhatsApp Downloads")
}

fn get_unique_file_path(dir: &Path, filename: &str) -> PathBuf {
    let base_path = dir.join(filename);
    if !base_path.exists() {
        return base_path;
    }

    let stem = Path::new(filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("download");
    let ext = Path::new(filename)
        .extension()
        .and_then(|s| s.to_str())
        .map(|e| format!(".{}", e))
        .unwrap_or_default();

    let mut counter = 1;
    loop {
        let candidate = dir.join(format!("{} ({}){}", stem, counter, ext));
        if !candidate.exists() {
            return candidate;
        }
        counter += 1;
    }
}

#[tauri::command]
pub fn save_downloaded_file(filename: String, data_uri: String) -> Result<String, String> {
    use base64::Engine as _;
    let download_dir = get_default_download_dir();
    fs::create_dir_all(&download_dir).map_err(|e| format!("Failed to create download dir: {}", e))?;

    // Sanitize filename
    let clean_filename = Path::new(&filename)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("whatsapp_file");

    // Extract base64 payload
    let b64_payload = if let Some(idx) = data_uri.find(";base64,") {
        &data_uri[idx + 8..]
    } else {
        &data_uri
    };

    let raw_bytes = base64::engine::general_purpose::STANDARD
        .decode(b64_payload.trim())
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    let target_path = get_unique_file_path(&download_dir, clean_filename);
    fs::write(&target_path, raw_bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(target_path.to_string_lossy().to_string())
}
