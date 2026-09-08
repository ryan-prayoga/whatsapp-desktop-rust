// WhatsApp Desktop Rust - Injected Runtime Script
(function() {
  'use strict';

  // --- 1. Detect Platform ---
  var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  var isWin = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
  var osPlatform = isWin ? 'Windows' : (isMac ? 'macOS' : 'Linux');
  var osArch = isMac ? 'arm' : 'x86';
  var chromeUA = isWin
    ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
    : (isMac
      ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');

  // --- 1b. Inject CSS Stylesheet ---
  function injectStyles() {
    if (document.getElementById('wa-desktop-rust-style')) return;
    var style = document.createElement('style');
    style.id = 'wa-desktop-rust-style';
    style.textContent = '' +
      '.privacy-mode #main .copyable-text, .privacy-mode #main img, .privacy-mode #main video, .privacy-mode #pane-side span[title] { filter: blur(8px) !important; transition: filter 0.15s ease-in-out; } ' +
      '.privacy-mode #main .copyable-text:hover, .privacy-mode #main img:hover, .privacy-mode #main video:hover, .privacy-mode #pane-side span[title]:hover { filter: none !important; } ' +
      'html, body, #app { width: 100% !important; height: 100% !important; min-width: 0 !important; overflow: hidden !important; -webkit-font-smoothing: antialiased; } ' +
      '#app > div, #app .two { width: 100% !important; height: 100% !important; min-width: 0 !important; max-width: 100% !important; top: 0 !important; margin: 0 !important; border-radius: 0 !important; } ' +
      '#pane-side, div[data-testid="chat-list"] { min-width: 200px !important; -webkit-overflow-scrolling: touch !important; } ' +
      '#main { min-width: 240px !important; -webkit-overflow-scrolling: touch !important; } ' +
      '#wa-hud-toast { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); background: rgba(32, 44, 51, 0.96); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #00a884; border: 1px solid rgba(0, 168, 132, 0.5); border-radius: 20px; padding: 9px 24px; font-size: 13px; font-weight: 600; z-index: 2147483647 !important; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.85); pointer-events: none; transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1); opacity: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; } ' +
      '@keyframes waFadeIn { from { opacity: 0; } to { opacity: 1; } } ' +
      '@keyframes waSlideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }';
    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        if (document.head) document.head.appendChild(style);
      });
    }
  }
  injectStyles();
  setInterval(injectStyles, 2500);

  // --- 2. User-Agent & Client Hints Spoofing ---
  try {
    Object.defineProperty(navigator, 'userAgent', { get: () => chromeUA });
    Object.defineProperty(navigator, 'appVersion', { get: () => chromeUA });
    Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
    if (!window.chrome) {
      window.chrome = { app: { isInstalled: false }, runtime: {} };
    }
    delete window.safari;

    if (!navigator.userAgentData) {
      Object.defineProperty(navigator, 'userAgentData', {
        get: () => ({
          brands: [
            { brand: 'Not(A:Brand', version: '99' },
            { brand: 'Google Chrome', version: '133' },
            { brand: 'Chromium', version: '133' }
          ],
          mobile: false,
          platform: osPlatform,
          getHighEntropyValues: function() {
            return Promise.resolve({
              architecture: osArch,
              bitness: '64',
              brands: [
                { brand: 'Not(A:Brand', version: '99' },
                { brand: 'Google Chrome', version: '133' },
                { brand: 'Chromium', version: '133' }
              ],
              mobile: false,
              model: '',
              platform: osPlatform,
              platformVersion: isWin ? '10.0.0' : '15.0.0',
              uaFullVersion: '133.0.0.0'
            });
          }
        })
      });
    }

    // PDF viewer emulation for WhatsApp Web PDF viewer
    Object.defineProperty(navigator, 'pdfViewerEnabled', { get: () => true, configurable: true });
  } catch (e) {
    console.warn('UA spoof warning:', e);
  }

  // --- 3. Floating HUD Toast ---
  function showFloatingToast(msg) {
    var toast = document.getElementById('wa-hud-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'wa-hud-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.zIndex = '2147483647';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(4px)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 2200);
  }
  window.showFloatingToast = showFloatingToast;

  // --- 4. Tauri IPC Helper ---
  function invokeBackend(cmd, args) {
    args = args || {};
    if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
      return window.__TAURI__.core.invoke(cmd, args);
    }
    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
      return window.__TAURI_INTERNALS__.invoke(cmd, args);
    }
    console.warn('[Tauri IPC fallback] No global Tauri found yet for command:', cmd);
    return Promise.resolve(null);
  }

  // --- 5. Native Notifications Polyfill ---
  (function() {
    function dispatchNativeNotification(title, options) {
      options = options || {};
      var body = options.body || '';
      invokeBackend('send_notification', { title: title || 'WhatsApp Desk', body: body });
    }

    window.Notification = function(title, options) {
      dispatchNativeNotification(title, options);
      this.title = title;
      this.body = (options && options.body) || '';
      this.onclick = null;
      this.onclose = null;
      this.onerror = null;
      this.onshow = null;
    };
    window.Notification.permission = 'granted';
    window.Notification.maxActions = 2;
    window.Notification.requestPermission = function(callback) {
      var p = Promise.resolve('granted');
      if (typeof callback === 'function') callback('granted');
      return p;
    };

    try {
      if (typeof ServiceWorkerRegistration !== 'undefined' && ServiceWorkerRegistration.prototype) {
        ServiceWorkerRegistration.prototype.showNotification = function(title, options) {
          dispatchNativeNotification(title, options);
          return Promise.resolve();
        };
      }
    } catch (e) {}
  })();

  // --- 6. Intercept External Links to Default Browser ---
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target !== document.body && target.tagName !== 'A') {
      target = target.parentElement;
    }
    if (target && target.tagName === 'A' && target.href) {
      try {
        var url = new URL(target.href);
        if (!url.hostname.endsWith('whatsapp.com') && !url.hostname.endsWith('whatsapp.net') && (url.protocol === 'http:' || url.protocol === 'https:')) {
          e.preventDefault();
          e.stopPropagation();
          invokeBackend('open_external_url', { url: target.href });
        }
      } catch (err) {}
    }
  }, true);

  // --- 7. Privacy Mode (Anti-Intip) ---
  (function() {
    var isPrivacyActive = false;
    window.togglePrivacyMode = function() {
      isPrivacyActive = !isPrivacyActive;
      if (isPrivacyActive) {
        document.body.classList.add('privacy-mode');
        showFloatingToast('🔒 Mode Privasi: Aktif');
      } else {
        document.body.classList.remove('privacy-mode');
        showFloatingToast('🔓 Mode Privasi: Nonaktif');
      }
      return isPrivacyActive;
    };
    window.isPrivacyModeActive = function() { return isPrivacyActive; };
  })();

  // --- 8. Always on Top ---
  (function() {
    var isPinned = false;
    window.toggleAlwaysOnTop = function() {
      return invokeBackend('toggle_always_on_top').then(function(state) {
        isPinned = (state !== null && state !== undefined) ? state : !isPinned;
        showFloatingToast(isPinned ? '📌 Always on Top: Aktif' : '📌 Always on Top: Nonaktif');
        return isPinned;
      });
    };
    window.isAlwaysOnTopActive = function() { return isPinned; };
  })();

  // --- 9. Mute Audio ---
  (function() {
    var isMuted = false;
    window.toggleMuteAudio = function() {
      isMuted = !isMuted;
      document.querySelectorAll('audio, video').forEach(function(el) {
        el.muted = isMuted;
      });
      showFloatingToast(isMuted ? '🔇 Audio Notifikasi: Dimatikan' : '🔊 Audio Notifikasi: Diaktifkan');
      return isMuted;
    };
    window.isAudioMuted = function() { return isMuted; };

    document.addEventListener('play', function(e) {
      if (isMuted && e.target && (e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO')) {
        e.target.muted = true;
      }
    }, true);
  })();

  // --- 10. Dock Unread Badge Counter ---
  (function() {
    var lastBadge = '';
    function checkTitle() {
      var title = document.title || '';
      var match = title.match(/\(([^)]+)\)/);
      var badge = match ? match[1] : '';
      if (badge !== lastBadge) {
        lastBadge = badge;
        invokeBackend('update_dock_badge', { count: badge });
      }
    }
    var titleEl = document.querySelector('title');
    if (titleEl) {
      new MutationObserver(checkTitle).observe(titleEl, { childList: true, characterData: true, subtree: true });
    } else {
      setInterval(checkTitle, 2500);
    }
  })();

  // --- 11. Intercept Blob / PDF Media Downloads ---
  (function() {
    var lastDocName = 'dokumen.pdf';

    document.addEventListener('click', function(e) {
      var el = e.target;
      while (el && el !== document.body) {
        var title = el.getAttribute('title') || '';
        var match = title.match(/([a-zA-Z0-9_\-\.\s\(\)]+\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf|zip|png|jpg))/i);
        if (match && match[1]) {
          lastDocName = match[1].trim();
          break;
        }
        var text = el.innerText || '';
        var m2 = text.match(/([a-zA-Z0-9_\-\.\s\(\)]+\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf|zip|png|jpg))/i);
        if (m2 && m2[1]) {
          lastDocName = m2[1].trim();
          break;
        }
        el = el.parentElement;
      }
    }, true);

    function captureDownload(href, filename) {
      if (!filename) filename = lastDocName || 'whatsapp_download';
      showFloatingToast('⏳ Menyimpan berkas: ' + filename + '...');
      fetch(href)
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
          var reader = new FileReader();
          reader.onloadend = function() {
            var b64 = reader.result;
            invokeBackend('save_downloaded_file', { filename: filename, dataUri: b64 }).then(function(savedPath) {
              if (savedPath) {
                showFloatingToast('💾 Berhasil disimpan: ' + filename);
              }
            }).catch(function(err) {
              showFloatingToast('❌ Gagal menyimpan berkas.');
            });
          };
          reader.readAsDataURL(blob);
        })
        .catch(function(err) {
          console.error('Download capture error:', err);
        });
    }

    var origAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function() {
      var dl = this.getAttribute('download');
      var href = this.href || this.getAttribute('href');
      if ((dl !== null || this.download) && href && (href.indexOf('blob:') === 0 || href.indexOf('data:') === 0)) {
        var name = dl || this.download || lastDocName;
        captureDownload(href, name);
        return;
      }
      return origAnchorClick.apply(this, arguments);
    };

    var origCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(blob) {
      var url = origCreateObjectURL.apply(this, arguments);
      if (blob && (blob.type === 'application/pdf' || (blob.type && blob.type.indexOf('pdf') >= 0))) {
        var name = lastDocName.toLowerCase().endsWith('.pdf') ? lastDocName : (lastDocName + '.pdf');
        captureDownload(url, name);
      }
      return url;
    };
  })();

  // --- 12. Global Keyboard Shortcuts ---
  window.addEventListener('keydown', function(e) {
    var mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.shiftKey) {
      var k = e.key.toUpperCase();
      if (k === 'P') {
        e.preventDefault();
        window.togglePrivacyMode();
      } else if (k === 'T') {
        e.preventDefault();
        window.toggleAlwaysOnTop();
      } else if (k === 'M') {
        e.preventDefault();
        window.toggleMuteAudio();
      } else if (k === 'D') {
        e.preventDefault();
        invokeBackend('open_download_dir');
        showFloatingToast('📁 Membuka folder unduhan...');
      } else if (k === 'R') {
        e.preventDefault();
        showFloatingToast('⚡ Membersihkan cache & reload...');
        window.location.href = window.location.origin + window.location.pathname + '?_t=' + Date.now();
      }
    } else if (mod && (e.key === ',' || e.key === '<')) {
      e.preventDefault();
      window.showSettingsModal();
    } else if (mod && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      document.body.style.zoom = Math.min((parseFloat(document.body.style.zoom || 1)) + 0.1, 2.0);
    } else if (mod && e.key === '-') {
      e.preventDefault();
      document.body.style.zoom = Math.max((parseFloat(document.body.style.zoom || 1)) - 0.1, 0.6);
    } else if (mod && e.key === '0') {
      e.preventDefault();
      document.body.style.zoom = 1.0;
    } else if (e.key === 'F5' || (mod && (e.key === 'r' || e.key === 'R') && !e.shiftKey)) {
      e.preventDefault();
      showFloatingToast('🔄 Memuat ulang percakapan...');
      setTimeout(function() { window.location.reload(); }, 200);
    }
  });

  // --- 13. Settings / Control Center Modal ---
  window.showSettingsModal = function() {
    var existing = document.getElementById('wa-rust-settings-overlay');
    if (existing) {
      if (existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'wa-rust-settings-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#e9edef;animation:waFadeIn 0.2s ease;';

    var modal = document.createElement('div');
    modal.style.cssText = 'width:530px;max-width:96vw;background:#111b21;border:1px solid #2a3942;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.85);padding:22px;display:flex;flex-direction:column;gap:14px;';

    modal.innerHTML = '' +
      '<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a3942;padding-bottom:12px;">' +
      '  <div style="display:flex;align-items:center;gap:10px;">' +
      '    <div style="width:34px;height:34px;border-radius:8px;background:rgba(0,168,132,0.15);display:flex;align-items:center;justify-content:center;color:#00a884;font-size:18px;">⚡</div>' +
      '    <div>' +
      '      <h3 style="margin:0;font-size:15px;font-weight:600;color:#e9edef;">WhatsApp Desk (Rust + Tauri v2)</h3>' +
      '      <span style="font-size:11px;color:#8696a0;">Ultra-lightweight • Zero-GC Native Engine</span>' +
      '    </div>' +
      '  </div>' +
      '  <button id="wa-btn-close-settings" style="background:transparent;border:none;color:#8696a0;cursor:pointer;font-size:18px;">✕</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
      '  <div style="background:#202c33;padding:12px;border-radius:8px;border:1px solid #2a3942;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">' +
      '    <div>' +
      '      <div style="display:flex;align-items:center;justify-content:space-between;">' +
      '        <strong style="font-size:12.5px;">🔒 Mode Privasi</strong>' +
      '        <span id="badge-priv" style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;background:rgba(255,255,255,0.08);color:#8696a0;">Nonaktif</span>' +
      '      </div>' +
      '      <div style="font-size:11px;color:#8696a0;margin-top:2px;">Blur pesan & media.</div>' +
      '    </div>' +
      '    <button id="btn-toggle-priv" style="background:#111b21;border:1px solid #2a3942;color:#00a884;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Aktifkan (' + (isMac ? 'Cmd' : 'Ctrl') + '+Shift+P)</button>' +
      '  </div>' +
      '  <div style="background:#202c33;padding:12px;border-radius:8px;border:1px solid #2a3942;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">' +
      '    <div>' +
      '      <div style="display:flex;align-items:center;justify-content:space-between;">' +
      '        <strong style="font-size:12.5px;">📌 Pin Jendela</strong>' +
      '        <span id="badge-pin" style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;background:rgba(255,255,255,0.08);color:#8696a0;">Nonaktif</span>' +
      '      </div>' +
      '      <div style="font-size:11px;color:#8696a0;margin-top:2px;">Selalu di barisan depan.</div>' +
      '    </div>' +
      '    <button id="btn-toggle-pin" style="background:#111b21;border:1px solid #2a3942;color:#00a884;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Pin (' + (isMac ? 'Cmd' : 'Ctrl') + '+Shift+T)</button>' +
      '  </div>' +
      '  <div style="background:#202c33;padding:12px;border-radius:8px;border:1px solid #2a3942;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">' +
      '    <div>' +
      '      <div style="display:flex;align-items:center;justify-content:space-between;">' +
      '        <strong style="font-size:12.5px;">🔇 Audio Notifikasi</strong>' +
      '        <span id="badge-mute" style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;background:rgba(0,168,132,0.15);color:#00a884;">Bersuara</span>' +
      '      </div>' +
      '      <div style="font-size:11px;color:#8696a0;margin-top:2px;">Senyapkan semua suara.</div>' +
      '    </div>' +
      '    <button id="btn-toggle-mute" style="background:#111b21;border:1px solid #2a3942;color:#00a884;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Senyapkan (' + (isMac ? 'Cmd' : 'Ctrl') + '+Shift+M)</button>' +
      '  </div>' +
      '  <div style="background:#202c33;padding:12px;border-radius:8px;border:1px solid #2a3942;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">' +
      '    <div>' +
      '      <strong style="font-size:12.5px;">📁 Folder Unduhan</strong>' +
      '      <div style="font-size:11px;color:#8696a0;margin-top:2px;">Buka berkas tersimpan.</div>' +
      '    </div>' +
      '    <button id="btn-open-folder" style="background:#00a884;border:none;color:#111b21;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">' + (isMac ? 'Buka di Finder' : 'Buka Folder') + '</button>' +
      '  </div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;margin-top:4px;">' +
      '  <button id="wa-btn-done" style="background:#202c33;border:1px solid #2a3942;color:#e9edef;padding:6px 18px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Selesai</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function updateModalUI() {
      var isPriv = window.isPrivacyModeActive ? window.isPrivacyModeActive() : false;
      var isPin = window.isAlwaysOnTopActive ? window.isAlwaysOnTopActive() : false;
      var isMute = window.isAudioMuted ? window.isAudioMuted() : false;

      var bPriv = document.getElementById('badge-priv');
      var btnPriv = document.getElementById('btn-toggle-priv');
      if (bPriv && btnPriv) {
        bPriv.textContent = isPriv ? 'Aktif' : 'Nonaktif';
        bPriv.style.background = isPriv ? 'rgba(0,168,132,0.15)' : 'rgba(255,255,255,0.08)';
        bPriv.style.color = isPriv ? '#00a884' : '#8696a0';
        btnPriv.textContent = isPriv ? 'Matikan' : 'Aktifkan (' + (isMac ? 'Cmd' : 'Ctrl') + '+Shift+P)';
      }

      var bPin = document.getElementById('badge-pin');
      var btnPin = document.getElementById('btn-toggle-pin');
      if (bPin && btnPin) {
        bPin.textContent = isPin ? 'Aktif' : 'Nonaktif';
        bPin.style.background = isPin ? 'rgba(0,168,132,0.15)' : 'rgba(255,255,255,0.08)';
        bPin.style.color = isPin ? '#00a884' : '#8696a0';
        btnPin.textContent = isPin ? 'Lepas Pin' : 'Pin (' + (isMac ? 'Cmd' : 'Ctrl') + '+Shift+T)';
      }

      var bMute = document.getElementById('badge-mute');
      var btnMute = document.getElementById('btn-toggle-mute');
      if (bMute && btnMute) {
        bMute.textContent = isMute ? 'Senyap' : 'Bersuara';
        bMute.style.background = isMute ? 'rgba(234,0,56,0.15)' : 'rgba(0,168,132,0.15)';
        bMute.style.color = isMute ? '#ff5252' : '#00a884';
        btnMute.textContent = isMute ? 'Bunyikan' : 'Senyapkan (' + (isMac ? 'Cmd' : 'Ctrl') + '+Shift+M)';
      }
    }
    updateModalUI();

    function closeModal() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    document.getElementById('wa-btn-close-settings').onclick = closeModal;
    document.getElementById('wa-btn-done').onclick = closeModal;
    overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };

    document.getElementById('btn-toggle-priv').onclick = function() {
      window.togglePrivacyMode();
      updateModalUI();
    };
    document.getElementById('btn-toggle-pin').onclick = function() {
      window.toggleAlwaysOnTop().then(updateModalUI);
    };
    document.getElementById('btn-toggle-mute').onclick = function() {
      window.toggleMuteAudio();
      updateModalUI();
    };
    document.getElementById('btn-open-folder').onclick = function() {
      invokeBackend('open_download_dir');
      closeModal();
    };
  };

  // --- 14. Inject Settings Button into WhatsApp Header ---
  function injectHeaderButton() {
    if (document.getElementById('wa-rust-toolbar-btn')) return;
    var header = document.querySelector('#side header') || document.querySelector('header');
    if (!header) return;
    var wrap = header.querySelector('div:last-child') || header.querySelector('span:last-child') || header;
    if (!wrap) return;

    var btn = document.createElement('button');
    btn.id = 'wa-rust-toolbar-btn';
    btn.title = 'Pengaturan & Kontrol (' + (isMac ? 'Cmd' : 'Ctrl') + ' + ,)';
    btn.style.cssText = 'width:38px;height:38px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;color:#aebac1;cursor:pointer;margin:0 2px;transition:all 0.15s ease;';
    btn.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
    btn.onclick = function(e) {
      e.stopPropagation();
      window.showSettingsModal();
    };
    wrap.appendChild(btn);
  }

  setInterval(injectHeaderButton, 2000);
  document.addEventListener('DOMContentLoaded', injectHeaderButton);
  window.addEventListener('load', injectHeaderButton);

  console.log('✅ WhatsApp Desk (Rust + Tauri v2) Runtime Initialized.');
})();
