use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_i = MenuItem::with_id(app, "show", "Buka WhatsApp", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let pin_i = MenuItem::with_id(app, "pin", "Always on Top", true, Some("CmdOrCtrl+Shift+T"))?;
    let privacy_i = MenuItem::with_id(app, "privacy", "Mode Privasi", true, Some("CmdOrCtrl+Shift+P"))?;
    let mute_i = MenuItem::with_id(app, "mute", "Senyapkan Audio", true, Some("CmdOrCtrl+Shift+M"))?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let download_i = MenuItem::with_id(app, "downloads", "Buka Folder Unduhan", true, Some("CmdOrCtrl+Shift+D"))?;
    let reload_i = MenuItem::with_id(app, "reload", "Muat Ulang Chat", true, Some("CmdOrCtrl+Shift+R"))?;
    let sep3 = PredefinedMenuItem::separator(app)?;
    let quit_i = MenuItem::with_id(app, "quit", "Keluar", true, Some("CmdOrCtrl+Q"))?;

    let menu = Menu::with_items(
        app,
        &[
            &show_i,
            &sep1,
            &pin_i,
            &privacy_i,
            &mute_i,
            &sep2,
            &download_i,
            &reload_i,
            &sep3,
            &quit_i,
        ],
    )?;

    let icon = app.default_window_icon().cloned().ok_or("No default icon found")?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .icon_as_template(false)
        .tooltip("WhatsApp Desk")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            "pin" => {
                let _ = crate::commands::toggle_always_on_top(app.clone());
            }
            "privacy" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.eval("if (window.togglePrivacyMode) window.togglePrivacyMode();");
                }
            }
            "mute" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.eval("if (window.toggleMuteAudio) window.toggleMuteAudio();");
                }
            }
            "downloads" => {
                let _ = crate::commands::open_download_dir(app.clone());
            }
            "reload" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.eval("window.location.reload();");
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
