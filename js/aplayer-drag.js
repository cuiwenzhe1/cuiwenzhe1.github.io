(function () {
  var card = document.getElementById('ink-player');
  var handle = card && card.querySelector('.ink-player-head');
  if (!card || !handle) return;

  var startX, startY, origLeft, origTop, dragging = false, moved = 0;

  handle.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    var rect = card.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    origLeft = rect.left;
    origTop = rect.top;
    dragging = true;
    moved = 0;
    e.preventDefault();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  function onMove(e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
    var w = card.offsetWidth;
    var h = card.offsetHeight;
    var left = Math.min(Math.max(0, origLeft + dx), window.innerWidth - w);
    var top = Math.min(Math.max(0, origTop + dy), window.innerHeight - h);
    card.style.left = left + 'px';
    card.style.right = 'auto';
    card.style.top = top + 'px';
    card.style.bottom = 'auto';
  }

  function onUp() {
    dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
})();

/* 把当前歌曲名同步到顶部手柄条（APlayer 异步创建，轮询 DOM） */
(function () {
  var titleEl = document.getElementById('ink-song-title');
  if (!titleEl) return;

  var lastText = '';

  function sync() {
    var t = document.querySelector('#ink-player .aplayer-music .aplayer-title');
    if (!t || !t.textContent) return;
    var text = t.textContent.trim();
    if (text && text !== lastText) {
      titleEl.textContent = text;
      lastText = text;
    }
  }

  setInterval(sync, 500);
})();
