// F3.3 / C7: Browser companion — feature detection + redirect layer.
// If desktop extension APIs available (sidePanel): use them. Otherwise redirect to PWA.
(function () {
  if (typeof chrome === "undefined" || !chrome.sidePanel) {
    // Not a desktop extension runtime (e.g., mobile Chrome, injected via bookmarklet): redirect
    return;
  }
  // Desktop extension: inject a floating trigger button
  const btn = document.createElement("button");
  btn.textContent = "🎤 PM-AJAY";
  btn.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:99999;padding:10px 14px;background:#c2571b;color:#fff;border:none;border-radius:999px;font-weight:700;font-size:.95rem;box-shadow:0 4px 12px rgba(43,33,24,.25);cursor:pointer;font-family:inherit";
  btn.onclick = () => chrome.sidePanel.open({ windowId: chrome.windows ? chrome.windows.WINDOW_ID_CURRENT : null });
  document.body.appendChild(btn);
})();
