fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new().commands(&[
                "send_notification",
                "toggle_always_on_top",
                "open_download_dir",
                "open_external_url",
                "update_dock_badge",
                "save_downloaded_file",
                "get_download_dir",
                "set_download_dir",
                "reset_download_dir",
                "pick_download_dir",
                "get_autostart_status",
                "toggle_autostart",
            ]),
        ),
    )
    .expect("failed to run tauri-build");
}

