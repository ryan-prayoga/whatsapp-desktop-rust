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
            ]),
        ),
    )
    .expect("failed to run tauri-build");
}

