/* Vercount 计数器加载器（2026-11-16）
   生产环境加载 Vercount，兼容页脚的 busuanzi_value_site_uv/pv 标签。
   本地预览不请求公共实例：Vercount 按 hostname 计数，所有 localhost 共用一个池，
   直接加载会显示几千万的公共数字，不是本站数据。

   旧数据迁移：不蒜子时代的站点基线是访客 427 / 浏览 597（用户确认）。
   Vercount 现在从测试计数（2 UV / 2 PV）开始，所以显示值 = Vercount 原始值 + 偏移。
   以后如果在 Vercount 后台手动回填到 427/597，记得把 OFFSET 改成 0，否则会叠加。 */
(function () {
  var LEGACY = { site_uv: 427, site_pv: 597 };
  var BASELINE = { site_uv: 2, site_pv: 2 };
  var OFFSET = {
    site_uv: LEGACY.site_uv - BASELINE.site_uv,
    site_pv: LEGACY.site_pv - BASELINE.site_pv
  };

  function setText(key, value) {
    var el = document.getElementById('busuanzi_value_' + key);
    if (el) el.textContent = String(value);
  }

  function showLegacy() {
    setText('site_uv', LEGACY.site_uv);
    setText('site_pv', LEGACY.site_pv);
  }

  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '';

  if (isLocal) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showLegacy);
    } else {
      showLegacy();
    }
    return;
  }

  if (window.__vercountScriptLoaded) return;
  window.__vercountScriptLoaded = true;

  function applyOffset() {
    ['site_uv', 'site_pv'].forEach(function (key) {
      var el = document.getElementById('busuanzi_value_' + key);
      if (!el) return;
      if (el.dataset.legacyShown === el.textContent) return;
      var raw = parseInt(el.textContent, 10);
      if (isNaN(raw)) return;
      var display = raw + OFFSET[key];
      el.dataset.legacyShown = String(display);
      el.textContent = String(display);
    });
  }

  function watch() {
    ['site_uv', 'site_pv'].forEach(function (key) {
      var el = document.getElementById('busuanzi_value_' + key);
      if (!el) return;
      new MutationObserver(applyOffset).observe(el, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });
    applyOffset();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch);
  } else {
    watch();
  }

  var s = document.createElement('script');
  s.src = 'https://events.vercount.one/js';
  s.async = true;
  document.head.appendChild(s);
})();
