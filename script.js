const menuBtn = document.getElementById('menuBtn');
  const navlinks = document.getElementById('navlinks');
  menuBtn.addEventListener('click', () => navlinks.classList.toggle('open'));
  navlinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navlinks.classList.remove('open')));

  (function initTheme(){
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try{ localStorage.setItem('theme', next); }catch(e){}
    });
  })();

  // Interactive skills keyboard: click or press the matching physical key
  const skbBoard = document.getElementById('skbBoard');
  const skbCaption = document.getElementById('skbCaption');
  if (skbBoard && skbCaption) {
    const keyEls = Array.from(skbBoard.querySelectorAll('.key'));
    const keyMap = {};
    keyEls.forEach(k => { keyMap[k.dataset.key.toUpperCase()] = k; });
    let captionTimer = null;

    function pressKey(el){
      el.classList.add('pressed');
      const tech = el.dataset.tech, quip = el.dataset.quip;
      skbCaption.innerHTML = '<span class="who">' + tech + '</span>' + quip;
      skbCaption.classList.add('show');
      clearTimeout(captionTimer);
      captionTimer = setTimeout(() => skbCaption.classList.remove('show'), 1900);
    }
    function releaseKey(el){ el.classList.remove('pressed'); }

    keyEls.forEach(el => {
      el.addEventListener('mousedown', () => pressKey(el));
      el.addEventListener('mouseup', () => releaseKey(el));
      el.addEventListener('mouseleave', () => releaseKey(el));
      el.addEventListener('touchstart', (e) => { pressKey(el); }, { passive: true });
      el.addEventListener('touchend', () => releaseKey(el));
    });

    window.addEventListener('keydown', (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.repeat) return;
      const el = keyMap[e.key.toUpperCase()];
      if (el) pressKey(el);
    });
    window.addEventListener('keyup', (e) => {
      const el = keyMap[e.key.toUpperCase()];
      if (el) releaseKey(el);
    });
  }

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCount(el){
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const duration = 1100;
    const start = performance.now();
    function tick(now){
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          const counter = entry.target.querySelector ? entry.target.querySelector('.about-num[data-target]') : null;
          if (counter) animateCount(counter);
          if (entry.target.classList.contains('about-num') && entry.target.dataset.target) animateCount(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    document.querySelectorAll('.about-num[data-target]').forEach(animateCount);
  }

  // Active nav link highlighting
  const navSections = ['about','systems','work','experience','stack','contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  const navAnchors = Array.from(navlinks.querySelectorAll('a'));
  if ('IntersectionObserver' in window && navSections.length) {
    const navIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const link = navAnchors.find(a => a.getAttribute('href') === '#' + entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navAnchors.forEach(a => a.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    navSections.forEach(sec => navIo.observe(sec));
  }

  // Scroll progress + back-to-top
  const scrollBtn = document.getElementById('scrollTop');
  const scProgress = scrollBtn.querySelector('.sc-progress');
  const CIRC = 144.51;
  function onScroll(){
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    scProgress.style.strokeDashoffset = String(CIRC * (1 - pct));
    scrollBtn.classList.toggle('show', scrollTop > 420);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  // Card tilt-on-hover (dashboard feel), skipped for reduced motion / touch-only
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.sys-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const cx = r.width / 2, cy = r.height / 2;
        const rx = ((e.clientY - r.top - cy) / cy) * -5;
        const ry = ((e.clientX - r.left - cx) / cx) * 5;
        card.style.transition = 'transform .06s linear';
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
        card.style.transform = 'translateY(0)';
      });
    });
  }

  // Copy email
  document.querySelectorAll('.copy-email').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.email;
      const toast = btn.querySelector('.copy-toast');
      try {
        await navigator.clipboard.writeText(email);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = email; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e2) {}
        document.body.removeChild(ta);
      }
      if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1500);
      }
    });
  });
