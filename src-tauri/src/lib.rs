mod commands;
mod tray;

use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // 1. Plugins
    builder = builder
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init());

    // 2. Invoke Handlers
    builder = builder.invoke_handler(tauri::generate_handler![
        commands::send_notification,
        commands::toggle_always_on_top,
        commands::open_download_dir,
        commands::open_external_url,
        commands::update_dock_badge,
        commands::save_downloaded_file,
        commands::get_download_dir,
        commands::set_download_dir,
        commands::reset_download_dir,
        commands::pick_download_dir,
        commands::get_autostart_status,
        commands::toggle_autostart,
        commands::download_and_install_update,
    ]);

    // 3. Setup & App Lifecycle
    builder
        .setup(|app| {
            // Setup System Tray
            if let Err(e) = tray::create_tray(app.handle()) {
                eprintln!("Failed to create system tray: {}", e);
            }

            // Create Main Window dynamically with injected runtime script
            let url: tauri::Url = "https://web.whatsapp.com".parse().expect("Valid URL");
            let user_agent = if cfg!(target_os = "windows") {
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
            } else if cfg!(target_os = "macos") {
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
            } else {
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
            };

            let win_builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::External(url),
            )
            .title("WhatsApp Desk")
            .inner_size(1100.0, 750.0)
            .min_inner_size(450.0, 320.0)
            .resizable(true)
            .user_agent(user_agent)
            .initialization_script(include_str!("../assets/injected.js"));


            let _window = win_builder.build()?;

            // macOS Menu Bar (Cut, Copy, Paste, Undo, Redo, Select All)
            #[cfg(target_os = "macos")]
            {
                use tauri::menu::{Menu, PredefinedMenuItem, Submenu};
                let handle = app.handle();
                let app_menu = Submenu::with_items(
                    handle,
                    "WhatsApp",
                    true,
                    &[
                        &PredefinedMenuItem::about(handle, Some("About WhatsApp Desk"), None)?,
                        &PredefinedMenuItem::separator(handle)?,
                        &PredefinedMenuItem::hide(handle, Some("Hide WhatsApp"))?,
                        &PredefinedMenuItem::hide_others(handle, Some("Hide Others"))?,
                        &PredefinedMenuItem::show_all(handle, Some("Show All"))?,
                        &PredefinedMenuItem::separator(handle)?,
                        &PredefinedMenuItem::quit(handle, Some("Quit WhatsApp Desk"))?,
                    ],
                )?;

                let edit_menu = Submenu::with_items(
                    handle,
                    "Edit",
                    true,
                    &[
                        &PredefinedMenuItem::undo(handle, None)?,
                        &PredefinedMenuItem::redo(handle, None)?,
                        &PredefinedMenuItem::separator(handle)?,
                        &PredefinedMenuItem::cut(handle, None)?,
                        &PredefinedMenuItem::copy(handle, None)?,
                        &PredefinedMenuItem::paste(handle, None)?,
                        &PredefinedMenuItem::select_all(handle, None)?,
                    ],
                )?;

                let window_menu = Submenu::with_items(
                    handle,
                    "Window",
                    true,
                    &[
                        &PredefinedMenuItem::minimize(handle, None)?,
                        &PredefinedMenuItem::fullscreen(handle, None)?,
                        &PredefinedMenuItem::close_window(handle, None)?,
                    ],
                )?;

                let menu = Menu::with_items(handle, &[&app_menu, &edit_menu, &window_menu])?;
                handle.set_menu(menu)?;
            }

            Ok(())
        })
        // 4. Window Events: Close-to-Hide behavior (Cmd+W or red button hides instead of quitting)
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                #[cfg(not(target_os = "linux"))]
                {
                    api.prevent_close();
                    if let Some(win) = window.get_webview_window(window.label()) {
                        let _ = win.eval("if (window.cleanMemoryCaches) window.cleanMemoryCaches();");
                    }
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
