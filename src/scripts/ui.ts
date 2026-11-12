// Shared, dependency-free UI behaviours for the site.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Reveal on scroll ---------- */
const revealIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        revealIO.unobserve(e.target);
      }
    }),
  { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
);
document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

/* ---------- Count-up numbers ---------- */
const countIO = new IntersectionObserver((entries) =>
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement;
    countIO.unobserve(el);
    const to = Number(el.dataset.countTo);
    const suffix = el.dataset.suffix ?? '';
    if (reduceMotion) return void (el.textContent = to + suffix);
    const start = performance.now();
    const dur = 1600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }),
);
document.querySelectorAll('[data-count-to]').forEach((el) => countIO.observe(el));

/* ---------- Slider ---------- */
document.querySelectorAll<HTMLElement>('[data-slider]').forEach((root) => {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  if (slides.length === 0) return;
  const delay = Number(root.dataset.autoplay || 0);
  const dotsWrap = root.querySelector<HTMLElement>('[data-dots]');
  const countEl = root.querySelector<HTMLElement>('[data-current]');
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-pause]');
  const linkEl = root.querySelector<HTMLAnchorElement>('[data-slide-link]');
  let index = 0;
  let timer: number | undefined;
  let paused = reduceMotion;

  const dots: HTMLButtonElement[] = [];
  if (dotsWrap) {
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slider-dot';
      b.setAttribute('aria-label', `Go to slide ${i + 1}`);
      b.innerHTML = '<span></span>';
      b.addEventListener('click', () => go(i, true));
      dotsWrap.appendChild(b);
      dots.push(b);
    });
  }
  if (delay) root.style.setProperty('--slide-delay', `${delay}ms`);

  // Load a slide's image ahead of time so it never fades in as an empty frame
  const imgOf = (n: number) => slides[(n + slides.length) % slides.length].querySelector('img');
  const ready = (n: number): Promise<void> => {
    const im = imgOf(n);
    if (!im) return Promise.resolve();
    im.loading = 'eager';
    return (im.complete && im.naturalWidth ? Promise.resolve() : new Promise<void>((r) => { im.addEventListener('load', () => r(), { once: true }); im.addEventListener('error', () => r(), { once: true }); }))
      .then(() => im.decode?.().catch(() => {}));
  };
  let visible = !('IntersectionObserver' in window);
  let hovered = false;
  let seq = 0;

  function go(i: number, user = false) {
    const target = (i + slides.length) % slides.length;
    const my = ++seq;
    // wait (briefly) for the image, then switch; a newer request cancels this one
    Promise.race([ready(target), new Promise((r) => setTimeout(r, 1200))]).then(() => {
      if (my === seq) show(target, user);
    });
  }

  function show(i: number, user = false) {
    index = i;
    ready(index + 1); // warm up the next one
    slides.forEach((s, n) => {
      s.classList.toggle('is-active', n === index);
      s.setAttribute('aria-hidden', String(n !== index));
    });
    dots.forEach((d, n) => {
      d.classList.toggle('is-active', n === index);
      d.classList.toggle('is-done', n < index);
      // restart CSS progress animation
      if (n === index) { d.classList.remove('is-anim'); void d.offsetWidth; if (running() && delay) d.classList.add('is-anim'); }
      else d.classList.remove('is-anim');
    });
    if (countEl) countEl.textContent = String(index + 1).padStart(2, '0');
    if (linkEl) {
      const s = slides[index];
      if (s.dataset.href) linkEl.href = s.dataset.href;
      const label = linkEl.querySelector('[data-slide-label]');
      if (label && s.dataset.label) label.textContent = s.dataset.label;
    }
    restart();
  }
  // Autoplay only while the slider is on screen, not hovered and not paused
  function running() { return !paused && visible && !hovered && !document.hidden; }
  function restart() {
    clearTimeout(timer);
    if (delay && running()) timer = window.setTimeout(() => go(index + 1), delay);
  }
  function refresh() {
    const d = dots[index];
    if (d) { d.classList.remove('is-anim'); void d.offsetWidth; if (running() && delay) d.classList.add('is-anim'); }
    restart();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { ready(index); ready(index + 1); }
      refresh();
    }, { rootMargin: '200px 0px' }).observe(root);
  }
  if (root.classList.contains('mslider')) {
    root.addEventListener('mouseenter', () => { hovered = true; refresh(); });
    root.addEventListener('mouseleave', () => { hovered = false; refresh(); });
  }
  document.addEventListener('visibilitychange', refresh);
  root.querySelector('[data-prev]')?.addEventListener('click', () => go(index - 1, true));
  root.querySelector('[data-next]')?.addEventListener('click', () => go(index + 1, true));
  pauseBtn?.addEventListener('click', () => {
    paused = !paused;
    root.classList.toggle('is-paused', paused);
    pauseBtn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    refresh();
  });

  // swipe / drag (touch and mouse); a drag never opens the lightbox
  let x0: number | null = null;
  let y0 = 0;
  let dragged = false;
  root.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    x0 = e.clientX; y0 = e.clientY; dragged = false;
  });
  root.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - y0)) { dragged = true; go(index + (dx < 0 ? 1 : -1), true); }
    x0 = null;
  });
  root.addEventListener('pointercancel', () => { x0 = null; });
  root.addEventListener('dragstart', (e) => e.preventDefault());
  root.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(index - 1, true);
    if (e.key === 'ArrowRight') go(index + 1, true);
  });

  if (paused) root.classList.add('is-paused');
  show(0);
});

/* ---------- Tabs ---------- */
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((root) => {
  const tabs = [...root.querySelectorAll<HTMLElement>('[data-tab]')].filter((t) => t.closest('[data-tabs]') === root);
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')].filter((p) => p.closest('[data-tabs]') === root);
  const activate = (key: string, focus = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === key;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      if (on && focus) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
    panels.forEach((p) => {
      const on = p.dataset.panel === key;
      p.classList.toggle('is-active', on);
      p.hidden = !on;
    });
    root.dispatchEvent(new CustomEvent('tabchange', { detail: key }));
  };
  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      activate(t.dataset.tab!, true);
      if (root.dataset.tabsHash !== undefined) history.replaceState(null, '', `#${t.dataset.tab}`);
    }),
  );
  const fromHash = location.hash.slice(1);
  const initial = root.dataset.tabsHash !== undefined && tabs.some((t) => t.dataset.tab === fromHash) ? fromHash : tabs[0]?.dataset.tab;
  if (initial) activate(initial);
});

/* ---------- Colour picker ---------- */
document.querySelectorAll<HTMLElement>('[data-colors]').forEach((root) => {
  const img = root.querySelector<HTMLImageElement>('[data-color-image]')!;
  const name = root.querySelector<HTMLElement>('[data-color-name]')!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-color]')];
  // preload variants once the picker is near the screen, so switching is instant
  const cache = new Map<string, Promise<void>>();
  const load = (src: string) => {
    if (!cache.has(src)) {
      const i = new Image();
      i.src = src;
      cache.set(src, i.decode().catch(() => {}));
    }
    return cache.get(src)!;
  };
  new IntersectionObserver(([e], o) => {
    if (e.isIntersecting) { buttons.forEach((b) => load(b.dataset.img!)); o.disconnect(); }
  }, { rootMargin: '600px 0px' }).observe(root);

  let seq = 0;
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      if (b.classList.contains('is-active')) return;
      const my = ++seq;
      buttons.forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      name.textContent = b.dataset.color!;
      img.classList.add('is-switching');
      // swap only once the new picture is decoded and the fade-out has finished
      Promise.all([load(b.dataset.img!), new Promise((r) => setTimeout(r, reduceMotion ? 0 : 220))]).then(() => {
        if (my !== seq) return;
        img.src = b.dataset.img!;
        img.alt = `${root.dataset.model ?? 'Kia'} in ${b.dataset.color}`;
        requestAnimationFrame(() => img.classList.remove('is-switching'));
      });
    }),
  );
});

/* ---------- Lite YouTube ---------- */
document.querySelectorAll<HTMLElement>('[data-yt]').forEach((el) =>
  el.addEventListener('click', () => {
    const id = el.dataset.yt!;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = el.dataset.title || 'Kia Bhutan video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    el.replaceChildren(iframe);
    el.classList.add('is-playing');
  }),
);

/* ---------- Lightbox ---------- */
const lb = document.querySelector<HTMLElement>('[data-lightbox]');
if (lb) {
  const img = lb.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const cap = lb.querySelector<HTMLElement>('[data-lb-caption]')!;
  const count = lb.querySelector<HTMLElement>('[data-lb-count]')!;
  let group: HTMLAnchorElement[] = [];
  let i = 0;
  let lastFocus: Element | null = null;
  let seq = 0;
  const preload = (n: number) => {
    const a = group[(n + group.length) % group.length];
    if (a) { const p = new Image(); p.src = a.href; }
  };
  // cross-fade: fade out, swap once the next picture is decoded, fade in
  const show = (instant = false) => {
    const a = group[i];
    const my = ++seq;
    count.textContent = `${i + 1} / ${group.length}`;
    lb.classList.toggle('is-single', group.length < 2);
    const next = new Image();
    next.src = a.href;
    const swap = () => {
      if (my !== seq) return;
      img.src = a.href;
      img.alt = a.dataset.caption || '';
      cap.textContent = a.dataset.caption || '';
      requestAnimationFrame(() => img.classList.remove('is-fading'));
      preload(i + 1); preload(i - 1);
    };
    if (instant) { img.classList.remove('is-fading'); return void next.decode().catch(() => {}).then(swap); }
    img.classList.add('is-fading');
    Promise.all([next.decode().catch(() => {}), new Promise((r) => setTimeout(r, reduceMotion ? 0 : 180))]).then(swap);
  };
  const step = (d: number) => { if (group.length < 2) return; i = (i + d + group.length) % group.length; show(); };
  const close = () => {
    lb.classList.remove('is-open');
    document.documentElement.classList.remove('no-scroll');
    setTimeout(() => { if (!lb.classList.contains('is-open')) { lb.hidden = true; img.removeAttribute('src'); } }, reduceMotion ? 0 : 300);
    (lastFocus as HTMLElement | null)?.focus({ preventScroll: true });
  };
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-lb]');
    if (!a) return;
    e.preventDefault();
    lastFocus = a;
    group = [...document.querySelectorAll<HTMLAnchorElement>(`a[data-lb="${a.dataset.lb}"]`)];
    i = group.indexOf(a);
    show(true);
    lb.hidden = false;
    document.documentElement.classList.add('no-scroll');
    requestAnimationFrame(() => lb.classList.add('is-open'));
    lb.querySelector<HTMLElement>('[data-lb-close]')!.focus({ preventScroll: true });
  });
  lb.querySelector('[data-lb-close]')!.addEventListener('click', close);
  lb.querySelector('[data-lb-prev]')!.addEventListener('click', () => step(-1));
  lb.querySelector('[data-lb-next]')!.addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb || (e.target as HTMLElement).classList.contains('lightbox__figure')) close(); });
  // swipe inside the lightbox
  let lx: number | null = null;
  lb.addEventListener('pointerdown', (e) => { if (!(e.target as HTMLElement).closest('button')) lx = e.clientX; });
  lb.addEventListener('pointerup', (e) => {
    if (lx === null) return;
    const dx = e.clientX - lx;
    lx = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
  img.addEventListener('dragstart', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
}

/* ---------- Sub-navigation scrollspy (model pages) ---------- */
const subnav = document.querySelector<HTMLElement>('[data-subnav]');
if (subnav) {
  const links = [...subnav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const strip = subnav.querySelector<HTMLElement>('.subnav__links');
  const targets = links.map((l) => document.querySelector<HTMLElement>(l.hash)).filter(Boolean) as HTMLElement[];
  let current = '';
  let lockUntil = 0; // while a click-scroll is running, keep the clicked tab active
  // where the bottom of the sub-nav sits once it is stuck to the top
  const stuckBottom = () => (parseFloat(getComputedStyle(subnav).top) || 0) + subnav.offsetHeight;

  const setActive = (id: string) => {
    if (id === current) return;
    current = id;
    links.forEach((l) => {
      const on = l.hash === `#${id}`;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      // centre the active tab inside the strip only (never moves the page itself)
      if (on && strip && strip.scrollWidth > strip.clientWidth) {
        const left = l.offsetLeft - strip.offsetLeft - (strip.clientWidth - l.offsetWidth) / 2;
        strip.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  };

  // Active section = the last one whose top has passed the bottom of the sticky bars
  let ticking = false;
  const spy = () => {
    ticking = false;
    if (performance.now() < lockUntil) return;
    const line = stuckBottom() + window.innerHeight * 0.25;
    let id = '';
    for (const t of targets) if (t.getBoundingClientRect().top <= line) id = t.id;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) id = targets[targets.length - 1]?.id ?? id;
    setActive(id);
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  window.addEventListener('resize', spy);
  spy();

  // Smooth jump that lands exactly below the header + sub-nav
  links.forEach((l) =>
    l.addEventListener('click', (e) => {
      const t = document.querySelector<HTMLElement>(l.hash);
      if (!t) return;
      e.preventDefault();
      const want = () => t.getBoundingClientRect().top + window.scrollY - stuckBottom() + 1;
      setActive(t.id);
      lockUntil = performance.now() + 1200;
      window.scrollTo({ top: want(), behavior: reduceMotion ? 'auto' : 'smooth' });
      // if images above loaded and moved the section while scrolling, settle on it exactly
      const settle = () => {
        const off = want() - window.scrollY;
        if (Math.abs(off) > 2) window.scrollTo({ top: want(), behavior: 'smooth' });
      };
      if ('onscrollend' in window) window.addEventListener('scrollend', settle, { once: true });
      else setTimeout(settle, 1000);
      history.replaceState(null, '', l.hash);
    }),
  );
}

/* ---------- Forms (POST to /api/form) ---------- */
document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    btn.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please call us instead.');
      form.reset();
      status.classList.add('is-success');
      status.textContent = data.message || 'Thank you! We will contact you shortly.';
    } catch (err) {
      status.classList.add('is-error');
      status.textContent = (err as Error).message;
    } finally {
      btn.disabled = false;
    }
  });
});

/* ---------- File input labels ---------- */
document.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) =>
  input.addEventListener('change', () => {
    const label = input.closest('.file')?.querySelector('[data-file-name]');
    if (label) label.textContent = input.files?.length ? input.files[0].name : 'No file chosen';
  }),
);
