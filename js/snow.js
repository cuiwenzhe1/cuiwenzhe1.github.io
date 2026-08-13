/* 水墨飞雪 —— 全站轻量 Canvas 下雪(圆形柔边 + 右下角开关) */
(function () {
  var canvas = document.createElement('canvas');
  canvas.id = 'ink-snow';
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:998;';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  function resize() {
    W = window.innerWidth || document.documentElement.clientWidth || 800;
    H = window.innerHeight || document.documentElement.clientHeight || 600;
    if (W < 2) W = 800;
    if (H < 2) H = 600;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);

  var COUNT = W >= 768 ? 90 : 35;
  var flakes = [];

  function makeFlake(where) {
    var size = Math.random();
    return {
      x: Math.random() * W,
      y: where === 'top' ? -6 - Math.random() * 60 : Math.random() * H,
      r: size < 0.7 ? 3.0 + Math.random() * 3.2 : 4.2 + Math.random() * 3.8,
      vy: 0.4 + Math.random() * 1.0,
      vx: (Math.random() - 0.5) * 0.3,
      ph: Math.random() * Math.PI * 2,
      w: 0.4 + Math.random() * 0.8,
      sway: 0.2 + Math.random() * 0.5,
      o: 0.85 + Math.random() * 0.15
    };
  }
  for (var i = 0; i < COUNT; i++) flakes.push(makeFlake('full'));

  function softDot(x, y, r, rgb, alpha) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  var enabled = true;
  try { enabled = localStorage.getItem('ink_snow') !== '0'; } catch (e) {}
  var rafId = 0;

  function frame() {
    var now = performance.now();
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += f.vy;
      f.x += f.vx + Math.sin(now / 1600 * f.w + f.ph) * f.sway;
      if (f.y > H + 8) f = flakes[i] = makeFlake('top');

      softDot(f.x, f.y, f.r, '70,85,102', f.o * 0.5);
      softDot(f.x, f.y, f.r * 0.6, '255,255,255', f.o * 0.95);
    }
    rafId = requestAnimationFrame(frame);
  }

  function startSnow() {
    if (rafId) return;
    rafId = requestAnimationFrame(frame);
  }
  function stopSnow() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    ctx.clearRect(0, 0, W, H);
  }

  var toggle = document.createElement('button');
  toggle.id = 'ink-snow-toggle';
  toggle.type = 'button';
  toggle.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:9999;font:11px/1.5 Consolas,"PingFang SC","Microsoft YaHei",sans-serif;color:#fff;background:rgba(45,55,65,.65);border:1px solid rgba(255,255,255,.15);padding:3px 9px;border-radius:14px;cursor:pointer;user-select:none;-webkit-user-select:none;';
  document.body.appendChild(toggle);

  function setToggleUI() {
    toggle.textContent = enabled ? '❄ 雪花:开' : '❄ 雪花:关';
    toggle.style.opacity = enabled ? '0.85' : '0.4';
  }
  toggle.addEventListener('click', function () {
    enabled = !enabled;
    try { localStorage.setItem('ink_snow', enabled ? '1' : '0'); } catch (e) {}
    setToggleUI();
    if (enabled) startSnow(); else stopSnow();
  });

  setToggleUI();
  if (enabled) startSnow();
})();
