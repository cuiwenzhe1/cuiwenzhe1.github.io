/* busuanzi 统计修复:pjax 切换分页不再重复计数,页脚数字保持不变 */
(function () {
  var PV = 'busuanzi_value_site_pv';
  var UV = 'busuanzi_value_site_uv';
  var cache = { pv: '', uv: '' };

  function grab() {
    var el;
    if ((el = document.getElementById(PV)) && el.textContent) cache.pv = el.textContent;
    if ((el = document.getElementById(UV)) && el.textContent) cache.uv = el.textContent;
  }
  function restore() {
    var el;
    if ((el = document.getElementById(PV)) && cache.pv) el.textContent = cache.pv;
    if ((el = document.getElementById(UV)) && cache.uv) el.textContent = cache.uv;
  }

  // 1) busuanzi 只在真正刷新页面时计数:去掉它的 data-pjax,翻页(pjax)不再重新执行
  function strip() {
    var s = document.querySelector('script[data-pjax][src*="busuanzi"]');
    if (s) s.removeAttribute('data-pjax');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', strip);
  } else {
    strip();
  }

  // 2) 翻页前保存数字,翻页后恢复显示(首次加载 busuanzi 是异步的,轮询等它填好)
  var tries = 0;
  (function poll() {
    grab();
    if ((cache.pv && cache.uv) || tries++ >= 30) return;
    setTimeout(poll, 400);
  })();
  window.addEventListener('load', function () { setTimeout(grab, 1500); });

  document.addEventListener('pjax:send', grab);
  document.addEventListener('pjax:complete', restore);
})();
