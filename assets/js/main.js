/* doc site script. No dependencies, no network requests. */
document.documentElement.classList.add('js');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- dropdowns: section menu ---------- */
const dropdowns = [];
function dropdown(btn, panel) {
  const open = () => { closeAll(btn); panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
  const close = (focus) => { if (panel.hidden) return; panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focus) btn.focus(); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); panel.hidden ? open() : close(); });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); open(); panel.querySelector('a')?.focus(); }
  });
  panel.addEventListener('keydown', (e) => {
    const items = [...panel.querySelectorAll('a')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
  });
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  panel.addEventListener('focusout', (e) => { if (!panel.contains(e.relatedTarget) && e.relatedTarget !== btn) close(); });
  const d = { btn, panel, close };
  dropdowns.push(d);
  return d;
}
function closeAll(except) { dropdowns.forEach((d) => { if (d.btn !== except) d.close(); }); }
document.querySelectorAll('[data-dropdown]').forEach((btn) => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  if (panel) dropdown(btn, panel);
});
document.addEventListener('click', (e) => { dropdowns.forEach((d) => { if (!d.panel.contains(e.target) && !d.btn.contains(e.target)) d.close(); }); });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  dropdowns.forEach((d) => { if (!d.panel.hidden) d.close(d.panel.contains(document.activeElement) || d.btn === document.activeElement); });
});
let lastW = window.innerWidth;
window.addEventListener('resize', () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; closeAll(); } });


/* ---------- next-screen arrows: smooth, and the user can interrupt ---------- */
let scrollAnim = null;
function stopScroll() { if (scrollAnim) { cancelAnimationFrame(scrollAnim); scrollAnim = null; } }
['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => window.addEventListener(t, stopScroll, { passive: true }));
document.querySelectorAll('[data-next]').forEach((a) => a.addEventListener('click', (e) => {
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  const y = target.getBoundingClientRect().top + window.scrollY;
  const focusTarget = () => { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); };
  if (reduce.matches) { window.scrollTo(0, y); focusTarget(); return; }
  const start = window.scrollY, dist = y - start, dur = 700; let t0 = null;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (ts) => { if (t0 === null) t0 = ts; const p = Math.min(1, (ts - t0) / dur); window.scrollTo(0, start + dist * ease(p)); if (p < 1) scrollAnim = requestAnimationFrame(step); else { scrollAnim = null; focusTarget(); } };
  stopScroll();
  setTimeout(() => { scrollAnim = requestAnimationFrame(step); }, 0);
}));

/* ---------- a new page always opens at the top (unless the link points to a section) ---------- */
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
if (!location.hash) window.scrollTo(0, 0);
window.addEventListener('pageshow', (e) => { if (e.persisted && !location.hash) window.scrollTo(0, 0); });

/* ---------- hero: waiting lists as a turning point cloud ---------- */
const canvas = document.querySelector('[data-cloud]');
if (canvas) {
  const field = canvas.closest('[data-loop]');
  const css = getComputedStyle(document.documentElement);
  const ctx = canvas.getContext('2d');
  const probe = document.createElement('canvas').getContext('2d');
  const rgb = (v) => { probe.fillStyle = '#000'; probe.fillStyle = v; probe.fillRect(0, 0, 1, 1); const d = probe.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; };
  const lo = rgb(css.getPropertyValue('--point-lo').trim());
  const hi = rgb(css.getPropertyValue('--point-hi').trim());
  const lime = rgb(css.getPropertyValue('--color-accent').trim());
  const paper = rgb(css.getPropertyValue('--color-paper').trim());

  // deterministic noise
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const hgt = (x, z) => 0.18 * Math.sin(x * 1.7 + 0.4) * Math.cos(z * 1.3) + 0.08 * Math.sin(x * 4.1 + z * 2.3) + 0.05 * Math.cos(z * 5.2 - x);

  const pts = []; // [x, y, z, kind] kind 0 ground, 1 column, 2 found column
  const GX = 150, GZ = 110;
  for (let i = 0; i < GX; i++) for (let j = 0; j < GZ; j++) {
    const x = (i / (GX - 1)) * 2 - 1 + (rnd() - 0.5) * 0.012, z = (j / (GZ - 1)) * 2 - 1 + (rnd() - 0.5) * 0.012;
    if (x * x * 0.9 + z * z > 1.05) continue;
    pts.push([x * 1.5, hgt(x, z), z * 1.2, 0]);
  }
  // hospitals: columns of points; their height is the length of the waiting list
  const sites = [[-0.95, -0.35, 1.25], [-0.45, 0.45, 0.95], [0.1, -0.55, 1.4], [0.55, 0.3, 0.75], [1.0, -0.2, 1.1], [-0.2, 0.05, 1.05], [0.35, 0.75, 0.45]];
  const found = 6;
  sites.forEach(([sx, sz, h], k) => {
    const base = hgt(sx / 1.5, sz / 1.2);
    const n = Math.round(h * 260);
    for (let m = 0; m < n; m++) {
      const a = rnd() * Math.PI * 2, r = 0.035 + rnd() * 0.035;
      pts.push([sx + Math.cos(a) * r, base + (m / n) * h * 0.55, sz + Math.sin(a) * r, k === found ? 2 : 1]);
    }
  });

  let W = 0, H = 0, DPR = 1, raf = null, t = 0, last = 0, running = false;
  const state = { seen: false, hover: false, focus: false, held: reduce.matches, hidden: document.hidden };
  function size() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    draw();
  }
  function draw() { paint(ctx, W, H, t, paper, null); }
  function paint(ctx, W, H, t, bg, place) {
    if (!W || !H) return;
    ctx.fillStyle = `rgb(${bg})`; ctx.fillRect(0, 0, W, H);
    const wide = W > 960;
    const xl = W >= 1440;
    const cx = place ? W * place[0] : wide ? W * 0.7 : W * 0.5, cy = place ? H * place[1] : wide ? H * (xl ? 0.4 : 0.34) : H * 0.24;
    const scale = place ? Math.min(W * place[2], H * 0.4) : Math.min(wide ? W * (xl ? 0.24 : 0.21) : W * 0.4, H * (wide ? 0.36 : 0.24));
    const rot = t * (Math.PI * 2) / 120 + 0.6; // one turn in two minutes
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const tilt = 0.62, ct = Math.cos(tilt), st = Math.sin(tilt);
    const sweep = ((t % 7) / 7) * 3.6 - 1.8; // passes every seven seconds
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const x = p[0] * cr - p[2] * sr, z0 = p[0] * sr + p[2] * cr;
      const y = p[1] * ct - z0 * st, z = p[1] * st + z0 * ct;
      const persp = 4.5 / (4.5 + z);
      const sx = cx + x * scale * persp, sy = cy - y * scale * persp;
      if (sx < -4 || sx > W + 4 || sy < -4 || sy > H + 4) continue;
      const depth = Math.max(0, Math.min(1, 0.5 - z * 0.35));
      const lift = Math.max(0, 1 - Math.abs(p[0] - sweep) * 7);
      let c;
      if (p[3] === 2) c = lime;
      else {
        const k = Math.min(1, (p[3] === 1 ? 0.55 : (p[1] + 0.25) * 1.2) + lift * 0.6);
        c = [lo[0] + (hi[0] - lo[0]) * k, lo[1] + (hi[1] - lo[1]) * k, lo[2] + (hi[2] - lo[2]) * k];
      }
      const alpha = p[3] === 2 ? 1 : 0.35 + 0.6 * depth;
      ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha.toFixed(3)})`;
      const s = (p[3] === 2 ? 2.2 : p[3] ? 1.7 : 1.4) * persp;
      ctx.fillRect(sx, sy, s, s);
    }
  }
  function frame(ts) {
    if (!last) last = ts;
    t += Math.min(0.05, (ts - last) / 1000); last = ts;
    draw();
    raf = running ? requestAnimationFrame(frame) : null;
  }
  function sync() {
    const run = state.seen && !state.hover && !state.focus && !state.held && !state.hidden;
    if (run && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    if (!run && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    field.classList.toggle('is-running', run);
  }
  new IntersectionObserver(([e]) => { state.seen = e.isIntersecting; sync(); }).observe(field);
  document.addEventListener('visibilitychange', () => { state.hidden = document.hidden; sync(); });
  reduce.addEventListener?.('change', () => { state.held = reduce.matches; if (reduce.matches) { t = 3.2; draw(); } sync(); });
  if (reduce.matches) t = 3.2; // one still frame, sweep stopped mid-scene
  const still = document.querySelector('[data-cloud-still]');
  const paper2 = rgb(css.getPropertyValue('--color-paper-2').trim());
  const sizeStill = () => {
    if (!still) return;
    const w = still.clientWidth, h = still.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
    still.width = Math.round(w * d); still.height = Math.round(h * d);
    const c2 = still.getContext('2d'); c2.setTransform(d, 0, 0, d, 0, 0);
    paint(c2, w, h, 24, paper2, w > 960 ? [0.74, 0.5, 0.22] : [0.5, 0.5, 0.42]);
  };
  window.addEventListener('resize', () => { size(); sizeStill(); });
  size();
  sizeStill();
  sync();
}

/* ---------- copy helper with a visible confirmation ---------- */
async function copyText(text, statusEl, okMsg) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.className = 'visually-hidden';
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    ta.remove();
  }
  if (statusEl) statusEl.textContent = ok ? okMsg : 'Copying is blocked here. Select the text and copy it by hand.';
  if (statusEl) setTimeout(() => { statusEl.textContent = ''; }, 4000);
}
document.querySelectorAll('[data-copy-email]').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.copyEmail, document.querySelector('[data-copy-email-status]'), 'Copied')));

/* ---------- every mailto link: never a blank page, always a visible fallback ---------- */
/* In an embedded preview (or a browser with no mail app) following a mailto link can leave a blank page.
   So inside a frame the link is not followed, and everywhere a small notice shows the address with a Copy button. */
(function mailNotice() {
  let box = null, timer = 0;
  function close() { if (box) { box.remove(); box = null; } clearTimeout(timer); }
  function show(address, followed) {
    close();
    box = document.createElement('div');
    box.className = 'mailnote'; box.setAttribute('role', 'status');
    const msg = document.createElement('p'); msg.className = 'mailnote__msg';
    msg.textContent = followed ? 'Opening your mail app. If nothing opens, copy the address:' : 'Your mail app cannot be opened from here. Copy the address:';
    const row = document.createElement('div'); row.className = 'mailnote__row';
    const addr = document.createElement('span'); addr.className = 'mailnote__addr'; addr.textContent = address;
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'mailnote__btn'; copy.textContent = 'Copy address';
    const done = document.createElement('button'); done.type = 'button'; done.className = 'mailnote__btn mailnote__btn--quiet'; done.textContent = 'Close';
    const st = document.createElement('span'); st.className = 'mailnote__status'; st.setAttribute('aria-live', 'polite');
    copy.addEventListener('click', async () => { await copyText(address, st, 'Copied'); });
    done.addEventListener('click', close);
    row.append(addr, copy, done);
    box.append(msg, row, st);
    document.body.appendChild(box);
    timer = setTimeout(close, 20000);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    const address = decodeURIComponent(a.getAttribute('href').slice(7).split('?')[0]);
    let framed = false;
    try { framed = window.self !== window.top; } catch (err) { framed = true; }
    if (framed) e.preventDefault();
    show(address, !framed);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

/* ---------- custom select ---------- */
document.querySelectorAll('[data-select]').forEach((sel) => {
  const btn = sel.querySelector('button'), list = sel.querySelector('[role="listbox"]'), input = sel.querySelector('input[type="hidden"]'), label = sel.querySelector('[data-select-value]');
  const opts = [...list.querySelectorAll('[role="option"]')];
  let active = -1;
  btn.setAttribute('data-empty', '');
  const setActive = (i) => { active = i; opts.forEach((o, k) => o.classList.toggle('is-active', k === i)); if (i >= 0) { list.setAttribute('aria-activedescendant', opts[i].id); opts[i].scrollIntoView({ block: 'nearest' }); } };
  const open = () => { list.hidden = false; btn.setAttribute('aria-expanded', 'true'); const s = opts.findIndex((o) => o.getAttribute('aria-selected') === 'true'); setActive(s >= 0 ? s : 0); list.focus({ preventScroll: true }); };
  const close = (focusBtn = true) => { if (list.hidden) return; list.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focusBtn) btn.focus({ preventScroll: true }); };
  const choose = (i) => {
    opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
    input.value = opts[i].dataset.value; label.textContent = opts[i].textContent; btn.removeAttribute('data-empty');
    btn.removeAttribute('aria-invalid'); const err = document.getElementById(btn.getAttribute('aria-describedby')); if (err) err.textContent = '';
    close();
  };
  btn.addEventListener('click', () => (list.hidden ? open() : close()));
  btn.addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); } });
  list.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(opts.length - 1, active + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, active - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(opts.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (active >= 0) choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') { close(false); }
  });
  opts.forEach((o, i) => { o.addEventListener('click', () => choose(i)); o.addEventListener('mousemove', () => setActive(i)); });
  document.addEventListener('click', (e) => { if (!sel.contains(e.target)) close(false); });
  window.addEventListener('resize', () => close(false));
  sel._reset = () => { opts.forEach((o) => o.setAttribute('aria-selected', 'false')); input.value = ''; label.textContent = label.dataset.placeholder; btn.setAttribute('data-empty', ''); };
  label.dataset.placeholder = label.textContent;
});

/* ---------- contact form: prepares an email, sends nothing itself ---------- */
const form = document.getElementById('contact-form');
if (form) {
  const to = form.dataset.mailto;
  const handoff = document.getElementById('handoff');
  const textEl = handoff.querySelector('[data-handoff-text]');
  const openBtn = handoff.querySelector('[data-open-mail]');
  const copyBtn = handoff.querySelector('[data-copy-text]');
  const status = handoff.querySelector('[data-copy-status]');
  const f = (n) => form.elements[n];
  const err = (el, msg) => {
    const target = el.type === 'hidden' ? el.closest('[data-select]').querySelector('button') : el;
    const box = document.getElementById(target.getAttribute('aria-describedby'));
    if (msg) target.setAttribute('aria-invalid', 'true'); else target.removeAttribute('aria-invalid');
    if (box) box.textContent = msg || '';
    return !msg;
  };
  const rules = {
    name: (v) => (v.trim().length < 2 ? 'Please write your name.' : ''),
    email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Write your email as name@example.com.' : ''),
    topic: (v) => (!v ? 'Please choose a topic.' : ''),
    message: (v) => (v.trim().length < 10 ? 'Please write a little more, at least 10 characters.' : ''),
  };
  ['name', 'email', 'message'].forEach((n) => f(n).addEventListener('blur', () => { if (f(n).value) err(f(n), rules[n](f(n).value)); }));
  ['name', 'email', 'message'].forEach((n) => f(n).addEventListener('input', () => { if (f(n).getAttribute('aria-invalid')) err(f(n), rules[n](f(n).value)); }));
  f('consent').addEventListener('change', () => err(f('consent'), f('consent').checked ? '' : 'Please agree so we can reply to you.'));
  let mailto = '', body = '';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let first = null;
    for (const n of ['name', 'email', 'topic', 'message']) { const ok = err(f(n), rules[n](f(n).value)); if (!ok && !first) first = f(n).type === 'hidden' ? form.querySelector('.select__button') : f(n); }
    const consentOk = err(f('consent'), f('consent').checked ? '' : 'Please agree so we can reply to you.');
    if (!consentOk && !first) first = f('consent');
    if (first) { first.focus(); return; }
    const subject = `${f('topic').value}: message from ${f('name').value.trim()}`;
    body = `${f('message').value.trim()}\n\n${f('name').value.trim()}\n${f('email').value.trim()}`;
    mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    textEl.textContent = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    openBtn.href = mailto;
    handoff.hidden = false;
    status.textContent = '';
    handoff.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
    handoff.focus({ preventScroll: true });
  });
  copyBtn.addEventListener('click', () => copyText(textEl.textContent, status, 'Copied. Paste it into a new email.'));
}
