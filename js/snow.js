/* 水墨飞雪 —— 全站轻量 Canvas 下雪 */
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
      y: where === 'top'
        ? -6 - Math.random() * 60
        : Math.random() * H,
      r: size < 0.7 ? 2.0 + Math.random() * 2.2 : 3.0 + Math.random() * 2.6,
      star: size >= 0.7,
      vy: 0.4 + Math.random() * 1.0,
      vx: (Math.random() - 0.5) * 0.3,
      ph: Math.random() * Math.PI * 2,
      w: 0.4 + Math.random() * 0.8,
      sway: 0.2 + Math.random() * 0.5,
      o: 0.85 + Math.random() * 0.15
    };
  }
  for (var i = 0; i < COUNT; i++) flakes.push(makeFlake('full'));

  function drawStar(f, dx, dy, color, alpha) {
    ctx.beginPath();
    for (var k = 0; k < 6; k++) {
      var a = k * Math.PI / 3 + f.ph;
      ctx.moveTo(f.x + dx, f.y + dy);
      ctx.lineTo(f.x + dx + Math.cos(a) * f.r * 2.2, f.y + dy + Math.sin(a) * f.r * 2.2);
    }
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1.0, f.r * 0.6);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  var frames = 0;
  function frame() {
    var now = performance.now();
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += f.vy;
      f.x += f.vx + Math.sin(now / 1600 * f.w + f.ph) * f.sway;
      if (f.y > H + 6) f = flakes[i] = makeFlake('top');

      if (f.star) {
        drawStar(f, 1.5, 1.6, 'rgba(70,85,102,' + (f.o * 0.5) + ')', 1);
        drawStar(f, 0, 0, 'rgba(255,255,255,' + f.o + ')', 1);
      } else {
        ctx.beginPath();
        ctx.arc(f.x + 1.2, f.y + 1.3, f.r + 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(70,85,102,' + (f.o * 0.35) + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + f.o + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(70,85,102,' + (f.o * 0.55) + ')';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
    }
    frames++;
    if (frames % 30 === 0) dbg.textContent = badgeText();
    requestAnimationFrame(frame);
  }

  var dbg = document.createElement('div');
  dbg.id = 'ink-snow-dbg';
  dbg.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:9999;font:11px/1.4 Consolas,monospace;color:#fff;background:rgba(45,55,65,.6);padding:2px 7px;border-radius:4px;opacity:.8;pointer-events:none;';
  function badgeText() {
    return '❄ on · ' + COUNT + ' · ' + Math.round(W) + '×' + Math.round(H) + ' · ' + (document.hidden ? 'HIDDEN' : 'vis') + ' · f:' + frames;
  }
  dbg.textContent = badgeText();
  document.body.appendChild(dbg);

  requestAnimationFrame(frame);
})();
