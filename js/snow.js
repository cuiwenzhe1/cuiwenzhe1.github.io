/* 首页水墨飞雪 —— 仅首页运行、稀疏缓慢、轻量 Canvas 实现 */
(function () {
  if (window.location.pathname !== '/') return;

  var canvas = document.createElement('canvas');
  canvas.id = 'ink-snow';
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:998;';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  var COUNT = W >= 768 ? 80 : 30;
  var flakes = [];

  function makeFlake(atTop) {
    var size = Math.random();
    return {
      x: Math.random() * W,
      y: atTop ? -Math.random() * H : Math.random() * H,
      r: size < 0.7 ? 1.6 + Math.random() * 1.8 : 2.6 + Math.random() * 2.0,
      star: size >= 0.7,
      vy: 0.4 + Math.random() * 1.0,
      vx: (Math.random() - 0.5) * 0.3,
      ph: Math.random() * Math.PI * 2,
      w: 0.4 + Math.random() * 0.8,
      sway: 0.2 + Math.random() * 0.5,
      o: 0.7 + Math.random() * 0.3
    };
  }

  function drawStar(f, dx, dy, color, alpha) {
    ctx.beginPath();
    for (var k = 0; k < 6; k++) {
      var a = k * Math.PI / 3 + f.ph;
      ctx.moveTo(f.x + dx, f.y + dy);
      ctx.lineTo(f.x + dx + Math.cos(a) * f.r * 2.2, f.y + dy + Math.sin(a) * f.r * 2.2);
    }
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(0.8, f.r * 0.55);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  var last = performance.now();
  function frame(now) {
    if (document.hidden) {
      last = now;
      requestAnimationFrame(frame);
      return;
    }
    var dt = Math.min((now - last) / 16.666, 3);
    last = now;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += f.vy * dt;
      f.x += f.vx * dt + Math.sin(now / 1600 * f.w + f.ph) * f.sway * dt;
      if (f.y > H + 4) f = flakes[i] = makeFlake(false);

      if (f.star) {
        drawStar(f, 1.5, 1.6, 'rgba(96,110,124,' + (f.o * 0.7) + ')', 1);
        drawStar(f, 0, 0, 'rgba(255,255,255,' + f.o + ')', 1);
      } else {
        ctx.beginPath();
        ctx.arc(f.x + 1.5, f.y + 1.6, f.r + 0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(96,110,124,' + (f.o * 0.7) + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + f.o + ')';
        ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
