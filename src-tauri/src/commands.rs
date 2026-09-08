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
pub fn open_external_url(url: String) -> Result<(), String> {
    if url.starts_with("http://") || url.starts_with("https://") {
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;
            let _ = Command::new("open").arg(&url).status();
            Ok(())
        }
        #[cfg(not(target_os = "macos"))]
        open::that(&url).map_err(|e| e.to_string())
    } else {
        Err("Invalid URL protocol".to_string())
    }
}

#[tauri::command]
pub fn update_dock_badge(app: AppHandle, count: String) -> Result<(), String> {
    let count_clean = count.trim();

    // 1. Update System Tray Tooltip
    if let Some(tray) = app.tray_by_id("main-tray") {
        let tooltip = if count_clean.is_empty() {
            "WhatsApp Desk".to_string()
        } else if count_clean == "•" {
            "WhatsApp Desk • Pesan belum dibaca".to_string()
        } else {
            format!("WhatsApp Desk • {} pesan belum dibaca", count_clean)
        };
        let _ = tray.set_tooltip(Some(&tooltip));
    }

    // 2. Update macOS Dock Badge
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let script = if count_clean.is_empty() {
            "".to_string()
        } else {
            count_clean.to_string()
        };
        let _ = Command::new("osascript")
            .arg("-e")
            .arg(format!("tell application \"System Events\" to set badge label of UI element \"WhatsApp Desk\" of list 1 of application process \"Dock\" to \"{}\"", script))
            .output();
    }

    Ok(())
}

fn get_default_download_dir() -> PathBuf {
    dirs::download_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("WhatsApp Downloads")
}

fn get_config_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| dirs::config_dir().unwrap_or_else(|| PathBuf::from(".")).join("whatsapp-desktop-rust"));
    dir.join("config.json")
}

fn load_custom_download_dir(app: &AppHandle) -> Option<PathBuf> {
    let path = get_config_path(app);
    if let Ok(data) = fs::read_to_string(path) {
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&data) {
            if let Some(dir) = val.get("download_dir").and_then(|v| v.as_str()) {
                let trimmed = dir.trim();
                if !trimmed.is_empty() {
                    return Some(PathBuf::from(trimmed));
                }
            }
        }
    }
    None
}

fn save_custom_download_dir(app: &AppHandle, dir: Option<&Path>) -> Result<(), String> {
    let path = get_config_path(app);
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let val = serde_json::json!({
        "download_dir": dir.map(|d| d.to_string_lossy().to_string())
    });
    fs::write(path, val.to_string()).map_err(|e| e.to_string())
}

pub fn get_effective_download_dir(app: &AppHandle) -> PathBuf {
    load_custom_download_dir(app).unwrap_or_else(get_default_download_dir)
}

#[tauri::command]
pub fn get_download_dir(app: AppHandle) -> String {
    get_effective_download_dir(&app).to_string_lossy().to_string()
}

#[tauri::command]
pub fn set_download_dir(app: AppHandle, path: String) -> Result<String, String> {
    let p = PathBuf::from(&path);
    if !p.exists() {
        fs::create_dir_all(&p).map_err(|e| format!("Gagal membuat direktori: {}", e))?;
    }
    save_custom_download_dir(&app, Some(&p))?;
    Ok(p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn reset_download_dir(app: AppHandle) -> Result<String, String> {
    save_custom_download_dir(&app, None)?;
    Ok(get_default_download_dir().to_string_lossy().to_string())
}

#[tauri::command]
pub fn pick_download_dir(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let folder = app.dialog().file().blocking_pick_folder();
    if let Some(path) = folder {
        let path_str = match path {
            tauri_plugin_dialog::FilePath::Path(p) => p.to_string_lossy().to_string(),
            tauri_plugin_dialog::FilePath::Url(u) => u.to_file_path().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
        };
        if !path_str.is_empty() {
            set_download_dir(app, path_str.clone())?;
            return Ok(Some(path_str));
        }
    }
    Ok(None)
}

#[tauri::command]
pub fn get_autostart_status(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_autostart(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    let autolaunch = app.autolaunch();
    let enabled = autolaunch.is_enabled().map_err(|e| e.to_string())?;
    if enabled {
        autolaunch.disable().map_err(|e| e.to_string())?;
        println!("🚀 Auto-start disabled");
        Ok(false)
    } else {
        autolaunch.enable().map_err(|e| e.to_string())?;
        println!("🚀 Auto-start enabled");
        Ok(true)
    }
}

#[tauri::command]
pub fn open_download_dir(app: AppHandle) -> Result<(), String> {
    let dir = get_effective_download_dir(&app);
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Gagal membuat folder unduhan: {}", e))?;
    }
    println!("📁 Membuka folder unduhan: {:?}", dir);

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let dir_str = dir.to_string_lossy().to_string();

        let apple_script = format!(
            "tell application \"Finder\"\nactivate\nopen POSIX file \"{}\"\nend tell",
            dir_str
        );
        let status = Command::new("osascript")
            .arg("-e")
            .arg(&apple_script)
            .status();

        if let Ok(s) = status {
            if s.success() {
                return Ok(());
            }
        }

        let fallback_status = Command::new("open")
            .arg("-a")
            .arg("Finder")
            .arg(&dir)
            .status();

        if let Ok(s) = fallback_status {
            if s.success() {
                return Ok(());
            }
        }

        let _ = Command::new("open").arg(&dir).status();
        return Ok(());
    }

    #[cfg(not(target_os = "macos"))]
    open::that(&dir).map_err(|e| e.to_string())
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
pub fn save_downloaded_file(app: AppHandle, filename: String, data_uri: String) -> Result<String, String> {
    use base64::Engine as _;
    let download_dir = get_effective_download_dir(&app);
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

fn get_current_app_bundle() -> PathBuf {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(macos_dir) = exe.parent() {
            if let Some(contents_dir) = macos_dir.parent() {
                if let Some(app_bundle) = contents_dir.parent() {
                    if app_bundle.extension().map_or(false, |ext| ext == "app") {
                        return app_bundle.to_path_buf();
                    }
                }
            }
        }
    }
    PathBuf::from("/Applications/WhatsApp Desk.app")
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct UpdateCheckResult {
    pub available: bool,
    pub current_version: String,
    pub latest_version: String,
    pub latest_tag: String,
    pub notes: String,
    pub download_url: String,
    pub asset_name: String,
    pub asset_size: u64,
}

fn is_version_newer(current: &str, latest: &str) -> bool {
    let parse_parts = |v: &str| -> Vec<u32> {
        v.split('.')
            .filter_map(|p| p.chars().take_while(|c| c.is_ascii_digit()).collect::<String>().parse::<u32>().ok())
            .collect()
    };

    let curr_parts = parse_parts(current);
    let late_parts = parse_parts(latest);

    let max_len = curr_parts.len().max(late_parts.len());
    for i in 0..max_len {
        let c = curr_parts.get(i).copied().unwrap_or(0);
        let l = late_parts.get(i).copied().unwrap_or(0);
        if l > c {
            return true;
        } else if l < c {
            return false;
        }
    }
    false
}

#[tauri::command]
pub fn check_for_updates(app: AppHandle) -> Result<UpdateCheckResult, String> {
    let current_version = app.package_info().version.to_string();

    #[cfg(target_os = "windows")]
    let curl_bin = "curl.exe";
    #[cfg(not(target_os = "windows"))]
    let curl_bin = "curl";

    let output = std::process::Command::new(curl_bin)
        .arg("-s")
        .arg("-L")
        .arg("--connect-timeout")
        .arg("10")
        .arg("--max-time")
        .arg("20")
        .arg("-H")
        .arg("User-Agent: WhatsApp-Desk-Updater")
        .arg("-H")
        .arg("Accept: application/vnd.github.v3+json")
        .arg("https://api.github.com/repos/ryan-prayoga/whatsapp-desktop-rust/releases/latest")
        .output()
        .map_err(|e| format!("Gagal menghubungi server rilis: {}", e))?;

    if !output.status.success() {
        return Err("Gagal memeriksa versi rilis terbaru dari GitHub".to_string());
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let release: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("Format respons rilis tidak valid: {}", e))?;

    let tag_name = release.get("tag_name")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim();

    let latest_version = tag_name.trim_start_matches('v').to_string();
    let notes = release.get("body")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if latest_version.is_empty() {
        return Err("Tidak dapat membaca nomor versi rilis terbaru".to_string());
    }

    let is_newer = is_version_newer(&current_version, &latest_version);

    let mut selected_url = String::new();
    let mut selected_name = String::new();
    let mut selected_size = 0u64;

    if is_newer {
        let assets = release.get("assets").and_then(|v| v.as_array());
        if let Some(asset_list) = assets {
            #[cfg(target_os = "macos")]
            {
                // Prefer .app.tar.gz for seamless background replacement and auto-restart, fallback to .dmg
                for a in asset_list {
                    if let Some(name) = a.get("name").and_then(|v| v.as_str()) {
                        if name.ends_with(".app.tar.gz") {
                            selected_name = name.to_string();
                            selected_url = a.get("browser_download_url").and_then(|v| v.as_str()).unwrap_or("").to_string();
                            selected_size = a.get("size").and_then(|v| v.as_u64()).unwrap_or(0);
                            break;
                        }
                    }
                }
                if selected_url.is_empty() {
                    for a in asset_list {
                        if let Some(name) = a.get("name").and_then(|v| v.as_str()) {
                            if name.ends_with(".dmg") {
                                selected_name = name.to_string();
                                selected_url = a.get("browser_download_url").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                selected_size = a.get("size").and_then(|v| v.as_u64()).unwrap_or(0);
                                break;
                            }
                        }
                    }
                }
            }

            #[cfg(target_os = "windows")]
            {
                for a in asset_list {
                    if let Some(name) = a.get("name").and_then(|v| v.as_str()) {
                        if name.ends_with("-setup.exe") || name.ends_with(".exe") {
                            selected_name = name.to_string();
                            selected_url = a.get("browser_download_url").and_then(|v| v.as_str()).unwrap_or("").to_string();
                            selected_size = a.get("size").and_then(|v| v.as_u64()).unwrap_or(0);
                            break;
                        }
                    }
                }
            }

            #[cfg(target_os = "linux")]
            {
                for a in asset_list {
                    if let Some(name) = a.get("name").and_then(|v| v.as_str()) {
                        if name.ends_with(".AppImage") {
                            selected_name = name.to_string();
                            selected_url = a.get("browser_download_url").and_then(|v| v.as_str()).unwrap_or("").to_string();
                            selected_size = a.get("size").and_then(|v| v.as_u64()).unwrap_or(0);
                            break;
                        }
                    }
                }
                if selected_url.is_empty() {
                    for a in asset_list {
                        if let Some(name) = a.get("name").and_then(|v| v.as_str()) {
                            if name.ends_with(".deb") {
                                selected_name = name.to_string();
                                selected_url = a.get("browser_download_url").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                selected_size = a.get("size").and_then(|v| v.as_u64()).unwrap_or(0);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(UpdateCheckResult {
        available: is_newer && !selected_url.is_empty(),
        current_version,
        latest_version,
        latest_tag: tag_name.to_string(),
        notes,
        download_url: selected_url,
        asset_name: selected_name,
        asset_size: selected_size,
    })
}

#[tauri::command]
pub async fn download_and_install_update(
    _app: AppHandle,
    download_url: String,
    asset_name: String,
) -> Result<String, String> {
    if !download_url.starts_with("https://") {
        return Err("Protokol URL tidak aman atau tidak valid".to_string());
    }

    let temp_dir = std::env::temp_dir().join("wa_desk_update");
    let _ = fs::create_dir_all(&temp_dir);
    let downloaded_file = temp_dir.join(&asset_name);

    #[cfg(target_os = "macos")]
    {
        let status = std::process::Command::new("curl")
            .arg("-L")
            .arg("-f")
            .arg("-s")
            .arg("-o")
            .arg(&downloaded_file)
            .arg(&download_url)
            .status()
            .map_err(|e| format!("Gagal mengunduh pembaruan: {}", e))?;

        if !status.success() {
            return Err("Gagal mengunduh berkas dari GitHub Releases".to_string());
        }

        if asset_name.ends_with(".tar.gz") {
            let extract_dir = temp_dir.join("extracted");
            let _ = fs::remove_dir_all(&extract_dir);
            let _ = fs::create_dir_all(&extract_dir);

            let tar_status = std::process::Command::new("tar")
                .arg("-xzf")
                .arg(&downloaded_file)
                .arg("-C")
                .arg(&extract_dir)
                .status()
                .map_err(|e| format!("Gagal mengekstrak berkas pembaruan: {}", e))?;

            if !tar_status.success() {
                return Err("Gagal mengekstrak berkas pembaruan".to_string());
            }

            let new_app = extract_dir.join("WhatsApp Desk.app");
            if !new_app.exists() {
                return Err("Arsip pembaruan tidak berisi WhatsApp Desk.app".to_string());
            }

            let target_app = get_current_app_bundle();

            let updater_script = temp_dir.join("finish_update.sh");
            let script_content = format!(
                "#!/bin/bash\n\
                sleep 1\n\
                xattr -dr com.apple.quarantine \"{}\" 2>/dev/null\n\
                rm -rf \"{}\"\n\
                cp -R \"{}\" \"{}\"\n\
                rm -rf \"{}\"\n\
                open -n \"{}\"\n",
                new_app.display(),
                target_app.display(),
                new_app.display(),
                target_app.display(),
                temp_dir.display(),
                target_app.display(),
            );

            fs::write(&updater_script, script_content)
                .map_err(|e| format!("Gagal menyiapkan skrip instalasi: {}", e))?;

            use std::os::unix::fs::PermissionsExt;
            let _ = fs::set_permissions(&updater_script, fs::Permissions::from_mode(0o755));

            let _ = std::process::Command::new("sh")
                .arg(&updater_script)
                .spawn();

            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(800));
                std::process::exit(0);
            });

            return Ok("Pembaruan berhasil dipasang. Aplikasi akan segera dimulai ulang...".to_string());
        } else if asset_name.ends_with(".dmg") {
            let _ = std::process::Command::new("open").arg(&downloaded_file).status();
            return Ok("Installer DMG berhasil diunduh dan dibuka.".to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        let status = std::process::Command::new("curl.exe")
            .arg("-L")
            .arg("-f")
            .arg("-s")
            .arg("-o")
            .arg(&downloaded_file)
            .arg(&download_url)
            .status()
            .map_err(|e| format!("Gagal mengunduh pembaruan: {}", e))?;

        if !status.success() {
            return Err("Gagal mengunduh installer Windows".to_string());
        }

        let _ = std::process::Command::new(&downloaded_file).spawn();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(1000));
            std::process::exit(0);
        });

        return Ok("Installer pembaruan dijalankan. Aplikasi akan ditutup...".to_string());
    }

    #[cfg(target_os = "linux")]
    {
        let status = std::process::Command::new("curl")
            .arg("-L")
            .arg("-f")
            .arg("-s")
            .arg("-o")
            .arg(&downloaded_file)
            .arg(&download_url)
            .status()
            .map_err(|e| format!("Gagal mengunduh pembaruan: {}", e))?;

        if !status.success() {
            return Err("Gagal mengunduh berkas pembaruan Linux".to_string());
        }

        if asset_name.ends_with(".AppImage") {
            use std::os::unix::fs::PermissionsExt;
            let _ = fs::set_permissions(&downloaded_file, fs::Permissions::from_mode(0o755));
            let _ = std::process::Command::new(&downloaded_file).spawn();
            std::process::exit(0);
        } else {
            let _ = open::that(&downloaded_file);
        }

        return Ok("Berkas pembaruan Linux berhasil diunduh.".to_string());
    }

    Ok("Proses pembaruan selesai.".to_string())
}

#[tauri::command]
pub fn set_native_theme(app: AppHandle, theme: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let t = match theme.to_lowercase().as_str() {
            "dark" => Some(tauri::Theme::Dark),
            "light" => Some(tauri::Theme::Light),
            _ => None,
        };
        window.set_theme(t).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_version_newer() {
        assert!(is_version_newer("0.2.7", "0.2.8"));
        assert!(is_version_newer("0.2.7", "0.3.0"));
        assert!(is_version_newer("0.2.7", "1.0.0"));
        assert!(!is_version_newer("0.2.8", "0.2.7"));
        assert!(!is_version_newer("0.2.8", "0.2.8"));
        assert!(!is_version_newer("1.0.0", "0.9.9"));
        assert!(is_version_newer("0.2.7", "0.2.7.1"));
    }
}


