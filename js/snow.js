/* 水墨飞雪 —— 全站轻量 Canvas 下雪(圆形、柔边渐变) */
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
      r: size < 0.7 ? 2.2 + Math.random() * 2.4 : 3.2 + Math.random() * 2.8,
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

  function frame() {
    var now = performance.now();
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += f.vy;
      f.x += f.vx + Math.sin(now / 1600 * f.w + f.ph) * f.sway;
      if (f.y > H + 8) f = flakes[i] = makeFlake('top');

      softDot(f.x, f.y, f.r, '70,85,102', f.o * 0.5);       // 柔边灰墨色晕(白底上可见)
      softDot(f.x, f.y, f.r * 0.6, '255,255,255', f.o * 0.95); // 明亮柔白核心(深色上可见)
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
