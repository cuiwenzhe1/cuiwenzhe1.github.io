/* 51.la 后台统计（2026-11-16）
   注册 https://www.51.la/ 后，把自己的统计 ID 和 ck 填到下面对应位置。
   没填之前不加载 SDK，也不发任何请求。
   hashMode: true 让 pjax/hash 路由切换也能正确记页面。 */
(function () {
  // 以 51.la 后台「同步安装」代码里的 LA.init 为准：
  // id 是动态掩码，不是站点列表里那个数字 ID。
  var id = '3RqUBUOZYfWKnpuV';
  var ck = '3RqUBUOZYfWKnpuV';
  if (id.indexOf('YOUR_') === 0 || ck.indexOf('YOUR_') === 0) return;

  // 本地预览不计入 51.la，避免污染后台数据
  var host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '') return;

  var s = document.createElement('script');
  s.src = 'https://sdk.51.la/js-sdk-pro.min.js';
  s.charset = 'UTF-8';
  s.id = 'LA_COLLECT';
  s.onload = function () {
    try {
      LA.init({ id: id, ck: ck, hashMode: true });
    } catch (err) {}
  };
  document.head.appendChild(s);
})();
