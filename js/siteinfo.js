(function () {
  var root = document.getElementById('site-runtime');
  if (!root) return;

  // 网站上线时间（UTC），2026-08-11 23:40 北京时间
  var launch = new Date('2026-08-11T15:40:27Z').getTime();
  root.classList.add('rt');

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function compute(diff) {
    return [
      { val: pad2(Math.floor(diff / 86400)), unit: '天' },
      { val: pad2(Math.floor(diff % 86400 / 3600)), unit: '小时' },
      { val: pad2(Math.floor(diff % 3600 / 60)), unit: '分' },
      { val: pad2(diff % 60), unit: '秒' }
    ];
  }

  // 每个数字列：纵向 0-9，通过 translateY 滚动定位当前数字
  function makeCol(digit) {
    var col = document.createElement('span');
    col.className = 'rt-col';
    var strip = document.createElement('span');
    strip.className = 'rt-strip';
    for (var i = 0; i < 10; i++) {
      var s = document.createElement('span');
      s.textContent = i;
      strip.appendChild(s);
    }
    col.appendChild(strip);
    setCol(col, digit);
    return col;
  }

  function setCol(col, digit) {
    col.querySelector('.rt-strip').style.transform = 'translateY(-' + digit + 'em)';
  }

  function buildGroup(val, unit) {
    var group = document.createElement('span');
    group.className = 'rt-group';
    var cols = document.createElement('span');
    cols.className = 'rt-cols';
    String(val).split('').forEach(function (ch) {
      cols.appendChild(makeCol(Number(ch)));
    });
    group.appendChild(cols);
    var label = document.createElement('span');
    label.className = 'rt-unit';
    label.textContent = unit;
    group.appendChild(label);
    return group;
  }

  var groups = compute(0).map(function (v) {
    var el = buildGroup(v.val, v.unit);
    root.appendChild(el);
    return { el: el, val: v.val, unit: v.unit };
  });

  function tick() {
    var diff = Math.max(0, Math.floor((Date.now() - launch) / 1000));
    compute(diff).forEach(function (v, i) {
      var cur = groups[i];
      if (String(cur.val).length !== v.val.length) {
        // 位数变化（如 9→10 天），重建该组
        var newEl = buildGroup(v.val, v.unit);
        root.replaceChild(newEl, cur.el);
        groups[i] = { el: newEl, val: v.val, unit: v.unit };
      } else {
        var cols = cur.el.querySelectorAll('.rt-col');
        String(v.val).split('').forEach(function (ch, c) {
          setCol(cols[c], Number(ch));
        });
        cur.val = v.val;
      }
    });
  }

  tick();
  setInterval(tick, 1000);
})();
