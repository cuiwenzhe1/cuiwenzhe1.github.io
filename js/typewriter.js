(function () {
  var siteInfo = document.getElementById('site-info');
  if (!siteInfo) return;

  var titleEl = document.getElementById('site-title');
  if (!titleEl) return;
  var fullTitle = titleEl.textContent;

  // 副标题容器（主题未启用 subtitle 时自己创建）
  var subEl = document.createElement('div');
  subEl.id = 'site-subtitle';
  siteInfo.insertBefore(subEl, titleEl.nextSibling);

  var phrases = ['索雷阿给动'];

  function typeText(el, text, speed, cb) {
    var i = 0;
    el.textContent = '';
    (function step() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i++);
        setTimeout(step, speed);
      } else {
        cb && cb();
      }
    })();
  }

  function deleteText(el, speed, cb) {
    (function step() {
      if (el.textContent.length > 0) {
        el.textContent = el.textContent.slice(0, -1);
        setTimeout(step, speed);
      } else {
        cb && cb();
      }
    })();
  }

  function subtitleLoop(idx) {
    var phrase = phrases[idx % phrases.length];
    typeText(subEl, phrase, 170, function () {
      setTimeout(function () {
        deleteText(subEl, 60, function () {
          subtitleLoop(idx + 1);
        });
      }, 2000);
    });
  }

  if (!titleEl.dataset.typed) {
    titleEl.dataset.typed = '1';
    setTimeout(function () {
      typeText(titleEl, fullTitle, 150, function () {
        titleEl.classList.add('typed-done');
        setTimeout(function () { subtitleLoop(0); }, 900);
      });
    }, 1200);
  } else {
    titleEl.classList.add('typed-done');
    subtitleLoop(0);
  }
})();
