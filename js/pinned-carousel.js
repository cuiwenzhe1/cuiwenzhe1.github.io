(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let mounted;
  let unmount = () => {};

  function mount() {
    const carousel = document.querySelector('.pinned-carousel');
    if (carousel === mounted) return;

    unmount();
    mounted = carousel;
    unmount = () => {};
    const controls = carousel?.querySelector('.pinned-controls');
    if (!controls) return;

    const slides = [...carousel.querySelectorAll('.pinned-slide')];
    const previous = controls.querySelector('.pinned-prev');
    const next = controls.querySelector('.pinned-next');
    const toggle = controls.querySelector('.pinned-toggle');
    const count = controls.querySelector('.pinned-count');
    const cleanup = new AbortController();
    let current = 0;
    let timer;
    let inView = false;
    let hovered = false;
    let paused = false;
    let moving = false;

    for (const slide of slides.slice(1)) slide.hidden = true;
    carousel.classList.add('is-ready');
    controls.hidden = false;

    function schedule() {
      clearTimeout(timer);
      if (!carousel.isConnected || !inView || moving || hovered || paused ||
          carousel.matches(':focus-within') || document.hidden || reducedMotion.matches) return;
      timer = setTimeout(() => turn(1), 5500);
    }

    function turn(direction, manual = false) {
      if (moving) return;
      clearTimeout(timer);
      const outgoing = slides[current];
      current = (current + direction + slides.length) % slides.length;
      const incoming = slides[current];
      outgoing.inert = true;
      incoming.inert = false;
      incoming.hidden = false;
      count.setAttribute('aria-live', manual ? 'polite' : 'off');
      count.textContent = `${current + 1} / ${slides.length}`;

      function finish() {
        outgoing.hidden = true;
        moving = false;
        schedule();
      }

      if (reducedMotion.matches) {
        finish();
        return;
      }
      moving = true;
      const motion = { duration: 460, easing: 'cubic-bezier(.25,.75,.25,1)' };
      const leave = outgoing.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-100 * direction}%)` }], motion);
      const enter = incoming.animate([{ transform: `translateX(${100 * direction}%)` }, { transform: 'translateX(0)' }], motion);
      Promise.all([leave.finished, enter.finished]).then(finish, finish);
    }

    function syncMotion() {
      toggle.hidden = reducedMotion.matches;
      schedule();
    }

    previous.addEventListener('click', () => turn(-1, true));
    next.addEventListener('click', () => turn(1, true));
    toggle.addEventListener('click', () => {
      paused = !paused;
      toggle.classList.toggle('is-paused', paused);
      toggle.setAttribute('aria-label', paused ? '播放轮播' : '暂停轮播');
      schedule();
    });
    carousel.addEventListener('pointerenter', event => {
      hovered = event.pointerType !== 'touch';
      schedule();
    });
    carousel.addEventListener('pointerleave', () => {
      hovered = false;
      schedule();
    });
    carousel.addEventListener('focusin', schedule);
    carousel.addEventListener('focusout', () => requestAnimationFrame(schedule));
    controls.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        turn(event.key === 'ArrowRight' ? 1 : -1, true);
      }
    });

    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= .5;
      schedule();
    }, { threshold: .5 });
    visibility.observe(carousel);
    document.addEventListener('visibilitychange', schedule, { signal: cleanup.signal });
    reducedMotion.addEventListener('change', syncMotion, { signal: cleanup.signal });
    syncMotion();

    unmount = () => {
      clearTimeout(timer);
      visibility.disconnect();
      // 全局监听只保留当前轮播实例。
      cleanup.abort();
    };
  }

  mount();
  document.addEventListener('pjax:complete', mount);
})();
