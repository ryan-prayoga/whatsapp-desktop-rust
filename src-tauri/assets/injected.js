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
      '#wa-settings-container::-webkit-scrollbar, #wa-shortcuts-overlay div::-webkit-scrollbar { width: 6px; } ' +
      '#wa-settings-container::-webkit-scrollbar-thumb, #wa-shortcuts-overlay div::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.16); border-radius: 3px; } ' +
      '.wa-theme-btn, .wa-card-btn { transition: all 0.15s ease-in-out; } ' +
      '.wa-theme-btn:hover, .wa-card-btn:hover { filter: brightness(1.15); } ' +
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
        showFloatingToast('Mode Privasi: Aktif');
      } else {
        document.body.classList.remove('privacy-mode');
        showFloatingToast('Mode Privasi: Nonaktif');
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
        showFloatingToast(isPinned ? 'Always on Top: Aktif' : 'Always on Top: Nonaktif');
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
      showFloatingToast(isMuted ? 'Audio Notifikasi: Dimatikan' : 'Audio Notifikasi: Diaktifkan');
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
      showFloatingToast('Menyimpan berkas: ' + filename + '...');
      fetch(href)
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
          var reader = new FileReader();
          reader.onloadend = function() {
            var b64 = reader.result;
            invokeBackend('save_downloaded_file', { filename: filename, dataUri: b64 }).then(function(savedPath) {
              if (savedPath) {
                showFloatingToast('Berhasil disimpan: ' + filename);
              }
            }).catch(function(err) {
              showFloatingToast('Gagal menyimpan berkas.');
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

  // --- 12. Theme Management ---
  var currentTheme = localStorage.getItem('wa_desk_theme') || 'system';

  window.setAppTheme = function(mode) {
    currentTheme = mode;
    try { localStorage.setItem('wa_desk_theme', mode); } catch (e) {}

    var isDark = false;
    if (mode === 'system') {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = (mode === 'dark');
    }

    if (isDark) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      try { localStorage.setItem('theme', '"dark"'); } catch (e) {}
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      try { localStorage.setItem('theme', '"light"'); } catch (e) {}
    }

    if (window.syncModalTheme) {
      window.syncModalTheme(isDark);
    }
  };

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
      if (currentTheme === 'system') {
        window.setAppTheme('system');
      }
    });
  }
  setTimeout(function() {
    window.setAppTheme(currentTheme);
  }, 350);

  // --- 13. AutoStart & Download Directory IPC Helpers ---
  window.isAutoStartActive = false;
  window.checkAutoStartStatus = function() {
    return invokeBackend('get_autostart_status').then(function(active) {
      window.isAutoStartActive = !!active;
      return window.isAutoStartActive;
    }).catch(function(e) {
      console.warn('get_autostart_status error:', e);
      return false;
    });
  };

  window.toggleAutoStart = function() {
    return invokeBackend('toggle_autostart').then(function(newStatus) {
      window.isAutoStartActive = !!newStatus;
      showFloatingToast(window.isAutoStartActive ? 'Buka saat boot: Aktif' : 'Buka saat boot: Nonaktif');
      return window.isAutoStartActive;
    }).catch(function(err) {
      console.error('toggle_autostart error:', err);
      showFloatingToast('Gagal mengubah autostart');
      return window.isAutoStartActive;
    });
  };

  window.getDownloadDirNative = function() {
    return invokeBackend('get_download_dir').then(function(res) {
      return res || '';
    }).catch(function(e) {
      console.warn('get_download_dir error:', e);
      return '';
    });
  };

  window.chooseDownloadDirNative = function() {
    return invokeBackend('pick_download_dir').then(function(newDir) {
      if (newDir) {
        showFloatingToast('Folder unduhan berhasil diubah');
      }
      return newDir;
    }).catch(function(e) {
      console.error('pick_download_dir error:', e);
      showFloatingToast('Gagal memilih folder');
      return null;
    });
  };

  window.resetDownloadDirNative = function() {
    return invokeBackend('reset_download_dir').then(function(defDir) {
      showFloatingToast('Folder unduhan direset ke bawaan');
      return defDir;
    }).catch(function(e) {
      console.error('reset_download_dir error:', e);
      return '';
    });
  };

  // --- 14. SVG Icons Collection (No Emojis) ---
  var ICONS = {
    settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    moon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    monitor: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
    shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.77V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.77a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z"></path></svg>',
    speaker: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>',
    power: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>',
    folder: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    folderOpen: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
    folderEdit: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    update: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>',
    reload: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
    clean: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>',
    guide: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="10" y1="8" x2="10.01" y2="8"></line><line x1="14" y1="8" x2="14.01" y2="8"></line><line x1="18" y1="8" x2="18.01" y2="8"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="6" y1="16" x2="18" y2="16"></line></svg>',
    info: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
  };

  // --- 15. Global Keyboard Shortcuts ---
  window.addEventListener('keydown', function(e) {
    var mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.shiftKey) {
      var k = e.key.toUpperCase();
      if (k === 'P') {
        e.preventDefault();
        window.togglePrivacyMode();
        if (window.updateModalUI) window.updateModalUI();
      } else if (k === 'T') {
        e.preventDefault();
        window.toggleAlwaysOnTop().then(function() {
          if (window.updateModalUI) window.updateModalUI();
        });
      } else if (k === 'M') {
        e.preventDefault();
        window.toggleMuteAudio();
        if (window.updateModalUI) window.updateModalUI();
      } else if (k === 'S') {
        e.preventDefault();
        window.toggleAutoStart().then(function() {
          if (window.updateModalUI) window.updateModalUI();
        });
      } else if (k === 'D') {
        e.preventDefault();
        showFloatingToast('Membuka folder...');
        invokeBackend('open_download_dir')
          .then(function() {
            showFloatingToast('Folder unduhan terbuka');
          })
          .catch(function(err) {
            console.error('Buka folder error:', err);
            showFloatingToast('Gagal membuka folder: ' + err);
          });
      } else if (k === 'R') {
        e.preventDefault();
        showFloatingToast('Memuat ulang chat...');
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
      showFloatingToast('Memuat ulang percakapan...');
      setTimeout(function() { window.location.reload(); }, 200);
    }
  });

  // --- 16. Shortcuts Guide Modal ---
  window.showShortcutsGuideModal = function() {
    var ex = document.getElementById('wa-shortcuts-overlay');
    if (ex) {
      if (ex.parentNode) ex.parentNode.removeChild(ex);
      return;
    }

    var isDark = currentTheme === 'system'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : (currentTheme === 'dark');

    var overlay = document.createElement('div');
    overlay.id = 'wa-shortcuts-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:10000000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;animation:waFadeIn 0.18s ease;';

    var modal = document.createElement('div');
    var bg = isDark ? '#111b21' : '#ffffff';
    var border = isDark ? '#2a3942' : '#e9edef';
    var textPri = isDark ? '#e9edef' : '#111b21';
    var textMut = isDark ? '#8696a0' : '#667781';
    var cardBg = isDark ? '#202c33' : '#f0f2f5';
    var accent = isDark ? '#00a884' : '#008069';
    var kbdBg = isDark ? '#111b21' : '#e9edef';
    var modName = isMac ? 'Cmd' : 'Ctrl';

    modal.style.cssText = 'width:480px;max-width:96vw;background:' + bg + ';border:1px solid ' + border + ';border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:14px;box-shadow:0 24px 60px rgba(0,0,0,0.7);box-sizing:border-box;';

    var shortcuts = [
      { key: modName + ' + ,', desc: 'Buka Pengaturan & Kontrol Aplikasi' },
      { key: modName + ' + Shift + P', desc: 'Mode Privasi (Sensor pesan & media)' },
      { key: modName + ' + Shift + T', desc: 'Pin Jendela (Always on Top)' },
      { key: modName + ' + Shift + M', desc: 'Senyapkan Audio Notifikasi' },
      { key: modName + ' + Shift + S', desc: 'Toggle Buka saat Komputer Nyala' },
      { key: modName + ' + Shift + D', desc: 'Buka Folder Unduhan Berkas' },
      { key: modName + ' + R  /  F5', desc: 'Muat Ulang Tampilan Chat' },
      { key: modName + ' +  +  /  -', desc: 'Perbesar / Perkecil Ukuran Tampilan' },
      { key: modName + ' + 0', desc: 'Reset Ukuran Tampilan ke Bawaan' },
      { key: 'Esc', desc: 'Tutup Jendela Dialog & Pengaturan' }
    ];

    var listHtml = shortcuts.map(function(s) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:' + cardBg + ';border:1px solid ' + border + ';border-radius:6px;gap:12px;">' +
        '<span style="font-size:12px;color:' + textPri + ';">' + s.desc + '</span>' +
        '<kbd style="font-family:monospace;font-size:11px;font-weight:600;padding:2px 8px;background:' + kbdBg + ';border:1px solid ' + border + ';border-radius:4px;color:' + accent + ';white-space:nowrap;">' + s.key + '</kbd>' +
        '</div>';
    }).join('');

    modal.innerHTML = '' +
      '<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ' + border + ';padding-bottom:12px;">' +
      '  <div style="display:flex;align-items:center;gap:10px;">' +
      '    <div style="width:30px;height:30px;border-radius:6px;background:rgba(0,168,132,0.15);display:flex;align-items:center;justify-content:center;color:' + accent + ';">' +
      '      ' + ICONS.guide +
      '    </div>' +
      '    <div>' +
      '      <h3 style="margin:0;font-size:14.5px;font-weight:600;color:' + textPri + ';">Panduan Pintasan Papan Ketik</h3>' +
      '      <span style="font-size:11px;color:' + textMut + ';">Akses cepat fitur WhatsApp Desk</span>' +
      '    </div>' +
      '  </div>' +
      '  <button id="wa-shortcuts-close-x" style="background:transparent;border:none;color:' + textMut + ';cursor:pointer;padding:4px;border-radius:4px;display:flex;">' + ICONS.close + '</button>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow-y:auto;padding-right:2px;">' +
      listHtml +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;border-top:1px solid ' + border + ';padding-top:12px;">' +
      '  <button id="wa-shortcuts-close-btn" style="background:' + accent + ';border:none;color:' + (isDark ? '#111b21' : '#ffffff') + ';padding:6px 18px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Tutup</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function closeShortcuts() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    document.getElementById('wa-shortcuts-close-x').onclick = closeShortcuts;
    document.getElementById('wa-shortcuts-close-btn').onclick = closeShortcuts;
    overlay.onclick = function(e) { if (e.target === overlay) closeShortcuts(); };
  };

  // --- 17. Settings / Control Center Modal (Clean & Modern, Zero Emojis) ---
  window.showSettingsModal = function() {
    var existing = document.getElementById('wa-settings-overlay');
    if (existing) {
      if (existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }

    var modName = isMac ? 'Cmd' : 'Ctrl';

    var overlay = document.createElement('div');
    overlay.id = 'wa-settings-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.68);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;animation:waFadeIn 0.18s ease;';

    var modal = document.createElement('div');
    modal.id = 'wa-settings-container';
    modal.style.cssText = 'width:520px;max-width:96vw;max-height:92vh;border-radius:12px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;overflow-y:auto;padding:18px 20px;box-shadow:0 24px 60px rgba(0,0,0,0.75);';

    modal.innerHTML = '' +
      // Header
      '<div id="wa-modal-header" style="display:flex;align-items:center;justify-content:space-between;border-bottom-width:1px;border-bottom-style:solid;padding-bottom:12px;">' +
      '  <div style="display:flex;align-items:center;gap:10px;">' +
      '    <div id="wa-modal-icon-wrap" style="width:34px;height:34px;border-radius:8px;background:rgba(0,168,132,0.15);display:flex;align-items:center;justify-content:center;color:#00a884;">' +
      '      ' + ICONS.settings +
      '    </div>' +
      '    <div>' +
      '      <h3 id="wa-modal-title" style="margin:0;font-size:15px;font-weight:600;">WhatsApp Desk</h3>' +
      '      <span id="wa-modal-sub" style="font-size:11px;">Klien Ringan Cepat · Versi 0.2.0</span>' +
      '    </div>' +
      '  </div>' +
      '  <button id="wa-settings-close-x" style="background:transparent;border:none;cursor:pointer;padding:6px;border-radius:4px;display:flex;align-items:center;justify-content:center;">' + ICONS.close + '</button>' +
      '</div>' +

      // Section 1: Tema Tampilan
      '<div class="wa-modal-card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;border-width:1px;border-style:solid;gap:12px;">' +
      '  <div>' +
      '    <strong class="wa-text-primary" style="font-size:12.5px;display:block;">Tema Tampilan WhatsApp</strong>' +
      '    <span class="wa-text-muted" style="font-size:11px;">Pilih mode gelap, terang, atau ikuti sistem</span>' +
      '  </div>' +
      '  <div style="display:flex;align-items:center;gap:4px;">' +
      '    <button id="wa-theme-btn-dark" class="wa-theme-btn" style="display:flex;align-items:center;gap:5px;padding:5px 9px;border-radius:6px;font-size:11.5px;cursor:pointer;border-width:1px;border-style:solid;font-weight:500;">' + ICONS.moon + ' Gelap</button>' +
      '    <button id="wa-theme-btn-light" class="wa-theme-btn" style="display:flex;align-items:center;gap:5px;padding:5px 9px;border-radius:6px;font-size:11.5px;cursor:pointer;border-width:1px;border-style:solid;font-weight:500;">' + ICONS.sun + ' Terang</button>' +
      '    <button id="wa-theme-btn-system" class="wa-theme-btn" style="display:flex;align-items:center;gap:5px;padding:5px 9px;border-radius:6px;font-size:11.5px;cursor:pointer;border-width:1px;border-style:solid;font-weight:500;">' + ICONS.monitor + ' Auto</button>' +
      '  </div>' +
      '</div>' +

      // Section 2: 4 Quick Control Cards (2x2 Grid)
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;">' +
      // Card 1: Mode Privasi
      '  <div class="wa-modal-card" style="padding:10px 12px;border-radius:8px;border-width:1px;border-style:solid;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">' +
      '    <div>' +
      '      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
      '        <div style="display:flex;align-items:center;gap:6px;"><span class="wa-icon-accent">' + ICONS.shield + '</span><strong class="wa-text-primary" style="font-size:12.5px;">Mode Privasi</strong></div>' +
      '        <span id="wa-badge-priv" style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;">...</span>' +
      '      </div>' +
      '      <div class="wa-text-muted" style="font-size:11px;margin-top:4px;">Sensor chat & media saat kursor menjauh.</div>' +
      '    </div>' +
      '    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px;">' +
      '      <span class="wa-text-muted" style="font-size:10px;font-family:monospace;">' + modName + '+Shift+P</span>' +
      '      <button id="wa-action-toggle-priv" class="wa-card-btn" style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border-width:1px;border-style:solid;">Toggle</button>' +
      '    </div>' +
      '  </div>' +

      // Card 2: Pin Jendela
      '  <div class="wa-modal-card" style="padding:10px 12px;border-radius:8px;border-width:1px;border-style:solid;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">' +
      '    <div>' +
      '      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
      '        <div style="display:flex;align-items:center;gap:6px;"><span class="wa-icon-accent">' + ICONS.pin + '</span><strong class="wa-text-primary" style="font-size:12.5px;">Pin Jendela</strong></div>' +
      '        <span id="wa-badge-pin" style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;">...</span>' +
      '      </div>' +
      '      <div class="wa-text-muted" style="font-size:11px;margin-top:4px;">Jendela selalu di depan aplikasi lain.</div>' +
      '    </div>' +
      '    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px;">' +
      '      <span class="wa-text-muted" style="font-size:10px;font-family:monospace;">' + modName + '+Shift+T</span>' +
      '      <button id="wa-action-toggle-pin" class="wa-card-btn" style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border-width:1px;border-style:solid;">Toggle</button>' +
      '    </div>' +
      '  </div>' +

      // Card 3: Notifikasi Suara
      '  <div class="wa-modal-card" style="padding:10px 12px;border-radius:8px;border-width:1px;border-style:solid;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">' +
      '    <div>' +
      '      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
      '        <div style="display:flex;align-items:center;gap:6px;"><span class="wa-icon-accent">' + ICONS.speaker + '</span><strong class="wa-text-primary" style="font-size:12.5px;">Notifikasi Suara</strong></div>' +
      '        <span id="wa-badge-mute" style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;">...</span>' +
      '      </div>' +
      '      <div class="wa-text-muted" style="font-size:11px;margin-top:4px;">Senyapkan seluruh audio notifikasi.</div>' +
      '    </div>' +
      '    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px;">' +
      '      <span class="wa-text-muted" style="font-size:10px;font-family:monospace;">' + modName + '+Shift+M</span>' +
      '      <button id="wa-action-toggle-mute" class="wa-card-btn" style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border-width:1px;border-style:solid;">Toggle</button>' +
      '    </div>' +
      '  </div>' +

      // Card 4: Buka saat Boot
      '  <div class="wa-modal-card" style="padding:10px 12px;border-radius:8px;border-width:1px;border-style:solid;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">' +
      '    <div>' +
      '      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
      '        <div style="display:flex;align-items:center;gap:6px;"><span class="wa-icon-accent">' + ICONS.power + '</span><strong class="wa-text-primary" style="font-size:12.5px;">Buka saat Boot</strong></div>' +
      '        <span id="wa-badge-auto" style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;">...</span>' +
      '      </div>' +
      '      <div class="wa-text-muted" style="font-size:11px;margin-top:4px;">Mulai WhatsApp otomatis saat komputer nyala.</div>' +
      '    </div>' +
      '    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px;">' +
      '      <span class="wa-text-muted" style="font-size:10px;font-family:monospace;">' + modName + '+Shift+S</span>' +
      '      <button id="wa-action-toggle-auto" class="wa-card-btn" style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border-width:1px;border-style:solid;">Toggle</button>' +
      '    </div>' +
      '  </div>' +
      '</div>' +

      // Section 3: Folder Simpan Unduhan Chat
      '<div class="wa-modal-card" style="display:flex;flex-direction:column;gap:8px;border-radius:8px;border-width:1px;border-style:solid;padding:12px;">' +
      '  <div style="display:flex;align-items:center;justify-content:space-between;">' +
      '    <div style="display:flex;align-items:center;gap:6px;">' +
      '      <span class="wa-icon-accent">' + ICONS.folder + '</span>' +
      '      <strong class="wa-text-primary" style="font-size:12.5px;">Folder Simpan Unduhan Chat</strong>' +
      '    </div>' +
      '    <button id="wa-btn-reset-folder" style="background:transparent;border:none;color:#00a884;font-size:11px;font-weight:600;cursor:pointer;padding:2px 4px;">Reset Default</button>' +
      '  </div>' +
      '  <div class="wa-text-muted" style="font-size:11px;">Berkas & media yang diunduh dari chat otomatis tersimpan permanen di sini:</div>' +
      '  <div id="wa-folder-box" style="display:flex;align-items:center;border-width:1px;border-style:solid;border-radius:6px;padding:6px 10px;min-width:0;">' +
      '    <span id="wa-folder-path" style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;font-family:monospace;">Memuat direktori...</span>' +
      '  </div>' +
      '  <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">' +
      '    <button id="wa-btn-change-folder" class="wa-card-btn" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 10px;border-radius:6px;font-size:11.5px;font-weight:500;cursor:pointer;border-width:1px;border-style:solid;">' + ICONS.folderEdit + ' Ubah Lokasi Folder...</button>' +
      '    <button id="wa-btn-open-folder" style="background:#00a884;color:#111b21;border:none;display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 14px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;">' + ICONS.folderOpen + ' ' + (isMac ? 'Buka di Finder' : 'Buka Folder') + '</button>' +
      '  </div>' +
      '</div>' +

      // Section 4: Tindakan Cepat & Pemeliharaan
      '<div class="wa-modal-card" style="display:flex;flex-direction:column;gap:8px;border-radius:8px;border-width:1px;border-style:solid;padding:12px;">' +
      '  <strong class="wa-text-primary" style="font-size:12px;">Tindakan Cepat & Pemeliharaan:</strong>' +
      '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
      '    <button id="wa-btn-check-updates" class="wa-card-btn" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 8px;border-radius:6px;font-size:11.5px;font-weight:500;cursor:pointer;border-width:1px;border-style:solid;">' + ICONS.update + ' Periksa Update</button>' +
      '    <button id="wa-btn-reload-chat" class="wa-card-btn" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 8px;border-radius:6px;font-size:11.5px;font-weight:500;cursor:pointer;border-width:1px;border-style:solid;">' + ICONS.reload + ' Muat Ulang Chat</button>' +
      '    <button id="wa-btn-hard-refresh" class="wa-card-btn" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 8px;border-radius:6px;font-size:11.5px;font-weight:500;cursor:pointer;border-width:1px;border-style:solid;">' + ICONS.clean + ' Bersihkan Cache</button>' +
      '    <button id="wa-btn-guide-modal" class="wa-card-btn" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 8px;border-radius:6px;font-size:11.5px;font-weight:500;cursor:pointer;border-width:1px;border-style:solid;">' + ICONS.guide + ' Panduan Singkat</button>' +
      '  </div>' +
      '</div>' +

      // Disclaimer
      '<div style="display:flex;align-items:center;gap:8px;padding-top:2px;">' +
      '  <span class="wa-text-muted" style="display:flex;flex-shrink:0;">' + ICONS.info + '</span>' +
      '  <span class="wa-text-muted" style="font-size:10.5px;line-height:1.4;">WhatsApp Desk adalah aplikasi independen berbasis Rust & Tauri. Ringan, cepat & hemat memori. Bukan aplikasi resmi Meta Platforms, Inc.</span>' +
      '</div>' +

      // Footer
      '<div style="display:flex;justify-content:space-between;align-items:center;border-top-width:1px;border-top-style:solid;padding-top:10px;margin-top:2px;" id="wa-modal-footer">' +
      '  <span class="wa-text-muted" style="font-size:11px;">Tekan <kbd style="padding:1px 4px;border-radius:4px;font-family:monospace;border:1px solid rgba(255,255,255,0.12);">Esc</kbd> untuk menutup</span>' +
      '  <button id="wa-btn-done" style="padding:6px 20px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border-width:1px;border-style:solid;">Selesai</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function closeSettings() {
      window.removeEventListener('keydown', onKeyClose);
      window.syncModalTheme = null;
      window.updateModalUI = null;
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    function onKeyClose(e) {
      if (e.key === 'Escape') closeSettings();
    }
    window.addEventListener('keydown', onKeyClose);

    document.getElementById('wa-settings-close-x').onclick = closeSettings;
    document.getElementById('wa-btn-done').onclick = closeSettings;
    overlay.onclick = function(e) { if (e.target === overlay) closeSettings(); };

    // --- Dynamic Modal Theme Synchronizer ---
    window.syncModalTheme = function(isThemeDark) {
      var bg = isThemeDark ? '#111b21' : '#ffffff';
      var cardBg = isThemeDark ? '#202c33' : '#f0f2f5';
      var border = isThemeDark ? '#2a3942' : '#e9edef';
      var textPri = isThemeDark ? '#e9edef' : '#111b21';
      var textMut = isThemeDark ? '#8696a0' : '#667781';
      var accent = isThemeDark ? '#00a884' : '#008069';
      var inputBg = isThemeDark ? '#111b21' : '#ffffff';

      modal.style.background = bg;
      modal.style.border = '1px solid ' + border;
      document.getElementById('wa-modal-header').style.borderBottomColor = border;
      document.getElementById('wa-modal-footer').style.borderTopColor = border;

      document.getElementById('wa-modal-title').style.color = textPri;
      document.getElementById('wa-modal-sub').style.color = textMut;
      document.getElementById('wa-modal-icon-wrap').style.color = accent;
      document.getElementById('wa-settings-close-x').style.color = textMut;

      modal.querySelectorAll('.wa-modal-card').forEach(function(el) {
        el.style.background = cardBg;
        el.style.borderColor = border;
      });
      modal.querySelectorAll('.wa-text-primary').forEach(function(el) {
        el.style.color = textPri;
      });
      modal.querySelectorAll('.wa-text-muted').forEach(function(el) {
        el.style.color = textMut;
      });
      modal.querySelectorAll('.wa-icon-accent').forEach(function(el) {
        el.style.color = accent;
      });

      var fBox = document.getElementById('wa-folder-box');
      if (fBox) {
        fBox.style.background = inputBg;
        fBox.style.borderColor = border;
      }
      var fPath = document.getElementById('wa-folder-path');
      if (fPath) fPath.style.color = textPri;

      var btnOpen = document.getElementById('wa-btn-open-folder');
      if (btnOpen) {
        btnOpen.style.background = accent;
        btnOpen.style.color = isThemeDark ? '#111b21' : '#ffffff';
      }

      var resetBtn = document.getElementById('wa-btn-reset-folder');
      if (resetBtn) resetBtn.style.color = accent;

      modal.querySelectorAll('.wa-card-btn').forEach(function(el) {
        el.style.background = isThemeDark ? '#111b21' : '#ffffff';
        el.style.borderColor = border;
        el.style.color = textPri;
      });

      var btnDone = document.getElementById('wa-btn-done');
      if (btnDone) {
        btnDone.style.background = isThemeDark ? '#202c33' : '#e9edef';
        btnDone.style.borderColor = border;
        btnDone.style.color = textPri;
      }

      // Theme segmented control states
      ['dark', 'light', 'system'].forEach(function(mode) {
        var tBtn = document.getElementById('wa-theme-btn-' + mode);
        if (tBtn) {
          var active = (currentTheme === mode);
          tBtn.style.background = active ? accent : (isThemeDark ? '#111b21' : '#ffffff');
          tBtn.style.color = active ? (isThemeDark ? '#111b21' : '#ffffff') : textPri;
          tBtn.style.borderColor = active ? accent : border;
        }
      });
    };

    // --- Synchronize Modal UI States (Badges & Buttons) ---
    window.updateModalUI = function() {
      var isThemeDark = currentTheme === 'system'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        : (currentTheme === 'dark');
      var accent = isThemeDark ? '#00a884' : '#008069';

      var privActive = window.isPrivacyModeActive ? window.isPrivacyModeActive() : false;
      var badgePriv = document.getElementById('wa-badge-priv');
      var btnPriv = document.getElementById('wa-action-toggle-priv');
      if (badgePriv && btnPriv) {
        badgePriv.textContent = privActive ? 'Aktif' : 'Nonaktif';
        badgePriv.style.background = privActive ? (isThemeDark ? 'rgba(0,168,132,0.15)' : 'rgba(0,128,105,0.15)') : 'rgba(255,255,255,0.06)';
        badgePriv.style.color = privActive ? accent : '#8696a0';
        btnPriv.textContent = privActive ? 'Matikan' : 'Aktifkan';
      }

      var pinActive = window.isAlwaysOnTopActive ? window.isAlwaysOnTopActive() : false;
      var badgePin = document.getElementById('wa-badge-pin');
      var btnPin = document.getElementById('wa-action-toggle-pin');
      if (badgePin && btnPin) {
        badgePin.textContent = pinActive ? 'Aktif' : 'Nonaktif';
        badgePin.style.background = pinActive ? (isThemeDark ? 'rgba(0,168,132,0.15)' : 'rgba(0,128,105,0.15)') : 'rgba(255,255,255,0.06)';
        badgePin.style.color = pinActive ? accent : '#8696a0';
        btnPin.textContent = pinActive ? 'Lepas' : 'Pin';
      }

      var muteActive = window.isAudioMuted ? window.isAudioMuted() : false;
      var badgeMute = document.getElementById('wa-badge-mute');
      var btnMute = document.getElementById('wa-action-toggle-mute');
      if (badgeMute && btnMute) {
        badgeMute.textContent = muteActive ? 'Senyap' : 'Bersuara';
        badgeMute.style.background = muteActive ? 'rgba(234,0,56,0.15)' : (isThemeDark ? 'rgba(0,168,132,0.15)' : 'rgba(0,128,105,0.15)');
        badgeMute.style.color = muteActive ? '#ff5252' : accent;
        btnMute.textContent = muteActive ? 'Bunyikan' : 'Senyapkan';
      }

      var autoActive = window.isAutoStartActive;
      var badgeAuto = document.getElementById('wa-badge-auto');
      var btnAuto = document.getElementById('wa-action-toggle-auto');
      if (badgeAuto && btnAuto) {
        badgeAuto.textContent = autoActive ? 'Aktif' : 'Nonaktif';
        badgeAuto.style.background = autoActive ? (isThemeDark ? 'rgba(0,168,132,0.15)' : 'rgba(0,128,105,0.15)') : 'rgba(255,255,255,0.06)';
        badgeAuto.style.color = autoActive ? accent : '#8696a0';
        btnAuto.textContent = autoActive ? 'Matikan' : 'Aktifkan';
      }

      window.syncModalTheme(isThemeDark);
    };

    // Initial query and populate
    window.checkAutoStartStatus().then(function() {
      if (window.updateModalUI) window.updateModalUI();
    });

    var pathLabel = document.getElementById('wa-folder-path');
    window.getDownloadDirNative().then(function(dir) {
      if (pathLabel && dir) {
        pathLabel.textContent = dir;
        pathLabel.title = dir;
      }
    });

    window.updateModalUI();

    // Theme Segmented Control Events
    document.getElementById('wa-theme-btn-dark').onclick = function() {
      window.setAppTheme('dark');
      window.updateModalUI();
    };
    document.getElementById('wa-theme-btn-light').onclick = function() {
      window.setAppTheme('light');
      window.updateModalUI();
    };
    document.getElementById('wa-theme-btn-system').onclick = function() {
      window.setAppTheme('system');
      window.updateModalUI();
    };

    // Card Action Events
    document.getElementById('wa-action-toggle-priv').onclick = function() {
      window.togglePrivacyMode();
      window.updateModalUI();
    };
    document.getElementById('wa-action-toggle-pin').onclick = function() {
      window.toggleAlwaysOnTop().then(window.updateModalUI);
    };
    document.getElementById('wa-action-toggle-mute').onclick = function() {
      window.toggleMuteAudio();
      window.updateModalUI();
    };
    document.getElementById('wa-action-toggle-auto').onclick = function() {
      window.toggleAutoStart().then(window.updateModalUI);
    };

    // Folder Actions
    document.getElementById('wa-btn-change-folder').onclick = function() {
      window.chooseDownloadDirNative().then(function(newDir) {
        if (newDir && pathLabel) {
          pathLabel.textContent = newDir;
          pathLabel.title = newDir;
        }
      });
    };
    document.getElementById('wa-btn-open-folder').onclick = function() {
      showFloatingToast('Membuka folder...');
      invokeBackend('open_download_dir').catch(function(err) {
        showFloatingToast('Gagal membuka folder: ' + err);
      });
    };
    document.getElementById('wa-btn-reset-folder').onclick = function() {
      window.resetDownloadDirNative().then(function(defDir) {
        if (defDir && pathLabel) {
          pathLabel.textContent = defDir;
          pathLabel.title = defDir;
        }
      });
    };

    // Maintenance Actions
    document.getElementById('wa-btn-check-updates').onclick = function() {
      showFloatingToast('Membuka rilis terbaru...');
      invokeBackend('open_external_url', { url: 'https://github.com/ryan-prayoga/whatsapp-desktop-rust/releases/latest' });
    };
    document.getElementById('wa-btn-reload-chat').onclick = function() {
      showFloatingToast('Memuat ulang chat...');
      setTimeout(function() { window.location.reload(); }, 200);
    };
    document.getElementById('wa-btn-hard-refresh').onclick = function() {
      showFloatingToast('Membersihkan cache & memuat ulang...');
      try {
        if ('caches' in window) {
          caches.keys().then(function(names) {
            names.forEach(function(n) { caches.delete(n); });
          });
        }
      } catch (e) {}
      setTimeout(function() {
        window.location.href = window.location.origin + window.location.pathname + '?_t=' + Date.now();
      }, 300);
    };
    document.getElementById('wa-btn-guide-modal').onclick = function() {
      window.showShortcutsGuideModal();
    };
  };

  // --- 18. Inject Settings Button into WhatsApp Header ---
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
    btn.innerHTML = ICONS.settings;

    btn.onmouseenter = function() {
      btn.style.backgroundColor = document.body.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      btn.style.color = document.body.classList.contains('dark') ? '#e9edef' : '#111b21';
    };
    btn.onmouseleave = function() {
      btn.style.backgroundColor = 'transparent';
      btn.style.color = '#aebac1';
    };
    btn.onclick = function(e) {
      e.stopPropagation();
      window.showSettingsModal();
    };
    wrap.appendChild(btn);
  }

  setInterval(injectHeaderButton, 2000);
  document.addEventListener('DOMContentLoaded', injectHeaderButton);
  window.addEventListener('load', injectHeaderButton);

  console.log('WhatsApp Desk (Rust + Tauri v2) Runtime Initialized.');
})();
