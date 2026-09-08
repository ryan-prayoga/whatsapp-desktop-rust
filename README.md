# WhatsApp Desk (Rust Edition) 🦀⚡

Aplikasi Desktop WhatsApp yang **ultra-ringan, cepat, dan hemat memori** untuk **macOS**, **Windows**, dan **Linux**, dibangun menggunakan **Rust** dan **Tauri v2**.

Aplikasi ini memanfaatkan webview engine bawaan sistem operasi (Apple WebKit di macOS, Microsoft Edge WebView2 di Windows, dan WebKitGTK di Linux). Tanpa beban runtime Chromium + Node.js dari Electron, aplikasi ini memangkas konsumsi RAM hingga **~90%** dan memangkas ukuran instalasi dari ratusan megabyte menjadi hanya beberapa megabyte.

[![Download Latest Release](https://img.shields.io/github/v/release/ryan-prayoga/whatsapp-desktop-rust?label=Download%20v0.2.6&color=00a884)](https://github.com/ryan-prayoga/whatsapp-desktop-rust/releases/latest)

### 📥 Unduh Installer (Multi-Platform)

| Sistem Operasi | Berkas Installer | Tipe |
| :--- | :--- | :--- |
| **macOS** | [**WhatsApp.Desk_0.2.6_universal.dmg**](https://github.com/ryan-prayoga/whatsapp-desktop-rust/releases/latest/download/WhatsApp.Desk_0.2.6_universal.dmg) | Universal (Apple Silicon & Intel) |
| **macOS** | [**WhatsApp.Desk_0.2.6_aarch64.dmg**](https://github.com/ryan-prayoga/whatsapp-desktop-rust/releases/latest/download/WhatsApp.Desk_0.2.6_aarch64.dmg) | Apple Silicon (M1/M2/M3/M4) |
| **Windows** | [**WhatsApp.Desk_0.2.6_x64-setup.exe**](https://github.com/ryan-prayoga/whatsapp-desktop-rust/releases/latest/download/WhatsApp.Desk_0.2.6_x64-setup.exe) | Setup Installer (.exe) |
| **Windows** | [**WhatsApp.Desk_0.2.6_x64_en-US.msi**](https://github.com/ryan-prayoga/whatsapp-desktop-rust/releases/latest/download/WhatsApp.Desk_0.2.6_x64_en-US.msi) | Windows MSI Installer |
| **Linux** | [**WhatsApp.Desk_0.2.6_amd64.deb**](https://github.com/ryan-prayoga/whatsapp-desktop-rust/releases/latest/download/WhatsApp.Desk_0.2.6_amd64.deb) | Debian / Ubuntu / Mint (.deb) |
| **Linux** | [**WhatsApp.Desk_0.2.6_amd64.AppImage**](https://github.com/ryan-prayoga/whatsapp-desktop-rust/releases/latest/download/WhatsApp.Desk_0.2.6_amd64.AppImage) | Universal Portable (.AppImage) |
| **Linux** | [**WhatsApp.Desk-0.2.6-1.x86_64.rpm**](https://github.com/ryan-prayoga/whatsapp-desktop-rust/releases/latest/download/WhatsApp.Desk-0.2.6-1.x86_64.rpm) | Fedora / RHEL / openSUSE (.rpm) |

---

## 🚀 Perbandingan Sumber Daya

| Parameter | WhatsApp Desk (Rust) | WhatsApp Resmi (Electron) |
| :--- | :--- | :--- |
| **Ukuran Berkas** | **~3 – 5 MB** | 450 MB – 900 MB+ |
| **Konsumsi RAM Idle (RSS)** | **~18 – 30 MB** (Zero-GC Native) | 750 MB – 1.5 GB+ |
| **Engine Render** | Native OS (WebKit / WebView2 / WebKitGTK) | Bundled Chromium + Node.js |
| **Waktu Muat (Cold Start)** | **< 0.3 detik (Instan)** | 3 – 6 detik |
| **Enkripsi Obrolan** | End-to-End resmi WhatsApp (Signal Protocol) | End-to-End resmi WhatsApp (Signal Protocol) |
| **Arsitektur Backend** | Rust + Tauri v2 (Memory Safe & Modular) | Node.js Main Process |

---

## ✨ Fitur Utama

- **Zero Garbage Collector Overhead:** Dibangun dengan Rust tanpa runtime GC seperti Go/Node.js, memori tetap stabil dan tidak mengalami *latency spike*.
- **Sesi Login Persisten:** Kredensial dan sesi WhatsApp Web tersimpan rapi di direktori profil lokal pengguna.
- **Mode Privasi (Anti-Intip):** Tekan `Cmd/Ctrl + Shift + P` untuk menyamarkan (*blur*) pesan, gambar, dan nama kontak di tempat umum. Arahkan mouse ke pesan untuk membacanya.
- **Always on Top (Pin Window):** Tekan `Cmd/Ctrl + Shift + T` untuk menyematkan jendela agar selalu berada di posisi paling depan.
- **Mute Audio Seketika:** Tekan `Cmd/Ctrl + Shift + M` untuk mematikan/menyalakan semua audio notifikasi chat.
- **Penyimpanan Unduhan Chat Permanen:** Berkas, gambar, dan dokumen PDF otomatis dicegat dari blob terenkripsi dan disimpan ke folder `Downloads/WhatsApp Downloads` tanpa kendala stuck viewer.
- **Badge Unread di Dock (macOS):** Jumlah pesan belum dibaca otomatis tersinkronisasi pada icon aplikasi di Dock macOS.
- **Menu Bar & Tray Icon:** Menu bar native Cocoa di macOS (`Cmd+C`, `Cmd+V`, `Cmd+A`, `Cmd+Z`) dan System Tray terintegrasi di semua platform.
- **Pencegatan Link Eksternal:** Tautan tautan luar otomatis dibuka di browser default sistem tanpa mengganggu jendela WhatsApp.
- **Proteksi Single-Instance:** Mencegah aplikasi terbuka ganda. Membuka aplikasi lagi akan langsung memfokuskan jendela yang sudah aktif.
- **Auto-Start saat Booting:** Dukungan peluncuran otomatis saat komputer menyala lewat sistem LaunchAgent / Registry.

---

## ⌨️ Pintasan Keyboard (Keyboard Shortcuts)

| macOS | Windows / Linux | Fungsi |
| :--- | :--- | :--- |
| `Cmd + Shift + P` | `Ctrl + Shift + P` | Toggle Mode Privasi (blur obrolan & media) |
| `Cmd + Shift + T` | `Ctrl + Shift + T` | Toggle Always on Top (pin jendela ke paling depan) |
| `Cmd + Shift + M` | `Ctrl + Shift + M` | Toggle Mute seluruh suara notifikasi |
| `Cmd + Shift + D` | `Ctrl + Shift + D` | Buka folder penyimpanan unduhan chat |
| `Cmd + ,` | `Ctrl + ,` | Buka Pusat Kontrol / Pengaturan Cepat |
| `Cmd + R` / `F5` | `Ctrl + R` / `F5` | Reload percakapan WhatsApp |
| `Cmd + Shift + R` | `Ctrl + Shift + R` | Hard refresh (bersihkan cache antarmuka) |
| `Cmd + +` / `Cmd + =` | `Ctrl + +` | Zoom in tampilan |
| `Cmd + -` | `Ctrl + -` | Zoom out tampilan |
| `Cmd + 0` | `Ctrl + 0` | Reset zoom tampilan ke 100% |
| `Cmd + W` | `Alt + F4` | Menyembunyikan jendela (aplikasi tetap aktif di background) |
| `Cmd + Q` | Tray -> Keluar | Menutup aplikasi secara penuh |

---

## 🛠️ Pengembangan & Menjalankan Aplikasi Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18+) & [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/) (cargo & rustc 1.77.2+)

### Langkah Instalasi
```bash
# Clone repository
git clone https://github.com/ryan-prayoga/whatsapp-desktop-rust.git
cd whatsapp-desktop-rust

# Install dependensi
pnpm install

# Jalankan dalam mode pengembangan (Live Dev)
pnpm dev
```

### Membangun Biner Rilis (Build)
```bash
# Build biner berekstensi native (.dmg untuk macOS, .msi/.exe untuk Windows, .deb untuk Linux)
pnpm build
```
Hasil kompilasi akan berada di folder `src-tauri/target/release/bundle/`.

---

## 📄 Lisensi & Penafian (Disclaimer)

- **Lisensi:** Proyek ini dilisensikan di bawah [MIT License](LICENSE).
- **Penafian:** WhatsApp adalah merek dagang terdaftar dari Meta Platforms, Inc. Proyek ini adalah perangkat lunak independen pihak ketiga dan tidak berafiliasi, didukung, atau disponsori oleh Meta Platforms, Inc.
