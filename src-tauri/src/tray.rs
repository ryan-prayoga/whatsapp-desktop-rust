use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_i = MenuItem::with_id(app, "show", "Tampilkan WhatsApp", true, None::<&str>)?;
    let pin_i = MenuItem::with_id(app, "pin", "📌 Toggle Pin (Always on Top)", true, None::<&str>)?;
    let privacy_i = MenuItem::with_id(app, "privacy", "🔒 Toggle Mode Privasi", true, None::<&str>)?;
    let mute_i = MenuItem::with_id(app, "mute", "🔇 Toggle Senyapkan Audio", true, None::<&str>)?;
    let download_i = MenuItem::with_id(app, "downloads", "📁 Buka Folder Unduhan", true, None::<&str>)?;
    let reload_i = MenuItem::with_id(app, "reload", "🔄 Muat Ulang Chat", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Keluar dari WhatsApp Desk", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_i,
            &pin_i,
            &privacy_i,
            &mute_i,
            &download_i,
            &reload_i,
            &quit_i,
        ],
    )?;

    let icon = app.default_window_icon().cloned().ok_or("No default icon found")?;

    let _tray = TrayIconBuilder::new()
        .icon(icon)
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
                let _ = crate::commands::open_download_dir();
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
