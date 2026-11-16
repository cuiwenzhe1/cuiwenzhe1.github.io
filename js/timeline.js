(function () {
  'use strict';

  function initTimeline() {
    var root = document.querySelector('.timeline-page');
    if (!root || root.getAttribute('data-tl-ready') === '1') return;

    var path = root.querySelector('.timeline-road-line');
    var nodes = Array.prototype.slice.call(root.querySelectorAll('.timeline-node'));
    var details = Array.prototype.slice.call(root.querySelectorAll('.timeline-detail'));
    if (!path || !nodes.length) return;

    var length = path.getTotalLength();

    function show(index) {
      nodes.forEach(function (node, i) {
        var active = i === index;
        node.classList.toggle('is-active', active);
        node.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      details.forEach(function (panel) {
        var active = Number(panel.getAttribute('data-index')) === index;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
      root.setAttribute('data-current', String(index));
    }

    nodes.forEach(function (node, i) {
      var t = nodes.length === 1 ? 0.5 : (i + 0.5) / nodes.length;
      var point = path.getPointAtLength(t * length);
      node.style.left = (point.x / 1000 * 100) + '%';
      node.style.top = (point.y / 260 * 100) + '%';
      node.classList.toggle('is-below', i % 2 === 1);
      node.addEventListener('click', function () { show(i); });
    });

    show(nodes.length - 1);
    root.setAttribute('data-tl-ready', '1');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimeline);
  } else {
    initTimeline();
  }
  if (!window.__timelinePjaxBound) {
    document.addEventListener('pjax:complete', initTimeline);
    window.__timelinePjaxBound = true;
  }
})();
