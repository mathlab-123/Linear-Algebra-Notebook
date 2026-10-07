/* =====================================================================
   M3 Linear Algebra — Interactive Lab · Core runtime  (window.LA)
   Plain browser JavaScript. No build step, works from file:// and any host.
   ===================================================================== */
(function () {
  'use strict';
  const LA = (window.LA = {});
  let UID = 0;

  LA.PAGES = [
    { id: 'notebook', href: 'notebook.html', label: '🪐 Jupyter Notebook' },
    { id: 'home', href: 'index.html', label: 'Overview' },
    { id: 'm1', href: 'module1.html', label: '1 · Linear Systems', title: 'Module 1 · System of Linear Equations' },
    { id: 'm2', href: 'module2.html', label: '2 · Matrix Multiplication', title: 'Module 2 · Matrix Multiplication' },
    { id: 'm3', href: 'module3.html', label: '3 · Vectors & Span', title: 'Module 3 · Vectors and their Properties' },
  ];

  // Shared colour palette (mirrors the notebook's colours)
  LA.C = {
    blue: '#2563EB', navy: '#1E3A8A', red: '#DC2626', crimson: '#E63946', steel: '#457B9D', green: '#16A34A',
    emerald: '#059669', teal: '#0D9488', orange: '#EA580C', amber: '#D97706', yellow: '#FBBF24', gold: '#F59E0B',
    purple: '#7C3AED', violet: '#8B5CF6', pink: '#DB2777', rose: '#F43F5E', sky: '#38BDF8', cyan: '#00D2FF',
    slate: '#64748B', ink: '#0F172A', grid: '#E2E8F0', axis: '#0F172A',
  };

  /* ------------------------------------------------------------------ */
  /* DOM helpers                                                          */
  /* ------------------------------------------------------------------ */
  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return e;
  }
  LA.el = el;
  LA.$ = (s, r = document) => r.querySelector(s);
  LA.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  LA.clamp = clamp;

  /* ------------------------------------------------------------------ */
  /* Number formatting                                                    */
  /* ------------------------------------------------------------------ */
  LA.fmt = function (x, d = 2) {
    if (x == null || !isFinite(x)) return '—';
    let s = (Math.abs(x) < 0.5 * Math.pow(10, -d) ? 0 : x).toFixed(d);
    if (s.indexOf('-0') === 0 && parseFloat(s) === 0) s = s.slice(1);
    return s;
  };
  // "general" format: up to 3 decimals, trailing zeros trimmed (like Python's :g)
  LA.g = function (x, d = 3) {
    if (x == null || !isFinite(x)) return '—';
    const v = parseFloat((Math.abs(x) < 1e-9 ? 0 : x).toFixed(d));
    return String(Object.is(v, -0) ? 0 : v);
  };
  // Python-style float repr for small demos: 3.0, -2.0, 0.5
  LA.pyf = function (x) {
    const s = LA.g(x, 4);
    return s.indexOf('.') >= 0 || s.indexOf('e') >= 0 ? s : s + '.0';
  };
  LA.decimalsOf = function (step) {
    const s = String(step);
    const i = s.indexOf('.');
    return i < 0 ? 0 : s.length - i - 1;
  };

  /* ------------------------------------------------------------------ */
  /* KaTeX helpers                                                        */
  /* ------------------------------------------------------------------ */
  LA.tex = function (s, display) {
    if (!window.katex) return s;
    try { return katex.renderToString(s, { displayMode: !!display, throwOnError: false, strict: 'ignore' }); }
    catch (e) { return s; }
  };
  LA.renderMath = function (root) {
    if (!window.renderMathInElement) return;
    renderMathInElement(root || document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
      ],
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'input'],
      ignoredClasses: ['no-math', 'lab', 'codelab'],
      throwOnError: false,
      strict: 'ignore',
    });
  };
  // bmatrix helper: LA.bmat([[1,2],[3,4]]) or column vector LA.bmat([1,2])
  LA.bmat = function (M, f) {
    f = f || ((v) => (typeof v === 'number' ? LA.g(v) : v));
    const rows = Array.isArray(M[0]) ? M : M.map((v) => [v]);
    return '\\begin{bmatrix}' + rows.map((r) => r.map(f).join(' & ')).join(' \\\\ ') + '\\end{bmatrix}';
  };

  /* ------------------------------------------------------------------ */
  /* Controls                                                             */
  /* ------------------------------------------------------------------ */
  // Slider with live, editable numeric readout
  LA.slider = function (o) {
    const id = 'la-sl-' + ++UID;
    const dec = o.decimals != null ? o.decimals : LA.decimalsOf(o.step);
    const input = el('input', { type: 'range', id, min: o.min, max: o.max, step: o.step, value: o.value, 'aria-label': (o.label || '').replace(/<[^>]+>/g, '') });
    const num = el('input', { type: 'number', class: 'ctrl-num', min: o.min, max: o.max, step: o.step, value: Number(o.value).toFixed(dec) });
    const wrap = el('div', { class: 'ctrl ctrl-slider' }, el('label', { class: 'ctrl-label', for: id, html: o.label || '' }), el('div', { class: 'ctrl-row' }, input, num));
    if (o.color) wrap.style.setProperty('--accent', o.color);
    if (o.width) wrap.style.maxWidth = o.width;
    const api = {
      el: wrap, input, onInput: o.onInput,
      get value() { return parseFloat(input.value); },
      set(v, silent) {
        v = clamp(Number(v), parseFloat(input.min), parseFloat(input.max));
        input.value = v; num.value = Number(input.value).toFixed(dec); paint();
        if (!silent && api.onInput) api.onInput(api.value);
      },
      setRange(min, max, step, value) {
        input.min = min; input.max = max; input.step = step; num.min = min; num.max = max; num.step = step;
        api.set(value, true);
      },
      setLabel(html) { wrap.querySelector('.ctrl-label').innerHTML = html; },
    };
    function paint() {
      const mn = parseFloat(input.min), mx = parseFloat(input.max);
      input.style.setProperty('--p', ((parseFloat(input.value) - mn) / (mx - mn)) * 100 + '%');
    }
    input.addEventListener('input', () => { num.value = Number(input.value).toFixed(dec); paint(); api.onInput && api.onInput(api.value); });
    num.addEventListener('change', () => {
      let v = parseFloat(num.value);
      if (isNaN(v)) v = api.value;
      api.set(v);
    });
    paint();
    return api;
  };

  // Free numeric entry (like ipywidgets.FloatText)
  LA.num = function (o) {
    const id = 'la-num-' + ++UID;
    const input = el('input', { type: 'number', id, step: o.step || 'any', value: o.value });
    if (o.width) input.style.width = o.width;
    const wrap = el('div', { class: 'num-input' }, o.label ? el('label', { for: id, html: o.label }) : null, input);
    const api = {
      el: wrap, input, onInput: o.onInput,
      get value() { const v = parseFloat(input.value); return isNaN(v) ? 0 : v; },
      set(v, silent) { input.value = v; if (!silent && api.onInput) api.onInput(api.value); },
    };
    input.addEventListener('input', () => api.onInput && api.onInput(api.value));
    return api;
  };

  // Segmented buttons (radio-like). options: ['A','B'] or [{value,label}]
  LA.seg = function (o) {
    const opts = o.options.map((x) => (typeof x === 'object' ? x : { value: x, label: x }));
    const wrap = el('div', { class: 'ctrl' });
    if (o.label) wrap.append(el('span', { class: 'ctrl-label', html: o.label }));
    const bar = el('div', { class: 'seg' + (o.vertical ? ' vertical' : ''), role: 'radiogroup' });
    wrap.append(bar);
    let value = o.value != null ? o.value : opts[0].value;
    const btns = opts.map((op) => {
      const b = el('button', { type: 'button', role: 'radio', html: op.label });
      b.addEventListener('click', () => api.set(op.value));
      bar.append(b);
      return { b, v: op.value };
    });
    function paint() { btns.forEach(({ b, v }) => { b.classList.toggle('on', v === value); b.setAttribute('aria-checked', v === value); }); }
    const api = {
      el: wrap, onChange: o.onChange,
      get value() { return value; },
      set(v, silent) { value = v; paint(); if (!silent && api.onChange) api.onChange(v); },
    };
    paint();
    return api;
  };

  LA.select = function (o) {
    const opts = o.options.map((x) => (typeof x === 'object' ? x : { value: x, label: x }));
    const id = 'la-sel-' + ++UID;
    const sel = el('select', { id }, opts.map((op) => el('option', { value: op.value, text: op.label })));
    sel.value = o.value != null ? o.value : opts[0].value;
    if (o.width) sel.style.width = o.width;
    const wrap = el('div', { class: 'ctrl' }, o.label ? el('label', { class: 'ctrl-label', for: id, html: o.label }) : null, sel);
    const api = {
      el: wrap, onChange: o.onChange,
      get value() { return sel.value; },
      set(v, silent) { sel.value = v; if (!silent && api.onChange) api.onChange(sel.value); },
    };
    sel.addEventListener('change', () => api.onChange && api.onChange(sel.value));
    return api;
  };

  LA.toggle = function (o) {
    const input = el('input', { type: 'checkbox' });
    input.checked = !!o.value;
    const wrap = el('label', { class: 'toggle' }, input, o.color ? el('span', { class: 'sw' }) : null, el('span', { html: o.label }));
    if (o.color) wrap.style.setProperty('--c', o.color);
    const api = {
      el: wrap, onChange: o.onChange,
      get value() { return input.checked; },
      set(v, silent) { input.checked = !!v; if (!silent && api.onChange) api.onChange(input.checked); },
    };
    input.addEventListener('change', () => api.onChange && api.onChange(input.checked));
    return api;
  };

  LA.btn = function (label, onClick, variant) {
    const b = el('button', { type: 'button', class: 'btn ' + (variant || ''), html: label });
    if (onClick) b.addEventListener('click', onClick);
    return b;
  };

  LA.group = function (label, ...children) {
    return el('div', { class: 'group' }, label ? el('div', { class: 'group-label', html: label }) : null, ...children);
  };

  LA.setStatus = function (target, kind, html, celebrate) {
    const prevKind = target.dataset.kind;
    target.innerHTML = '';
    const box = el('div', { class: 'status ' + kind, html });
    if (celebrate && prevKind !== kind) box.classList.add('celebrate');
    target.append(box);
    target.dataset.kind = kind;
  };

  /* ------------------------------------------------------------------ */
  /* Lab frame                                                            */
  /* ------------------------------------------------------------------ */
  LA.lab = function (target, o) {
    const root = typeof target === 'string' ? LA.$(target) : target;
    if (!root) throw new Error('Lab mount not found: ' + target);
    root.classList.add('lab');
    root.innerHTML = '';
    const tools = el('div', { class: 'lab-tools' });
    const head = el('div', { class: 'lab-head' },
      el('div', { class: 'lab-title' },
        el('span', { class: 'lab-icon', text: o.icon || '🧪' }),
        el('div', {}, el('div', { class: 'lab-kicker', text: o.kicker || 'Interactive Lab' }), el('h4', { html: o.title || '' }))),
      tools);
    const controls = el('div', { class: 'lab-controls' });
    const status = el('div', { class: 'lab-status' });
    const stage = el('div', { class: 'lab-stage' + (o.cols ? ' cols-' + o.cols : '') });
    const foot = el('div', { class: 'lab-foot' });
    const body = el('div', { class: 'lab-body' }, controls, status, stage, foot);
    root.append(head, body);
    if (o.onReset) tools.append(LA.btn('↺ Reset', o.onReset, 'ghost small'));
    if (o.cell != null) {
      const cellLink = el('a', {
        href: 'notebook.html#cell-' + o.cell,
        class: 'btn ghost small',
        target: '_blank',
        title: 'Open this exact code cell in the raw Jupyter Notebook showcase'
      }, '🪐 Cell [' + o.cell + ']');
      tools.append(cellLink);
    }
    const focusBtn = LA.btn('⛶ Focus', () => LA.toggleFocus(root, focusBtn), 'ghost small');
    focusBtn.title = 'Expand this lab to full screen (great for projectors). Press Esc to exit.';
    tools.append(focusBtn);
    return { root, head, body, controls, status, stage, foot, tools };
  };

  LA.toggleFocus = function (root, btn) {
    const on = !root.classList.contains('lab-focus');
    LA.$$('.lab.lab-focus').forEach((x) => x.classList.remove('lab-focus'));
    root.classList.toggle('lab-focus', on);
    document.body.classList.toggle('has-focus', on);
    if (btn) btn.innerHTML = on ? '✕ Exit focus' : '⛶ Focus';
    LA.$$('.lab-tools .btn', root).forEach((b) => { if (/Focus|Exit/.test(b.textContent)) b.innerHTML = on ? '✕ Exit focus' : '⛶ Focus'; });
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      LA.$$('.plot3d', root).forEach((d) => { if (window.Plotly && d.data) Plotly.Plots.resize(d); });
    }, 60);
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const f = LA.$('.lab.lab-focus');
      if (f) LA.toggleFocus(f);
    }
  });

  /* ------------------------------------------------------------------ */
  /* Plot2D — lightweight canvas plotting with draggable handles          */
  /* ------------------------------------------------------------------ */
  function niceStep(range, target) {
    const raw = range / target;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }

  class Plot2D {
    constructor(parent, o) {
      this.o = Object.assign({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, equal: false, height: 420, pad: null, bg: '#ffffff' }, o || {});
      this.view = { xmin: this.o.xmin, xmax: this.o.xmax, ymin: this.o.ymin, ymax: this.o.ymax };
      this.wrap = el('div', { class: 'plot2d' });
      if (this.o.height) this.wrap.style.height = this.o.height + 'px';
      this.canvas = el('canvas');
      this.wrap.append(this.canvas);
      (typeof parent === 'string' ? LA.$(parent) : parent).append(this.wrap);
      this.ctx = this.canvas.getContext('2d');
      this.handles = [];
      this.drawFn = null;
      this.drag = null;
      this.W = 0; this.H = 0;
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(this.wrap);
      this._bindPointer();
    }
    setView(v) { Object.assign(this.view, v); this.draw(); }
    resize() {
      const w = this.wrap.clientWidth, h = this.wrap.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.W = w; this.H = h;
      this.draw();
    }
    _layout() {
      const small = this.W < 480;
      const hasTitle = Boolean(this.o.title || this._hasTitle);
      const pad = this.o.pad || { l: small ? 34 : 44, r: 12, t: hasTitle ? 44 : 14, b: small ? 28 : 34 };
      this.pad = pad;
      const pw = this.W - pad.l - pad.r, ph = this.H - pad.t - pad.b;
      let { xmin, xmax, ymin, ymax } = this.view;
      if (this.o.equal) {
        const sx = pw / (xmax - xmin), sy = ph / (ymax - ymin);
        const s = Math.min(sx, sy);
        const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
        const hw = pw / s / 2, hh = ph / s / 2;
        xmin = cx - hw; xmax = cx + hw; ymin = cy - hh; ymax = cy + hh;
      }
      this.v = { xmin, xmax, ymin, ymax };
      this.pa = { x: pad.l, y: pad.t, w: pw, h: ph };
    }
    X(x) { return this.pa.x + ((x - this.v.xmin) / (this.v.xmax - this.v.xmin)) * this.pa.w; }
    Y(y) { return this.pa.y + this.pa.h - ((y - this.v.ymin) / (this.v.ymax - this.v.ymin)) * this.pa.h; }
    invX(px) { return this.v.xmin + ((px - this.pa.x) / this.pa.w) * (this.v.xmax - this.v.xmin); }
    invY(py) { return this.v.ymin + ((this.pa.y + this.pa.h - py) / this.pa.h) * (this.v.ymax - this.v.ymin); }
    render(fn) { this.drawFn = fn; this.draw(); return this; }
    draw() {
      if (!this.W) return;
      this._layout();
      const c = this.ctx;
      c.save();
      c.clearRect(0, 0, this.W, this.H);
      c.fillStyle = this.o.bg; c.fillRect(0, 0, this.W, this.H);
      c.restore();
      if (this.drawFn) {
        try { this.drawFn(this); } catch (e) { console.error(e); }
      }
      this._drawHandles();
    }
    // --- frame: grid, axes, ticks, labels, title
    frame(o) {
      o = Object.assign({ grid: true, axes: true, ticks: true, dashGrid: true }, o || {});
      if (o.title && !this._hasTitle) {
        this._hasTitle = true;
        this._layout();
      }
      const c = this.ctx, { xmin, xmax, ymin, ymax } = this.v, pa = this.pa;
      const isDark = document.body.classList.contains('dark-mode');
      c.save();
      c.beginPath(); c.rect(pa.x, pa.y, pa.w, pa.h); c.clip();
      const sx = o.xstep || niceStep(xmax - xmin, this.W < 480 ? 6 : 10);
      const sy = o.ystep || niceStep(ymax - ymin, this.H < 300 ? 5 : 8);
      if (o.grid) {
        c.strokeStyle = isDark ? '#334155' : '#e5e9f0'; c.lineWidth = 1;
        if (o.dashGrid) c.setLineDash([4, 4]);
        c.beginPath();
        for (let x = Math.ceil(xmin / sx) * sx; x <= xmax + 1e-9; x += sx) { const px = Math.round(this.X(x)) + 0.5; c.moveTo(px, pa.y); c.lineTo(px, pa.y + pa.h); }
        for (let y = Math.ceil(ymin / sy) * sy; y <= ymax + 1e-9; y += sy) { const py = Math.round(this.Y(y)) + 0.5; c.moveTo(pa.x, py); c.lineTo(pa.x + pa.w, py); }
        c.stroke(); c.setLineDash([]);
      }
      if (o.axes) {
        c.strokeStyle = isDark ? '#94a3b8' : '#0f172a'; c.lineWidth = 1.3;
        c.beginPath();
        if (ymin <= 0 && ymax >= 0) { c.moveTo(pa.x, this.Y(0)); c.lineTo(pa.x + pa.w, this.Y(0)); }
        if (xmin <= 0 && xmax >= 0) { c.moveTo(this.X(0), pa.y); c.lineTo(this.X(0), pa.y + pa.h); }
        c.stroke();
      }
      c.restore();
      // border
      c.save(); c.strokeStyle = isDark ? '#334155' : '#cbd5e1'; c.lineWidth = 1; c.strokeRect(pa.x + 0.5, pa.y + 0.5, pa.w - 1, pa.h - 1); c.restore();
      // ticks
      if (o.ticks) {
        c.save(); c.fillStyle = isDark ? '#94a3b8' : '#64748b'; c.font = '600 11px ' + getFont(); c.textAlign = 'center'; c.textBaseline = 'top';
        if (o.xticks) {
          o.xticks.forEach((t) => { c.save(); c.font = '700 12px ' + getFont(); c.fillStyle = isDark ? '#cbd5e1' : '#334155'; wrapText(c, t.label, this.X(t.v), pa.y + pa.h + 6, 13); c.restore(); });
        } else {
          for (let x = Math.ceil(xmin / sx) * sx; x <= xmax + 1e-9; x += sx) c.fillText(LA.g(x, 2), this.X(x), pa.y + pa.h + 6);
        }
        c.textAlign = 'right'; c.textBaseline = 'middle';
        for (let y = Math.ceil(ymin / sy) * sy; y <= ymax + 1e-9; y += sy) c.fillText(LA.g(y, 2), pa.x - 6, this.Y(y));
        c.restore();
      }
      if (o.xlabel) { c.save(); c.fillStyle = isDark ? '#94a3b8' : '#475569'; c.font = '700 11.5px ' + getFont(); c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText(o.xlabel, pa.x + pa.w - 4, pa.y + pa.h + 26); c.restore(); }
      const title = o.title || this.o.title;
      if (o.ylabel) {
        c.save();
        c.font = '700 11px ' + getFont();
        if (title) {
          c.textAlign = 'left';
          c.textBaseline = 'top';
          const m = c.measureText(o.ylabel);
          c.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)';
          c.strokeStyle = isDark ? '#334155' : '#cbd5e1';
          c.lineWidth = 1;
          roundRect(c, pa.x + 4, pa.y + 4, m.width + 10, 20, 4);
          c.fill(); c.stroke();
          c.fillStyle = isDark ? '#cbd5e1' : '#334155';
          c.fillText(o.ylabel, pa.x + 9, pa.y + 8);
        } else {
          c.fillStyle = isDark ? '#94a3b8' : '#475569';
          c.textAlign = 'left';
          c.textBaseline = 'bottom';
          c.fillText(o.ylabel, pa.x + 2, pa.y - 6);
        }
        c.restore();
      }
      if (title) {
        c.save();
        const th = 26, ty = 8;
        c.font = '800 12.5px ' + getFont();
        const tw = Math.min(c.measureText(title).width + 24, this.W - 16);
        const tx = (this.W - tw) / 2;
        c.fillStyle = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(241, 245, 249, 0.96)';
        c.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        c.lineWidth = 1;
        roundRect(c, tx, ty, tw, th, 13);
        c.fill();
        c.stroke();
        c.fillStyle = o.titleColor || (isDark ? '#f1f5f9' : '#0f172a');
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(fitText(c, title, tw - 12), this.W / 2, ty + th / 2);
        c.restore();
      }
    }
    _style(s, fallbackColor) {
      const c = this.ctx;
      c.strokeStyle = s.color || fallbackColor || '#0f172a';
      c.fillStyle = s.fill || s.color || fallbackColor || '#0f172a';
      c.lineWidth = s.width || 2.5;
      c.setLineDash(s.dash === true ? [8, 6] : s.dash === 'dot' ? [2, 5] : s.dash || []);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.globalAlpha = s.alpha != null ? s.alpha : 1;
    }
    clip(fn) { const c = this.ctx, pa = this.pa; c.save(); c.beginPath(); c.rect(pa.x, pa.y, pa.w, pa.h); c.clip(); fn(); c.restore(); }
    // infinite line a x + b y = c
    line(a, b, cc, s) {
      s = s || {};
      const { xmin, xmax, ymin, ymax } = this.v;
      let p, q;
      if (Math.abs(b) > 1e-9) { p = [xmin - 1, (cc - a * (xmin - 1)) / b]; q = [xmax + 1, (cc - a * (xmax + 1)) / b]; }
      else if (Math.abs(a) > 1e-9) { p = [cc / a, ymin - 1]; q = [cc / a, ymax + 1]; }
      else return;
      this.seg(p, q, s);
    }
    seg(p, q, s) { this.polyline([p, q], s); }
    polyline(pts, s) {
      s = s || {};
      this.clip(() => {
        const c = this.ctx; this._style(s);
        c.beginPath();
        let pen = false;
        for (const p of pts) {
          if (!p || !isFinite(p[0]) || !isFinite(p[1])) { pen = false; continue; }
          const X = this.X(p[0]), Y = this.Y(p[1]);
          if (!pen) { c.moveTo(X, Y); pen = true; } else c.lineTo(X, Y);
        }
        c.stroke();
      });
    }
    fn(f, s, n) {
      n = n || 400;
      const { xmin, xmax } = this.v, pts = [];
      for (let i = 0; i <= n; i++) { const x = xmin + ((xmax - xmin) * i) / n; const y = f(x); pts.push(isFinite(y) ? [x, y] : null); }
      this.polyline(pts, s);
    }
    poly(pts, s) {
      s = s || {};
      this.clip(() => {
        const c = this.ctx; this._style(s);
        c.beginPath();
        pts.forEach((p, i) => (i ? c.lineTo(this.X(p[0]), this.Y(p[1])) : c.moveTo(this.X(p[0]), this.Y(p[1]))));
        c.closePath();
        if (s.fill) { c.globalAlpha = s.fillAlpha != null ? s.fillAlpha : 1; c.fillStyle = s.fill; c.fill(); c.globalAlpha = 1; }
        if (s.stroke !== false && (s.color || s.stroke)) { c.strokeStyle = s.stroke || s.color; c.stroke(); }
      });
    }
    rect(x0, y0, x1, y1, s) { this.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], s); }
    arrow(p, q, s) {
      s = s || {};
      const c = this.ctx;
      const x0 = this.X(p[0]), y0 = this.Y(p[1]), x1 = this.X(q[0]), y1 = this.Y(q[1]);
      const L = Math.hypot(x1 - x0, y1 - y0);
      if (L < 0.5) return;
      const w = s.width || 3;
      const hl = Math.min(s.head || 10 + w * 1.6, L * 0.6), hw = hl * 0.55;
      const ux = (x1 - x0) / L, uy = (y1 - y0) / L;
      const bx = x1 - ux * hl, by = y1 - uy * hl;
      this.clip(() => {
        this._style(s);
        c.lineWidth = w;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(bx + ux * 1, by + uy * 1); c.stroke();
        c.setLineDash([]);
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(bx - uy * hw, by + ux * hw); c.lineTo(bx + uy * hw, by - ux * hw); c.closePath();
        c.fillStyle = s.color || '#0f172a'; c.fill();
      });
    }
    point(p, s) {
      s = s || {};
      const { xmin, xmax, ymin, ymax } = this.v;
      if (p[0] < xmin - 0.05 || p[0] > xmax + 0.05 || p[1] < ymin - 0.05 || p[1] > ymax + 0.05) return;
      const c = this.ctx, X = this.X(p[0]), Y = this.Y(p[1]);
      if (!isFinite(X) || !isFinite(Y)) return;
      const r = s.size || 6;
      this.clip(() => {
        c.save();
        c.globalAlpha = s.alpha != null ? s.alpha : 1;
        c.fillStyle = s.color || '#0f172a';
        c.strokeStyle = s.stroke || '#ffffff';
        c.lineWidth = s.strokeWidth || 1.8;
        c.setLineDash([]);
        c.beginPath();
        const shape = s.shape || 'circle';
        if (shape === 'circle') c.arc(X, Y, r, 0, Math.PI * 2);
        else if (shape === 'square') c.rect(X - r, Y - r, 2 * r, 2 * r);
        else if (shape === 'diamond') { c.moveTo(X, Y - r * 1.3); c.lineTo(X + r, Y); c.lineTo(X, Y + r * 1.3); c.lineTo(X - r, Y); c.closePath(); }
        else if (shape === 'star') {
          for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r * 1.25; c.lineTo(X + rr * Math.cos(a), Y + rr * Math.sin(a)); }
          c.closePath();
        } else if (shape === 'x') {
          c.lineWidth = s.lineWidth || 3.5; c.strokeStyle = s.color || '#0f172a'; c.lineCap = 'round';
          c.moveTo(X - r, Y - r); c.lineTo(X + r, Y + r); c.moveTo(X + r, Y - r); c.lineTo(X - r, Y + r); c.stroke();
          c.restore(); return;
        } else if (shape === 'ring') {
          c.arc(X, Y, r, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = s.color; c.stroke(); c.restore(); return;
        }
        c.fill();
        if (s.stroke !== false) c.stroke();
        c.restore();
      });
      if (s.label) {
        this.clip(() => {
          this.text(p, s.label, Object.assign({ dx: 10, dy: -10, color: s.labelColor || s.color, bold: true }, s.labelStyle || {}));
        });
      }
    }
    text(p, str, s) {
      s = s || {};
      const c = this.ctx;
      const X = this.X(p[0]) + (s.dx || 0), Y = this.Y(p[1]) + (s.dy || 0);
      if (Y < this.pa.y - 2 || Y > this.pa.y + this.pa.h + 20) return;
      const isDark = document.body.classList.contains('dark-mode');
      c.save();
      c.font = (s.bold === false ? '600 ' : '800 ') + (s.size || 11.5) + 'px ' + (s.mono ? getMono() : getFont());
      c.textAlign = s.align || 'left'; c.textBaseline = s.baseline || 'middle';
      if (s.bg !== false) {
        const m = c.measureText(str), w = m.width, h = (s.size || 11.5) + 6;
        let bx = X - 4; if (c.textAlign === 'center') bx = X - w / 2 - 4; else if (c.textAlign === 'right') bx = X - w - 4;
        let by = Y - h / 2; if (c.textBaseline === 'top') by = Y - 3; else if (c.textBaseline === 'bottom') by = Y - h + 3;
        c.fillStyle = s.bg || (isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)');
        c.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        c.lineWidth = 1;
        roundRect(c, bx, by, w + 8, h, 4);
        c.fill();
        c.stroke();
      }
      c.fillStyle = s.color || (isDark ? '#f8fafc' : '#0f172a');
      c.fillText(str, X, Y);
      c.restore();
    }
    // Legend: items [{label, color, kind:'line'|'dash'|'point'|'arrow'|'box', shape}]
    legend(items, pos) {
      const c = this.ctx, pa = this.pa;
      items = items.filter(Boolean);
      if (!items.length) return;
      const isDark = document.body.classList.contains('dark-mode');
      c.save();
      const fs = this.W < 480 ? 11 : 12;
      c.font = '650 ' + fs + 'px ' + getFont();
      const lh = fs + 9, sw = 26;
      let w = 0; items.forEach((it) => (w = Math.max(w, c.measureText(it.label).width)));
      w = Math.min(w + sw + 22, pa.w - 10);
      const h = items.length * lh + 10;
      pos = pos || 'tr';
      let x = pos.indexOf('l') >= 0 ? pa.x + 8 : pa.x + pa.w - w - 8;
      let y = pos.indexOf('b') >= 0 ? pa.y + pa.h - h - 8 : pa.y + 8;
      c.fillStyle = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
      c.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      c.lineWidth = 1.2;
      roundRect(c, x, y, w, h, 8); c.fill(); c.stroke();
      items.forEach((it, i) => {
        const cy = y + 5 + lh * i + lh / 2, cx = x + 8;
        c.strokeStyle = it.color; c.fillStyle = it.color; c.lineWidth = 3; c.setLineDash(it.kind === 'dash' ? [6, 4] : it.kind === 'dot' ? [2, 4] : []);
        if (it.kind === 'point') { c.setLineDash([]); drawMarker(c, cx + sw / 2, cy, it.shape || 'circle', 5.5, it.color); }
        else if (it.kind === 'box') { c.fillRect(cx + 4, cy - 6, sw - 8, 12); }
        else { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + sw, cy); c.stroke(); if (it.kind === 'arrow') { c.setLineDash([]); c.beginPath(); c.moveTo(cx + sw + 2, cy); c.lineTo(cx + sw - 6, cy - 5); c.lineTo(cx + sw - 6, cy + 5); c.fill(); } }
        c.setLineDash([]);
        c.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        c.textBaseline = 'middle'; c.textAlign = 'left';
        c.fillText(fitText(c, it.label, w - sw - 22), cx + sw + 8, cy);
      });
      c.restore();
    }
    // Vertical bar in data coordinates
    bar(x, y0, y1, width, s) { this.rect(x - width / 2, y0, x + width / 2, y1, Object.assign({ fill: s.color, stroke: s.stroke || '#0f172a', width: 1.2 }, s)); }
    // ---- draggable handles
    addHandle(h) { h.r = h.r || 11; this.handles.push(h); this.wrap.classList.add('has-handles'); return h; }
    _drawHandles() {
      const c = this.ctx;
      for (const h of this.handles) {
        if (h.visible && !h.visible()) continue;
        const [x, y] = h.get();
        const X = this.X(x), Y = this.Y(y);
        c.save();
        c.beginPath(); c.arc(X, Y, h.r, 0, Math.PI * 2);
        c.fillStyle = (h === this.drag || h === this.hover) ? hexA(h.color || '#4338ca', 0.28) : hexA(h.color || '#4338ca', 0.14);
        c.fill();
        c.lineWidth = 2; c.strokeStyle = h.color || '#4338ca'; c.setLineDash([3, 3]); c.stroke();
        c.restore();
      }
    }
    _hit(px, py) {
      let best = null, bd = 1e9;
      for (const h of this.handles) {
        if (h.visible && !h.visible()) continue;
        const [x, y] = h.get();
        const d = Math.hypot(this.X(x) - px, this.Y(y) - py);
        if (d < h.r + 8 && d < bd) { bd = d; best = h; }
      }
      return best;
    }
    _bindPointer() {
      const cv = this.canvas;
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('pointerdown', (e) => {
        if (!this.handles.length) return;
        const [px, py] = pos(e);
        const h = this._hit(px, py);
        if (h) { this.drag = h; cv.setPointerCapture(e.pointerId); e.preventDefault(); this._move(px, py); }
      });
      cv.addEventListener('pointermove', (e) => {
        if (!this.handles.length) return;
        const [px, py] = pos(e);
        if (this.drag) { this._move(px, py); e.preventDefault(); return; }
        const h = this._hit(px, py);
        if (h !== this.hover) { this.hover = h; cv.style.cursor = h ? 'grab' : 'default'; this.draw(); }
      });
      const end = () => { if (this.drag) { this.drag = null; this.draw(); } };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', end);
      cv.addEventListener('pointerleave', () => { if (!this.drag && this.hover) { this.hover = null; this.draw(); } });
    }
    _move(px, py) {
      const h = this.drag;
      let x = this.invX(px), y = this.invY(py);
      const snap = h.snap != null ? h.snap : 0.5;
      if (snap) { x = Math.round(x / snap) * snap; y = Math.round(y / snap) * snap; }
      if (h.bounds) { x = clamp(x, h.bounds[0], h.bounds[1]); y = clamp(y, h.bounds[2], h.bounds[3]); }
      x = parseFloat(x.toFixed(6)); y = parseFloat(y.toFixed(6));
      h.set(x, y);
    }
  }
  LA.Plot2D = Plot2D;

  function getFont() { return 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'; }
  function getMono() { return 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'; }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fitText(c, s, maxW) { if (c.measureText(s).width <= maxW) return s; while (s.length > 3 && c.measureText(s + '…').width > maxW) s = s.slice(0, -1); return s + '…'; }
  function wrapText(c, s, x, y, lh) { String(s).split('\n').forEach((line, i) => c.fillText(line, x, y + i * lh)); }
  function drawMarker(c, X, Y, shape, r, color) {
    c.save(); c.fillStyle = color; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath();
    if (shape === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r * 1.25; c.lineTo(X + rr * Math.cos(a), Y + rr * Math.sin(a)); } c.closePath(); c.fill(); }
    else if (shape === 'diamond') { c.moveTo(X, Y - r * 1.3); c.lineTo(X + r, Y); c.lineTo(X, Y + r * 1.3); c.lineTo(X - r, Y); c.closePath(); c.fill(); }
    else if (shape === 'square') { c.rect(X - r, Y - r, 2 * r, 2 * r); c.fill(); }
    else if (shape === 'x') { c.strokeStyle = color; c.lineWidth = 3; c.moveTo(X - r, Y - r); c.lineTo(X + r, Y + r); c.moveTo(X + r, Y - r); c.lineTo(X - r, Y + r); c.stroke(); }
    else { c.arc(X, Y, r, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  LA.hexA = hexA;

  /* ------------------------------------------------------------------ */
  /* Linear-algebra utilities (small dense matrices)                      */
  /* ------------------------------------------------------------------ */
  const M = (LA.M = {});
  M.isVec = (x) => !Array.isArray(x[0]);
  M.mul = function (A, B) {
    if (M.isVec(B)) return A.map((row) => row.reduce((s, a, j) => s + a * B[j], 0));
    const n = A.length, m = B[0].length, k = B.length;
    const C = [];
    for (let i = 0; i < n; i++) { C.push([]); for (let j = 0; j < m; j++) { let s = 0; for (let t = 0; t < k; t++) s += A[i][t] * B[t][j]; C[i].push(s); } }
    return C;
  };
  M.T = (A) => A[0].map((_, j) => A.map((r) => r[j]));
  M.eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  M.zeros = (n, m) => Array.from({ length: n }, () => Array(m == null ? n : m).fill(0));
  M.copy = (A) => A.map((r) => (Array.isArray(r) ? r.slice() : r));
  M.add = (a, b) => a.map((x, i) => x + b[i]);
  M.sub = (a, b) => a.map((x, i) => x - b[i]);
  M.scale = (a, s) => a.map((x) => x * s);
  M.dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  M.norm = (a) => Math.sqrt(M.dot(a, a));
  M.cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  M.det2 = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
  M.det3 = (A) => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
  M.col = (A, j) => A.map((r) => r[j]);
  M.hstack = (A, b) => A.map((r, i) => r.concat(Array.isArray(b[i]) ? b[i] : [b[i]]));
  M.colStack = (...cols) => cols[0].map((_, i) => cols.map((c) => c[i]));
  // rank via Gaussian elimination with partial pivoting (tolerance relative to max entry)
  M.rank = function (A, tol) {
    const R = M.copy(A), n = R.length, m = R[0].length;
    let mx = 0; R.forEach((r) => r.forEach((v) => (mx = Math.max(mx, Math.abs(v)))));
    tol = tol != null ? tol : Math.max(n, m) * 1e-10 * Math.max(1, mx);
    let rank = 0;
    for (let c = 0; c < m && rank < n; c++) {
      let p = rank; for (let i = rank + 1; i < n; i++) if (Math.abs(R[i][c]) > Math.abs(R[p][c])) p = i;
      if (Math.abs(R[p][c]) <= tol) continue;
      [R[rank], R[p]] = [R[p], R[rank]];
      for (let i = rank + 1; i < n; i++) { const f = R[i][c] / R[rank][c]; for (let j = c; j < m; j++) R[i][j] -= f * R[rank][j]; }
      rank++;
    }
    return rank;
  };
  // Solve square system; returns null if singular
  M.solve = function (A, b) {
    const n = A.length, R = M.hstack(A, b);
    for (let c = 0; c < n; c++) {
      let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(R[i][c]) > Math.abs(R[p][c])) p = i;
      if (Math.abs(R[p][c]) < 1e-12) return null;
      [R[c], R[p]] = [R[p], R[c]];
      for (let i = 0; i < n; i++) { if (i === c) continue; const f = R[i][c] / R[c][c]; for (let j = c; j <= n; j++) R[i][j] -= f * R[c][j]; }
    }
    return R.map((r, i) => r[n] / r[i]);
  };
  // Least squares (minimum-norm via tiny ridge) — mirrors numpy.linalg.lstsq for small systems
  M.lstsq = function (A, b) {
    const At = M.T(A), AtA = M.mul(At, A), Atb = M.mul(At, b);
    let tr = 0; AtA.forEach((r, i) => (tr += r[i]));
    const lam = 1e-11 * Math.max(1, tr);
    const reg = AtA.map((r, i) => r.map((v, j) => v + (i === j ? lam : 0)));
    const x = M.solve(reg, Atb) || Array(A[0].length).fill(0);
    const closest = M.mul(A, x);
    return { x, closest, gap: M.norm(M.sub(b, closest)) };
  };
  // Shift matrices used in the binary-image studio
  M.shiftUp = (n, k) => { const S = M.zeros(n); for (let i = 0; i < n - k; i++) S[i][i + k] = 1; return S; };
  M.shiftDown = (n, k) => { const S = M.zeros(n); for (let i = 0; i < n - k; i++) S[i + k][i] = 1; return S; };
  M.flip = (n) => { const S = M.zeros(n); for (let i = 0; i < n; i++) S[i][n - 1 - i] = 1; return S; };

  /* ------------------------------------------------------------------ */
  /* Plotly 3D helpers                                                    */
  /* ------------------------------------------------------------------ */
  LA.linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
  LA.solidScale = (color) => [[0, color], [1, color]];
  // Plane a x + b y + c z = d as a Plotly surface (same branching logic as the notebook)
  LA.planeSurface = function (a, b, c, d, o) {
    o = o || {};
    const R = o.range || 4, n = o.n || 20, g = LA.linspace(-R, R, n);
    let X = [], Y = [], Z = [];
    if (Math.abs(c) >= 1e-4) { for (const yy of g) { X.push(g.slice()); Y.push(g.map(() => yy)); Z.push(g.map((xx) => (d - a * xx - b * yy) / c)); } }
    else if (Math.abs(b) >= 1e-4) { for (const zz of g) { X.push(g.slice()); Z.push(g.map(() => zz)); Y.push(g.map((xx) => (d - a * xx) / b)); } }
    else if (Math.abs(a) >= 1e-4) { for (const zz of g) { Y.push(g.slice()); Z.push(g.map(() => zz)); X.push(g.map(() => d / a)); } }
    else return null;
    return { type: 'surface', x: X, y: Y, z: Z, name: o.name || 'Plane', showscale: false, opacity: o.opacity != null ? o.opacity : 0.6, colorscale: o.colorscale || LA.solidScale(o.color || '#3B82F6'), hoverinfo: 'name', showlegend: o.showlegend !== false, visible: o.visible != null ? o.visible : true };
  };
  // Surface from z = f(x, y)
  LA.zSurface = function (f, o) {
    o = o || {};
    const R = o.range || 3, n = o.n || 25, g = LA.linspace(-R, R, n);
    const X = [], Y = [], Z = [];
    for (const yy of g) { X.push(g.slice()); Y.push(g.map(() => yy)); Z.push(g.map((xx) => f(xx, yy))); }
    return { type: 'surface', x: X, y: Y, z: Z, name: o.name, showscale: false, opacity: o.opacity != null ? o.opacity : 0.7, colorscale: o.colorscale || LA.solidScale(o.color || '#3B82F6'), hoverinfo: 'name', showlegend: true, visible: o.visible != null ? o.visible : true };
  };
  LA.plot3d = function (div, traces, o) {
    o = o || {};
    const R = o.range;
    const ax = (t) => Object.assign({ title: { text: t }, backgroundcolor: '#f8fafc', gridcolor: '#dbe3ef', zerolinecolor: '#94a3b8', showbackground: true }, R ? { range: [-R, R] } : {});
    const layout = {
      margin: { l: 0, r: 0, t: o.title ? 40 : 4, b: 0 },
      paper_bgcolor: '#ffffff',
      font: { family: getFont(), size: 12, color: '#1e293b' },
      title: o.title ? { text: o.title, font: { size: 14, color: o.titleColor || '#0f172a' }, x: 0.02, xanchor: 'left' } : undefined,
      scene: Object.assign({ xaxis: ax('X'), yaxis: ax('Y'), zaxis: ax('Z'), aspectmode: 'cube', camera: { eye: o.eye || { x: 1.6, y: -1.6, z: 1.15 } } }, o.scene || {}),
      showlegend: o.showlegend !== false,
      legend: { x: 0.01, y: 0.99, bgcolor: 'rgba(255,255,255,0.85)', bordercolor: '#cbd5e1', borderwidth: 1, font: { size: 11.5 } },
      uirevision: o.uirevision || 'keep',
    };
    if (o.zrange) layout.scene.zaxis.range = o.zrange;
    if (!window.Plotly) { div.innerHTML = '<div class="status warn" style="margin:12px">3D engine failed to load. Please refresh the page.</div>'; return; }
    Plotly.react(div, traces.filter(Boolean), layout, { displaylogo: false, responsive: true, modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'] });
  };

  /* ------------------------------------------------------------------ */
  /* Persistent storage (progress, notes) — safe on file:// too           */
  /* ------------------------------------------------------------------ */
  const STORE_KEY = 'm3-la-lab-v1';
  function readStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { return {}; } }
  function writeStore(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* storage disabled */ } }
  LA.store = {
    get(k, d) { const s = readStore(); return k in s ? s[k] : d; },
    set(k, v) { const s = readStore(); s[k] = v; writeStore(s); },
  };
  LA.progress = {
    get(page) { return LA.store.get('prog:' + page, {}); },
    set(page, id, done) { const p = LA.progress.get(page); if (done) p[id] = 1; else delete p[id]; LA.store.set('prog:' + page, p); },
    setTotal(page, n) { LA.store.set('total:' + page, n); },
    summary(page) { const done = Object.keys(LA.progress.get(page)).length; const total = LA.store.get('total:' + page, 0); return { done, total }; },
  };

  /* ------------------------------------------------------------------ */
  /* Page chrome: top bar, table of contents, completion buttons          */
  /* ------------------------------------------------------------------ */
  function buildTopbar(page) {
    const isDark = document.body.classList.contains('dark-mode');
    const tools = el('div', { class: 'topbar-tools' },
      el('button', { class: 'topbar-btn', type: 'button', title: 'Interactive Linear Systems & Matrix Solver Sandbox', onclick: () => LA.openSandbox() },
        el('span', { text: '🧮 Sandbox' })),
      el('button', { class: 'topbar-btn', type: 'button', title: 'Linear Algebra Exam Formula Sheet', onclick: () => LA.openFormula() },
        el('span', { text: '📐 Formulas' })),
      el('button', { class: 'topbar-btn', type: 'button', title: 'Interactive 3D Review Flashcards', onclick: () => LA.openFlashcards() },
        el('span', { text: '🗂️ Flashcards' })),
      el('button', { class: 'topbar-btn', type: 'button', title: 'Search Concepts & Labs', onclick: () => LA.openSearch() },
        el('span', { text: '🔍' })),
      el('button', { class: 'topbar-btn', id: 'theme-btn', type: 'button', title: 'Toggle Dark / Light Mode', onclick: () => LA.toggleTheme() },
        el('span', { text: isDark ? '☀️' : '🌙' }))
    );

    const bar = el('header', { class: 'topbar' },
      el('button', { class: 'btn ghost toc-toggle', type: 'button', 'aria-label': 'Open contents', html: '☰', onclick: () => document.body.classList.toggle('toc-open') }),
      el('a', { class: 'brand', href: 'index.html' },
        el('span', { class: 'brand-mark', text: 'M3' }),
        el('span', { class: 'brand-text' }, el('b', { text: 'Linear Algebra Lab' }), el('span', { text: 'Newton School of Technology' }))),
      el('nav', { class: 'topnav' }, LA.PAGES.map((p) => el('a', { href: p.href, class: p.id === page ? 'active' : '', text: p.label }))),
      tools
    );
    document.body.prepend(bar);
    if (page === 'home') bar.querySelector('.toc-toggle').remove();
  }

  function buildToc(page) {
    const toc = LA.$('#toc');
    const chapters = LA.$$('section.chapter');
    if (!toc || !chapters.length) return;
    LA.progress.setTotal(page, chapters.length);
    const list = el('ol');
    const links = [];
    chapters.forEach((ch, i) => {
      if (!ch.id) ch.id = 'sec-' + (i + 1);
      const h = ch.querySelector('h2');
      const title = ch.dataset.title || (h ? h.textContent.replace(/^\d+\s*/, '') : 'Section ' + (i + 1));
      const a = el('a', { href: '#' + ch.id }, el('span', { class: 'dot', text: '✓' }), el('span', { text: title }));
      a.addEventListener('click', () => document.body.classList.remove('toc-open'));
      links.push({ a, ch });
      list.append(el('li', {}, a));
      // completion button
      const bar = el('div', { class: 'chapter-done-bar' });
      const b = LA.btn('', null, 'btn-done');
      const paint = () => {
        const done = !!LA.progress.get(page)[ch.id];
        b.classList.toggle('is-done', done);
        b.innerHTML = done ? '✓ Understood — nice work!' : '☐ Mark this section as understood';
        a.classList.toggle('done', done);
        updateBar();
      };
      b.addEventListener('click', () => { const done = !!LA.progress.get(page)[ch.id]; LA.progress.set(page, ch.id, !done); paint(); });
      bar.append(b);
      ch.append(bar);
      ch._paint = paint;
    });
    const pbar = el('div', { class: 'toc-progress' }, el('i'));
    const plabel = el('div', { class: 'toc-progress-label' });
    const meta = LA.PAGES.find((p) => p.id === page);
    toc.append(el('div', { class: 'toc-head', text: meta && meta.title ? meta.title : 'Contents' }), pbar, plabel, list);
    function updateBar() {
      const { done, total } = LA.progress.summary(page);
      pbar.firstChild.style.width = (total ? (100 * done) / total : 0) + '%';
      plabel.textContent = done + ' of ' + total + ' sections understood';
    }
    chapters.forEach((ch) => ch._paint());
    // scroll spy
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach(({ a, ch }) => a.classList.toggle('current', ch === en.target));
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    chapters.forEach((ch) => io.observe(ch));
  }

  function buildPonders(page) {
    LA.$$('.callout.ponder').forEach((box, i) => {
      const id = box.dataset.ponder || page + '-ponder-' + i;
      const key = 'note:' + id;
      const reveal = box.querySelector('.reveal');
      if (reveal) reveal.hidden = true;
      const ta = el('textarea', { placeholder: '✍️ Think first! Jot down your answer here before revealing… (saved on this device)' });
      ta.value = LA.store.get(key, '');
      const saved = el('span', { class: 'ponder-saved', text: 'Saved ✓' });
      let t;
      ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { LA.store.set(key, ta.value); saved.classList.add('show'); setTimeout(() => saved.classList.remove('show'), 1200); }, 400); });
      const row = el('div', { class: 'ponder-row' });
      if (reveal) {
        const label = reveal.dataset.label || 'Reveal insight';
        const b = LA.btn('💡 ' + label, () => { reveal.hidden = !reveal.hidden; b.innerHTML = reveal.hidden ? '💡 ' + label : '🙈 Hide'; }, 'warn small');
        row.append(b);
      }
      row.append(saved);
      const tools = el('div', { class: 'ponder-tools' }, ta, row);
      if (reveal) box.insertBefore(tools, reveal); else box.append(tools);
    });
  }

  function buildPager(page) {
    const mount = LA.$('#pager');
    if (!mount) return;
    const idx = LA.PAGES.findIndex((p) => p.id === page);
    const prev = LA.PAGES[idx - 1], next = LA.PAGES[idx + 1];
    mount.className = 'pager';
    if (prev) mount.append(el('a', { href: prev.href }, el('small', { text: '← Previous' }), el('b', { text: prev.title || 'Home' })));
    else mount.append(el('span'));
    if (next) mount.append(el('a', { class: 'next', href: next.href }, el('small', { text: 'Next →' }), el('b', { text: next.title })));
    else mount.append(el('a', { class: 'next', href: 'index.html' }, el('small', { text: 'Finished! →' }), el('b', { text: 'Back to course home' })));
  }

  /* ------------------------------------------------------------------ */
  /* Code lab: fill-in-the-blank Python, executed by a JS "simulator"     */
  /* ------------------------------------------------------------------ */
  // Template uses [[id]] for blanks. answers: { id: ['accepted', ...] }  (whitespace-insensitive)
  // run(vals, ok) -> array of output lines: strings or {t:'ok'|'err'|'dim', s:'...'}
  LA.codeLab = function (mount, o) {
    const root = typeof mount === 'string' ? LA.$(mount) : mount;
    root.className = 'codelab';
    root.innerHTML = '';
    root.append(el('div', { class: 'codelab-head' },
      el('div', { class: 'k', text: o.kicker || '🐍 Python Code Lab · Fill in the blanks' }),
      el('h4', { html: o.title }), o.intro ? el('p', { html: o.intro }) : null));
    const pre = el('pre', { class: 'code' });
    const inputs = {};
    const parts = o.code.split(/(\[\[[a-zA-Z0-9_]+\]\])/);
    parts.forEach((part) => {
      const m = part.match(/^\[\[([a-zA-Z0-9_]+)\]\]$/);
      if (m) {
        const id = m[1];
        const sz = Math.max(3, ...(o.answers[id] || ['...']).map((s) => s.length)) + 1;
        const inp = el('input', { class: 'blank', 'data-id': id, size: sz, placeholder: '...', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off' });
        inp.style.width = sz + 1 + 'ch';
        inputs[id] = inp;
        inp.addEventListener('input', () => inp.classList.remove('ok', 'bad'));
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
        pre.append(inp);
      } else {
        const span = el('span');
        span.innerHTML = highlightPy(part);
        pre.append(span);
      }
    });
    const out = el('pre', { class: 'codelab-out' });
    out.innerHTML = '<span class="dim"># Fill every yellow box, then press ▶ Run (or hit Enter inside a box).</span>';
    const norm = (s) => String(s).replace(/\s+/g, '').replace(/"/g, "'");
    function check() {
      const vals = {}, ok = {};
      let all = true;
      for (const id in inputs) {
        vals[id] = inputs[id].value.trim();
        ok[id] = (o.answers[id] || []).some((a) => norm(a) === norm(vals[id]));
        if (!ok[id]) all = false;
      }
      return { vals, ok, all };
    }
    function run() {
      const { vals, ok, all } = check();
      for (const id in inputs) { inputs[id].classList.toggle('ok', ok[id]); inputs[id].classList.toggle('bad', !ok[id] && !!vals[id]); }
      const empty = Object.keys(inputs).filter((id) => !vals[id]);
      let lines;
      if (empty.length) lines = [{ t: 'err', s: '  File "<cell>", line ?\nSyntaxError: invalid syntax — ' + empty.length + ' blank(s) still contain "..."' }];
      else lines = o.run(vals, ok, all);
      out.innerHTML = '<span class="dim">&gt;&gt;&gt; run</span>\n' + lines.map((l) => (typeof l === 'string' ? esc(l) : '<span class="' + l.t + '">' + esc(l.s) + '</span>')).join('\n');
      if (all && !empty.length) LA.store.set('code:' + (o.id || o.title), 1);
    }
    let hintIdx = 0;
    const ids = Object.keys(inputs);
    const bar = el('div', { class: 'codelab-bar' },
      LA.btn('▶ Run', run, 'success'),
      LA.btn('💡 Hint', () => {
        const { ok } = check();
        const next = ids.find((id) => !ok[id]);
        if (!next) { out.innerHTML = '<span class="ok">All blanks are already correct — press ▶ Run!</span>'; return; }
        inputs[next].focus();
        const h = (o.hints && o.hints[next]) || 'Look at the comment just above this line.';
        out.innerHTML = '<span class="dim"># Hint for the highlighted box:</span>\n' + esc(h);
        hintIdx++;
      }, 'small'),
      LA.btn('Show solution', () => { ids.forEach((id) => { inputs[id].value = o.answers[id][0]; }); run(); }, 'ghost small'),
      LA.btn('Clear', () => { ids.forEach((id) => { inputs[id].value = ''; inputs[id].classList.remove('ok', 'bad'); }); out.innerHTML = '<span class="dim"># Cleared.</span>'; }, 'ghost small'));
    root.append(pre, bar, out);
    return { run, inputs };
  };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function highlightPy(src) {
    const KW = /\b(import|as|from|def|return|if|else|elif|for|in|while|print|and|or|not|True|False|None|abs|class|try|except|finally|with|lambda|yield|pass|raise|global|assert|break|continue)\b/g;
    const LIBS = /\b(np\.[a-zA-Z_.]+|plt\.[a-zA-Z_.]+|sp\.[a-zA-Z_.]+|go\.[a-zA-Z_.]+|widgets\.[a-zA-Z_.]+|display|HTML|clear_output|interact)\b/g;

    return src.split('\n').map((line) => {
      const ci = line.indexOf('#');
      let code = ci >= 0 ? line.slice(0, ci) : line;
      const com = ci >= 0 ? line.slice(ci) : '';

      code = esc(code)
        .replace(/(f?"""[\s\S]*?"""|f?'''[\s\S]*?'''|f?"[^"]*"|f?'[^']*')/g, '\u0001s$1\u0002')
        .replace(/\b(\d+\.?\d*)\b/g, '\u0001n$1\u0002')
        .replace(KW, '\u0001k$1\u0002')
        .replace(LIBS, '\u0001f$1\u0002');

      let outS = '', depth = 0;
      for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        if (ch === '\u0001') {
          const cls = code[i + 1];
          i++;
          if (depth === 0) outS += '<span class="' + cls + '">';
          depth++;
        } else if (ch === '\u0002') {
          depth--;
          if (depth === 0) outS += '</span>';
        } else {
          outS += ch;
        }
      }

      let comS = '';
      if (com) {
        if (com.startsWith('#@title')) {
          comS = '<span class="dec">' + esc(com) + '</span>';
        } else {
          comS = '<span class="c">' + esc(com) + '</span>';
        }
      }
      return outS + comS;
    }).join('\n');
  }
  LA.highlightPy = highlightPy;

  /* ------------------------------------------------------------------ */
  /* Self-check quiz                                                      */
  /* ------------------------------------------------------------------ */
  // questions: [{q, options:[...], answer: idx | [idx...], explain}] or {q, type:'number', answer, tol, explain}
  LA.quiz = function (mount, o) {
    const root = typeof mount === 'string' ? LA.$(mount) : mount;
    root.className = 'quiz';
    root.innerHTML = '';
    const score = el('span', { class: 'quiz-score' });
    root.append(el('div', { class: 'quiz-head' }, el('h4', { html: o.title || '✅ Quick Self-Check' }), score));
    const state = o.questions.map(() => false);
    const paintScore = () => (score.textContent = state.filter(Boolean).length + ' / ' + o.questions.length + ' correct');
    o.questions.forEach((q, qi) => {
      const box = el('div', { class: 'quiz-q' });
      box.append(el('div', { class: 'qtext' }, el('span', { class: 'qnum', text: qi + 1 }), el('span', { html: q.q })));
      const fb = el('div', { class: 'quiz-fb' });
      const multi = Array.isArray(q.answer);
      if (q.type === 'number') {
        const inp = el('input', { type: 'number', step: 'any', placeholder: 'Your answer' });
        const go = () => {
          const v = parseFloat(inp.value);
          const ok = !isNaN(v) && Math.abs(v - q.answer) <= (q.tol || 1e-6);
          state[qi] = ok; paintScore();
          LA.setStatus(fb, ok ? 'good' : 'bad', (ok ? '<b>Correct!</b> ' : '<b>Not quite.</b> ') + (ok || q.revealOnWrong ? q.explain || '' : q.hint || 'Try again — re-read the question carefully.'));
          fb.classList.add('show'); LA.renderMath(fb);
        };
        inp.addEventListener('keydown', (e) => e.key === 'Enter' && go());
        box.append(el('div', { class: 'quiz-num' }, inp, LA.btn('Check', go, 'primary small'), LA.btn('Show answer', () => { inp.value = q.answer; go(); }, 'ghost small')));
      } else {
        const sel = new Set();
        const opts = el('div', { class: 'quiz-opts' });
        const btns = q.options.map((t, i) => {
          const b = el('button', { type: 'button', class: 'quiz-opt' }, el('span', { class: 'box' }), el('span', { html: t }));
          b.addEventListener('click', () => {
            if (multi) { sel.has(i) ? sel.delete(i) : sel.add(i); } else { sel.clear(); sel.add(i); }
            btns.forEach((bb, j) => { bb.classList.toggle('sel', sel.has(j)); bb.classList.remove('right', 'wrong'); });
            fb.classList.remove('show');
            if (!multi) check();
          });
          opts.append(b);
          return b;
        });
        const check = () => {
          const ans = new Set(multi ? q.answer : [q.answer]);
          const ok = sel.size === ans.size && [...sel].every((i) => ans.has(i));
          state[qi] = ok; paintScore();
          btns.forEach((b, j) => { b.classList.remove('right', 'wrong'); if (sel.has(j)) b.classList.add(ans.has(j) ? 'right' : 'wrong'); });
          LA.setStatus(fb, ok ? 'good' : 'bad', (ok ? '<b>Correct!</b> ' : '<b>Not quite.</b> ') + (ok ? q.explain || '' : q.hint || 'Have another go!'));
          fb.classList.add('show'); LA.renderMath(fb);
        };
        box.append(opts);
        if (multi) box.append(el('div', { class: 'quiz-actions' }, el('span', { class: 'muted', style: { fontSize: '13px', alignSelf: 'center' }, text: 'Select all that apply →' }), LA.btn('Check', check, 'primary small')));
      }
      box.append(fb);
      root.append(box);
    });
    paintScore();
    LA.renderMath(root);
  };

  /* ------------------------------------------------------------------ */
  /* Universal Modals & Tools (Sandbox, Formulas, Flashcards, Search)    */
  /* ------------------------------------------------------------------ */
  const THEME_KEY = 'm3_course_theme';

  LA.initTheme = function () {
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem('m3_notebook_theme') || 'light';
    if (saved === 'dark') {
      document.body.classList.add('dark-mode');
    }
  };

  LA.toggleTheme = function () {
    const isDark = document.body.classList.toggle('dark-mode');
    const mode = isDark ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, mode);
    localStorage.setItem('m3_notebook_theme', mode);
    const b = document.getElementById('theme-btn');
    if (b) b.innerHTML = isDark ? '<span>☀️</span>' : '<span>🌙</span>';

    if (window.Plotly) {
      const darkBg = isDark ? '#0b1120' : '#ffffff';
      const textColor = isDark ? '#f8fafc' : '#0f172a';
      document.querySelectorAll('.plot3d').forEach((gd) => {
        try {
          Plotly.relayout(gd, {
            'paper_bgcolor': darkBg,
            'plot_bgcolor': darkBg,
            'font.color': textColor,
          });
        } catch (e) {}
      });
    }
    window.dispatchEvent(new Event('resize'));
  };

  function openModal(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.add('open');
      LA.renderMath(m);
      if (id === 'la-modal-sandbox' && window._sandboxCalc) {
        setTimeout(() => window._sandboxCalc(), 50);
      }
    }
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('open');
  }

  LA.openSandbox = () => openModal('la-modal-sandbox');
  LA.openFormula = () => openModal('la-modal-formula');
  LA.openFlashcards = () => openModal('la-modal-flashcards');
  LA.openSearch = () => {
    openModal('la-modal-search');
    const inp = document.getElementById('la-search-input');
    if (inp) setTimeout(() => inp.focus(), 80);
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.la-modal-backdrop.open').forEach((m) => m.classList.remove('open'));
    }
  });

  function buildModals() {
    if (document.getElementById('la-modal-sandbox')) return;

    // 1. Matrix Sandbox Modal
    const sandboxModal = el('div', {
      id: 'la-modal-sandbox',
      class: 'la-modal-backdrop',
      onclick: (e) => { if (e.target.id === 'la-modal-sandbox') closeModal('la-modal-sandbox'); }
    },
      el('div', { class: 'la-modal-dialog' },
        el('div', { class: 'la-modal-header' },
          el('h3', {}, el('span', { text: '🧮' }), el('span', { text: 'Interactive Linear Systems Sandbox & Solver' })),
          el('button', { class: 'btn ghost small', onclick: () => closeModal('la-modal-sandbox') }, '✕ Close')
        ),
        el('div', { class: 'la-modal-body', id: 'sandbox-body' })
      )
    );

    // 2. Formula Sheet Modal
    const formulaModal = el('div', {
      id: 'la-modal-formula',
      class: 'la-modal-backdrop',
      onclick: (e) => { if (e.target.id === 'la-modal-formula') closeModal('la-modal-formula'); }
    },
      el('div', { class: 'la-modal-dialog' },
        el('div', { class: 'la-modal-header' },
          el('h3', {}, el('span', { text: '📐' }), el('span', { text: 'Linear Algebra Core Exam Formula Sheet' })),
          el('button', { class: 'btn ghost small', onclick: () => closeModal('la-modal-formula') }, '✕ Close')
        ),
        el('div', { class: 'la-modal-body' },
          el('p', { style: 'color:var(--muted); font-size:13.5px; margin-top:0;' }, 'Key theorems, definitions, and classification rules for Mathematics-3 (Newton School of Technology).'),
          el('div', { class: 'cards two' },
            el('div', { class: 'card blue' },
              el('h4', { text: '1. Theorem 1: The Trichotomy Theorem' }),
              el('p', { html: 'Every linear system $A\\mathbf{x} = \\mathbf{b}$ has strictly: <br>• <b>0 solutions:</b> Inconsistent ($\\text{rank}(A) < \\text{rank}([A|b])$)<br>• <b>1 unique solution:</b> Consistent independent ($\\det(A) \\neq 0$, $\\text{rank}(A) = \\text{rank}([A|b]) = n$)<br>• <b>$\\infty$ solutions:</b> Consistent dependent ($\\text{rank}(A) = \\text{rank}([A|b]) < n$)' })
            ),
            el('div', { class: 'card orange' },
              el('h4', { text: '2. Row-Verse vs. Column-Verse' }),
              el('p', { html: '<b>Row Picture:</b> Each equation represents a geometric hyperplane. Solution is where planes intersect.<br><b>Column Picture:</b> $x_1\\mathbf{a}_1 + \\dots + x_n\\mathbf{a}_n = \\mathbf{b}$. Finding scalars to combine column vectors to hit target $\\mathbf{b}$.' })
            ),
            el('div', { class: 'card green' },
              el('h4', { text: '3. Matrix Multiplication (4 Perspectives)' }),
              el('p', { html: '• <b>Compatibility:</b> $(m \\times k) \\times (k \\times n) = m \\times n$<br>• <b>Entry-wise:</b> $c_{ij} = \\text{row}_i(A) \\cdot \\text{col}_j(B)$<br>• <b>Column-wise:</b> Columns of $C$ are linear combinations of columns of $A$<br>• <b>Row-wise:</b> Rows of $C$ are linear combinations of rows of $B$' })
            ),
            el('div', { class: 'card purple' },
              el('h4', { text: '4. 10 Vector Space Axioms' }),
              el('p', { html: 'For all $\\mathbf{u},\\mathbf{v},\\mathbf{w} \\in V$ and scalars $c, d \\in \\mathbb{R}$:<br>1. $\\mathbf{u}+\\mathbf{v} \\in V$<br>2. $\\mathbf{u}+\\mathbf{v} = \\mathbf{v}+\\mathbf{u}$<br>3. $(\\mathbf{u}+\\mathbf{v})+\\mathbf{w} = \\mathbf{u}+(\\mathbf{v}+\\mathbf{w})$<br>4. $\\mathbf{u}+\\mathbf{0} = \\mathbf{u}$<br>5. $\\mathbf{u}+(-\\mathbf{u}) = \\mathbf{0}$<br>6. $c\\mathbf{u} \\in V$<br>7. $c(\\mathbf{u}+\\mathbf{v}) = c\\mathbf{u}+c\\mathbf{v}$<br>8. $(c+d)\\mathbf{u} = c\\mathbf{u}+d\\mathbf{u}$<br>9. $c(d\\mathbf{u}) = (cd)\\mathbf{u}$<br>10. $1\\mathbf{u} = \\mathbf{u}$' })
            ),
            el('div', { class: 'card teal' },
              el('h4', { text: '5. Linear Independence & Span' }),
              el('p', { html: '<b>Span:</b> $\\text{Span}\\{\\mathbf{v}_1,\\dots,\\mathbf{v}_k\\} = \\{c_1\\mathbf{v}_1+\\dots+c_k\\mathbf{v}_k \\mid c_i \\in \\mathbb{R}\\}$.<br><b>Independence:</b> Vectors are independent iff $c_1\\mathbf{v}_1+\\dots+c_k\\mathbf{v}_k = \\mathbf{0} \\implies c_1 = \\dots = c_k = 0$.' })
            ),
            el('div', { class: 'card red' },
              el('h4', { text: '6. Digital Image Transformation Rule' }),
              el('p', { html: '• <b>Left multiplier ($P \\cdot X$):</b> Acts on horizontal ROWS (vertical shifts/flips).<br>• <b>Right multiplier ($X \\cdot Q$):</b> Acts on vertical COLUMNS (horizontal shifts/reflections).' })
            )
          )
        )
      )
    );

    // 3. Flashcards Modal
    const flashcardModal = el('div', {
      id: 'la-modal-flashcards',
      class: 'la-modal-backdrop',
      onclick: (e) => { if (e.target.id === 'la-modal-flashcards') closeModal('la-modal-flashcards'); }
    },
      el('div', { class: 'la-modal-dialog', style: 'max-width: 680px;' },
        el('div', { class: 'la-modal-header' },
          el('h3', {}, el('span', { text: '🗂️' }), el('span', { text: 'Linear Algebra Interactive Flashcard Review' })),
          el('button', { class: 'btn ghost small', onclick: () => closeModal('la-modal-flashcards') }, '✕ Close')
        ),
        el('div', { class: 'la-modal-body', id: 'flashcards-body' })
      )
    );

    // 4. Search Modal
    const searchModal = el('div', {
      id: 'la-modal-search',
      class: 'la-modal-backdrop',
      onclick: (e) => { if (e.target.id === 'la-modal-search') closeModal('la-modal-search'); }
    },
      el('div', { class: 'la-modal-dialog', style: 'max-width: 640px;' },
        el('div', { class: 'la-modal-header' },
          el('h3', {}, el('span', { text: '🔍' }), el('span', { text: 'Search Course & Notebook' })),
          el('button', { class: 'btn ghost small', onclick: () => closeModal('la-modal-search') }, '✕ Close')
        ),
        el('div', { class: 'la-modal-body' },
          el('div', { class: 'search-input-wrap' },
            el('input', { id: 'la-search-input', type: 'text', placeholder: 'Type to search concepts, theorems, labs, sheet 1...' })
          ),
          el('div', { id: 'la-search-results', class: 'search-results-list' })
        )
      )
    );

    document.body.append(sandboxModal, formulaModal, flashcardModal, searchModal);

    initSandboxEngine();
    initFlashcardsEngine();
    initSearchEngine();
  }

  function initSandboxEngine() {
    const body = document.getElementById('sandbox-body');
    if (!body) return;
    body.innerHTML = '';

    let dim = 2; // 2 or 3

    const dimToggle = el('div', { style: 'display:flex; gap:8px; margin-bottom:14px; align-items:center;' },
      el('span', { style: 'font-size:12.5px; font-weight:700; color:var(--muted);', text: 'Select Dimension:' }),
      el('button', { class: 'btn primary small', id: 'sb-dim-2', onclick: () => setDim(2) }, '2×2 System (Lines)'),
      el('button', { class: 'btn ghost small', id: 'sb-dim-3', onclick: () => setDim(3) }, '3×3 System (Planes)')
    );

    const presetsWrap = el('div', { class: 'sandbox-presets' });
    const inputsWrap = el('div', { class: 'sandbox-inputs-grid' });
    const resultsWrap = el('div', { class: 'sandbox-results' });
    const plotWrap = el('div', { style: 'margin-top:16px;' });

    body.append(dimToggle, presetsWrap, inputsWrap, resultsWrap, plotWrap);

    let state2 = { a1: 1, b1: 1, c1: 3, a2: 1, b2: -1, c2: 1 };
    let state3 = { a1: 1, b1: 1, c1: 1, d1: 1, a2: 2, b2: 2, c2: 2, d2: -1, a3: 1, b3: 1, c3: -1, d3: 0 };

    function setDim(d) {
      dim = d;
      const b2 = document.getElementById('sb-dim-2');
      const b3 = document.getElementById('sb-dim-3');
      if (b2) b2.className = dim === 2 ? 'btn primary small' : 'btn ghost small';
      if (b3) b3.className = dim === 3 ? 'btn primary small' : 'btn ghost small';
      renderPresets();
      renderInputs();
      calculateAndPlot();
    }

    function renderPresets() {
      presetsWrap.innerHTML = '';
      if (dim === 2) {
        presetsWrap.append(
          el('button', { class: 'sandbox-preset-btn', onclick: () => { Object.assign(state2, { a1: 1, b1: 1, c1: 3, a2: 1, b2: -1, c2: 1 }); renderInputs(); calculateAndPlot(); } }, 'Unique Point (2, 1)'),
          el('button', { class: 'sandbox-preset-btn', onclick: () => { Object.assign(state2, { a1: 2, b1: 4, c1: 6, a2: 1, b2: 2, c2: 5 }); renderInputs(); calculateAndPlot(); } }, 'No Solution (Parallel)'),
          el('button', { class: 'sandbox-preset-btn', onclick: () => { Object.assign(state2, { a1: 2, b1: -3, c1: 6, a2: 4, b2: -6, c2: 12 }); renderInputs(); calculateAndPlot(); } }, 'Infinite Solutions (Coincident)')
        );
      } else {
        presetsWrap.append(
          el('button', { class: 'sandbox-preset-btn', onclick: () => { Object.assign(state3, { a1: 1, b1: 1, c1: 1, d1: 1, a2: 2, b2: 2, c2: 2, d2: -1, a3: 1, b3: 1, c3: -1, d3: 0 }); renderInputs(); calculateAndPlot(); } }, 'Sheet 1 Q1: Triangular Prism (0 Sol)'),
          el('button', { class: 'sandbox-preset-btn', onclick: () => { Object.assign(state3, { a1: 1, b1: 1, c1: 1, d1: 3, a2: 2, b2: -1, c2: 1, d2: 2, a3: 1, b3: 2, c3: -1, d3: 2 }); renderInputs(); calculateAndPlot(); } }, 'Unique Intersection Point (1, 1, 1)'),
          el('button', { class: 'sandbox-preset-btn', onclick: () => { Object.assign(state3, { a1: 1, b1: 1, c1: 1, d1: 1, a2: 2, b2: 2, c2: 2, d2: 2, a3: 1, b3: -1, c3: 0, d3: 0 }); renderInputs(); calculateAndPlot(); } }, 'Common Line (Infinite Solutions)')
        );
      }
    }

    function renderInputs() {
      inputsWrap.innerHTML = '';
      if (dim === 2) {
        inputsWrap.append(
          el('div', { class: 'sandbox-row' },
            el('span', { style: 'color:var(--blue);', text: 'Line 1:' }),
            createInp(state2, 'a1'), el('span', { text: 'x +' }),
            createInp(state2, 'b1'), el('span', { text: 'y =' }),
            createInp(state2, 'c1')
          ),
          el('div', { class: 'sandbox-row' },
            el('span', { style: 'color:var(--red);', text: 'Line 2:' }),
            createInp(state2, 'a2'), el('span', { text: 'x +' }),
            createInp(state2, 'b2'), el('span', { text: 'y =' }),
            createInp(state2, 'c2')
          )
        );
      } else {
        inputsWrap.append(
          el('div', { class: 'sandbox-row' },
            el('span', { style: 'color:#00d2ff;', text: 'Plane 1:' }),
            createInp(state3, 'a1'), el('span', { text: 'x +' }),
            createInp(state3, 'b1'), el('span', { text: 'y +' }),
            createInp(state3, 'c1'), el('span', { text: 'z =' }),
            createInp(state3, 'd1')
          ),
          el('div', { class: 'sandbox-row' },
            el('span', { style: 'color:#ff3f6c;', text: 'Plane 2:' }),
            createInp(state3, 'a2'), el('span', { text: 'x +' }),
            createInp(state3, 'b2'), el('span', { text: 'y +' }),
            createInp(state3, 'c2'), el('span', { text: 'z =' }),
            createInp(state3, 'd2')
          ),
          el('div', { class: 'sandbox-row' },
            el('span', { style: 'color:#ffd700;', text: 'Plane 3:' }),
            createInp(state3, 'a3'), el('span', { text: 'x +' }),
            createInp(state3, 'b3'), el('span', { text: 'y +' }),
            createInp(state3, 'c3'), el('span', { text: 'z =' }),
            createInp(state3, 'd3')
          )
        );
      }
    }

    function createInp(obj, key) {
      const input = el('input', { type: 'number', step: 'any', value: obj[key] });
      input.addEventListener('input', () => {
        obj[key] = parseFloat(input.value) || 0;
        calculateAndPlot();
      });
      return input;
    }

    function calculateAndPlot() {
      resultsWrap.innerHTML = '';
      plotWrap.innerHTML = '';

      if (dim === 2) {
        const { a1, b1, c1, a2, b2, c2 } = state2;
        const det = a1 * b2 - a2 * b1;
        const detX = c1 * b2 - c2 * b1;
        const detY = a1 * c2 - a2 * c1;

        let statusText = '', statusKind = 'good', solText = '—', rankA = 2, rankAb = 2;

        if (Math.abs(det) > 1e-6) {
          rankA = 2; rankAb = 2;
          const x = detX / det;
          const y = detY / det;
          solText = `(${LA.fmt(x, 2)}, ${LA.fmt(y, 2)})`;
          statusText = '<b>Unique Solution:</b> Lines cross at exactly one intersection point.';
          statusKind = 'good';
        } else {
          rankA = (Math.abs(a1) > 1e-6 || Math.abs(b1) > 1e-6 || Math.abs(a2) > 1e-6 || Math.abs(b2) > 1e-6) ? 1 : 0;
          if (Math.abs(detX) < 1e-6 && Math.abs(detY) < 1e-6) {
            rankAb = rankA;
            solText = 'Entire 1D Line (∞ points)';
            statusText = '<b>Infinitely Many Solutions:</b> Lines coincide and lie directly on top of each other.';
            statusKind = 'warn';
          } else {
            rankAb = rankA + 1;
            solText = 'No Common Point (∅)';
            statusText = '<b>Inconsistent (0 Solutions):</b> Lines are parallel and disjoint with no intersection.';
            statusKind = 'bad';
          }
        }

        resultsWrap.append(
          el('div', { class: 'sandbox-card' }, el('div', { class: 'label', text: 'Determinant det(A)' }), el('div', { class: 'val', text: LA.fmt(det, 2) })),
          el('div', { class: 'sandbox-card' }, el('div', { class: 'label', text: 'Rank(A) vs Rank([A|b])' }), el('div', { class: 'val', text: `${rankA} vs ${rankAb}` })),
          el('div', { class: 'sandbox-card' }, el('div', { class: 'label', text: 'Solution (x, y)' }), el('div', { class: 'val', text: solText }))
        );

        const statusBox = el('div', { class: 'status ' + statusKind, style: 'grid-column: 1 / -1; margin-top:8px;', html: statusText });
        resultsWrap.append(statusBox);

        // 2D Canvas plot
        const canvasDiv = el('div', { class: 'plot2d', style: 'height:360px;' });
        plotWrap.append(canvasDiv);
        const plot = new LA.Plot2D(canvasDiv, { xmin: -6, xmax: 6, ymin: -5, ymax: 5, height: 360 });
        plot.render((p) => {
          p.frame({ xlabel: 'x', ylabel: 'y', grid: true, axes: true, ticks: true });
          p.line(a1, b1, c1, { color: LA.C.blue, width: 3 });
          p.line(a2, b2, c2, { color: LA.C.red, width: 3 });
          if (Math.abs(det) > 1e-6) {
            const x = detX / det;
            const y = detY / det;
            p.point([x, y], { color: LA.C.amber, size: 7, stroke: '#000', strokeWidth: 2, label: `(${LA.fmt(x, 2)}, ${LA.fmt(y, 2)})` });
          }
          p.legend([
            { label: `${a1}x + ${b1}y = ${c1}`, color: LA.C.blue, kind: 'line' },
            { label: `${a2}x + ${b2}y = ${c2}`, color: LA.C.red, kind: 'line' },
            Math.abs(det) > 1e-6 ? { label: `Point (${LA.fmt(detX / det, 2)}, ${LA.fmt(detY / det, 2)})`, color: LA.C.amber, kind: 'point' } : null
          ]);
        });
      } else {
        // 3D Matrix Solver
        const { a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3 } = state3;
        const det = a1 * (b2 * c3 - b3 * c2) - b1 * (a2 * c3 - a3 * c2) + c1 * (a2 * b3 - a3 * b2);

        // Gaussian elimination on augmented matrix
        let M = [
          [a1, b1, c1, d1],
          [a2, b2, c2, d2],
          [a3, b3, c3, d3]
        ];

        let rA = 0, rAb = 0;
        let lead = 0;
        for (let r = 0; r < 3; r++) {
          if (lead >= 4) break;
          let i = r;
          while (Math.abs(M[i][lead]) < 1e-6) {
            i++;
            if (i === 3) {
              i = r;
              lead++;
              if (lead === 4) break;
            }
          }
          if (lead === 4) break;
          let temp = M[i]; M[i] = M[r]; M[r] = temp;
          let lv = M[r][lead];
          for (let j = 0; j < 4; j++) M[r][j] /= lv;
          for (let k = 0; k < 3; k++) {
            if (k !== r) {
              let factor = M[k][lead];
              for (let j = 0; j < 4; j++) M[k][j] -= factor * M[r][j];
            }
          }
          lead++;
        }

        // Count ranks
        for (let i = 0; i < 3; i++) {
          if (Math.abs(M[i][0]) > 1e-6 || Math.abs(M[i][1]) > 1e-6 || Math.abs(M[i][2]) > 1e-6) rA++;
          if (Math.abs(M[i][0]) > 1e-6 || Math.abs(M[i][1]) > 1e-6 || Math.abs(M[i][2]) > 1e-6 || Math.abs(M[i][3]) > 1e-6) rAb++;
        }

        let solText = '—', statusText = '', statusKind = 'good';
        if (rA === 3 && rAb === 3) {
          const x = M[0][3], y = M[1][3], z = M[2][3];
          solText = `(${LA.fmt(x, 2)}, ${LA.fmt(y, 2)}, ${LA.fmt(z, 2)})`;
          statusText = '<b>Unique Solution:</b> All 3 planes meet simultaneously at a single point in $\\mathbb{R}^3$.';
          statusKind = 'good';
        } else if (rA < rAb) {
          solText = 'Inconsistent (∅)';
          statusText = '<b>Zero Solutions (Inconsistent):</b> Planes do not share any common point (e.g. Triangular Prism / Parallel).';
          statusKind = 'bad';
        } else {
          solText = 'Infinitely Many (Line / Plane)';
          statusText = '<b>Infinitely Many Solutions:</b> Planes intersect along an entire continuous line or plane.';
          statusKind = 'warn';
        }

        resultsWrap.append(
          el('div', { class: 'sandbox-card' }, el('div', { class: 'label', text: 'Determinant det(A)' }), el('div', { class: 'val', text: LA.fmt(det, 2) })),
          el('div', { class: 'sandbox-card' }, el('div', { class: 'label', text: 'Rank(A) vs Rank([A|b])' }), el('div', { class: 'val', text: `${rA} vs ${rAb}` })),
          el('div', { class: 'sandbox-card' }, el('div', { class: 'label', text: 'Solution (x, y, z)' }), el('div', { class: 'val', text: solText }))
        );

        resultsWrap.append(el('div', { class: 'status ' + statusKind, style: 'grid-column: 1 / -1; margin-top:8px;', html: statusText }));

        // 3D Plotly scene
        const plot3dDiv = el('div', { class: 'plot3d', style: 'height:400px;' });
        plotWrap.append(plot3dDiv);

        function makePlane(a, b, c, d, color, name) {
          const grid = [];
          for (let val = -4; val <= 4; val += 1.6) grid.push(val);
          const X = [], Y = [], Z = [];
          for (let i = 0; i < grid.length; i++) {
            const xRow = [], yRow = [], zRow = [];
            for (let j = 0; j < grid.length; j++) {
              const u = grid[i], v = grid[j];
              if (Math.abs(c) > 0.05) {
                xRow.push(u); yRow.push(v);
                zRow.push((d - a * u - b * v) / c);
              } else if (Math.abs(b) > 0.05) {
                xRow.push(u); yRow.push((d - a * u) / b);
                zRow.push(v);
              } else if (Math.abs(a) > 0.05) {
                xRow.push(d / a); yRow.push(u);
                zRow.push(v);
              } else {
                xRow.push(u); yRow.push(v); zRow.push(0);
              }
            }
            X.push(xRow); Y.push(yRow); Z.push(zRow);
          }
          return {
            type: 'surface', x: X, y: Y, z: Z,
            colorscale: [[0, color], [1, color]],
            opacity: 0.65, showscale: false, name
          };
        }

        LA.plot3d(plot3dDiv, [
          makePlane(a1, b1, c1, d1, '#00d2ff', 'Plane 1'),
          makePlane(a2, b2, c2, d2, '#ff3f6c', 'Plane 2'),
          makePlane(a3, b3, c3, d3, '#ffd700', 'Plane 3')
        ], { height: 400 });
      }
    }

    window._sandboxCalc = calculateAndPlot;
    setDim(2);
  }

  function initFlashcardsEngine() {
    const body = document.getElementById('flashcards-body');
    if (!body) return;
    body.innerHTML = '';

    const FLASHCARDS = [
      {
        k: 'Concept 01',
        q: 'What is the rigorous mathematical definition of a Linear Equation?',
        a: 'The rate of change $\\frac{\\Delta y}{\\Delta x}$ is strictly invariant everywhere along the curve. Uniform steps along $x$ produce strictly uniform steps along $y$, geometrically constraining graphs to flat straight lines and planes.'
      },
      {
        k: 'Concept 02',
        q: 'State the Fundamental Trichotomy Theorem for Linear Systems.',
        a: 'Any linear system $A\\mathbf{x} = \\mathbf{b}$ over $\\mathbb{R}$ has strictly: 1) Zero solutions (inconsistent), 2) Exactly one unique solution (consistent independent), or 3) Infinitely many solutions (consistent dependent).'
      },
      {
        k: 'Concept 03',
        q: 'Why can a system of linear equations NEVER have exactly 2 distinct solutions?',
        a: 'If points $\\mathbf{p}_1$ and $\\mathbf{p}_2$ both satisfy $A\\mathbf{x} = \\mathbf{b}$, then any affine combination $t\\mathbf{p}_1 + (1-t)\\mathbf{p}_2$ also satisfies the system for all $t \\in \\mathbb{R}$, immediately generating an entire infinite line of solutions!'
      },
      {
        k: 'Concept 04',
        q: 'What is the difference between the Row Picture and Column Picture?',
        a: 'Row Picture views each equation as a geometric hyperplane and seeks coordinate points where all hyperplanes cross simultaneously. Column Picture views columns as vector arrows and seeks scalar weights to chain arrows head-to-tail to reach target $\\mathbf{b}$.'
      },
      {
        k: 'Concept 05',
        q: 'Why is Matrix Multiplication Non-Commutative ($AB \\neq BA$)?',
        a: 'Matrices represent geometric transformations. Rotating space then shearing space produces a completely different result than shearing first then rotating! Furthermore, matrix dimensions often prevent reversal entirely.'
      },
      {
        k: 'Concept 06',
        q: 'What does Left Multiplier ($P \\cdot X$) do to an image vs Right Multiplier ($X \\cdot Q$)?',
        a: 'Left multiplier $P$ acts on horizontal ROWS (vertical movements: shifting up/down, vertical reflection). Right multiplier $Q$ acts on vertical COLUMNS (horizontal movements: shifting left/right, horizontal reflection).'
      },
      {
        k: 'Concept 07',
        q: 'What are the Three Perspectives on a single Vector?',
        a: '1) Physics: A directed arrow with magnitude and direction in space. 2) Computer Science: An ordered list or numerical feature array. 3) Mathematics: An abstract element of a vector space obeying 10 axioms.'
      },
      {
        k: 'Concept 08',
        q: 'Define the Span of a set of vectors $\\{\\mathbf{v}_1, \\dots, \\mathbf{v}_k\\}$.',
        a: 'The set of ALL possible linear combinations: $\\text{Span}\\{\\mathbf{v}_1,\\dots,\\mathbf{v}_k\\} = \\{c_1\\mathbf{v}_1+\\dots+c_k\\mathbf{v}_k \\mid c_i \\in \\mathbb{R}\\}$. Geometrically, it is the entire continuous geometric subspace swept out by the vectors.'
      },
      {
        k: 'Concept 09',
        q: 'When are vectors $\\{\\mathbf{v}_1, \\dots, \\mathbf{v}_k\\}$ Linearly Independent?',
        a: 'When no vector can be synthesized as a linear combination of the others. Formally, $c_1\\mathbf{v}_1+\\dots+c_k\\mathbf{v}_k = \\mathbf{0}$ holds IF AND ONLY IF all scalars are zero: $c_1 = \\dots = c_k = 0$.'
      },
      {
        k: 'Concept 10',
        q: 'How do Rank(A) and Rank([A|b]) classify the solutions of Ax = b?',
        a: '1) $\\text{rank}(A) < \\text{rank}([A|b])$: Inconsistent (0 solutions). 2) $\\text{rank}(A) = \\text{rank}([A|b]) = n$: Unique solution. 3) $\\text{rank}(A) = \\text{rank}([A|b]) < n$: Infinitely many solutions.'
      }
    ];

    let cur = 0;
    const wrap = el('div', { class: 'flashcard-wrap' });
    const card = el('div', { class: 'flashcard', onclick: () => card.classList.toggle('flipped') });
    const front = el('div', { class: 'flashcard-face flashcard-front' });
    const back = el('div', { class: 'flashcard-face flashcard-back' });
    card.append(front, back);
    wrap.append(card);

    const counter = el('span', { style: 'font-weight:700; font-size:13px; color:var(--muted);' });
    const prevBtn = el('button', { class: 'btn ghost small', onclick: () => showCard(cur - 1) }, '← Previous');
    const flipBtn = el('button', { class: 'btn primary small', onclick: () => card.classList.toggle('flipped') }, '🔄 Flip Card');
    const nextBtn = el('button', { class: 'btn ghost small', onclick: () => showCard(cur + 1) }, 'Next →');

    const nav = el('div', { class: 'flashcard-nav' }, prevBtn, flipBtn, nextBtn, counter);
    body.append(wrap, nav);

    function showCard(idx) {
      if (idx < 0) idx = FLASHCARDS.length - 1;
      if (idx >= FLASHCARDS.length) idx = 0;
      cur = idx;
      card.classList.remove('flipped');
      const c = FLASHCARDS[cur];
      front.innerHTML = `<h4>${c.k} (Click to Flip)</h4><p>${c.q}</p>`;
      back.innerHTML = `<h4>Insight &amp; Answer</h4><p>${c.a}</p>`;
      counter.textContent = `Card ${cur + 1} of ${FLASHCARDS.length}`;
      LA.renderMath(card);
    }

    showCard(0);
  }

  function initSearchEngine() {
    const input = document.getElementById('la-search-input');
    const results = document.getElementById('la-search-results');
    if (!input || !results) return;

    const INDEX = [
      { b: 'Module 1', t: 'What is a Point, Line, and Plane?', d: 'Geometric definitions in R^n and fundamental dimensions.', h: 'module1.html#sec-1' },
      { b: 'Module 1', t: 'Linearity & Rate of Change (Δy/Δx)', d: 'Testing invariance of slopes and uniform sampling steps.', h: 'module1.html#sec-1' },
      { b: 'Module 1', t: '2×2 Systems & Intersection Points', d: 'Solving two linear equations in two indeterminates simultaneously.', h: 'module1.html#sec-2' },
      { b: 'Module 1', t: 'Moving to 3 Variables: What does x+y+z=1 represent?', d: 'Planes in R^3 space and 3D intersection geometry.', h: 'module1.html#sec-3' },
      { b: 'Module 1', t: 'Sheet 1: 6 Configurations of 3 Planes', d: 'Triangular prisms, parallel planes, common lines, and unique points.', h: 'module1.html#sec-3' },
      { b: 'Module 1', t: 'Theorem 1: The Trichotomy Theorem', d: 'Why linear systems only ever have 0, 1, or infinity solutions.', h: 'module1.html#sec-4' },
      { b: 'Module 1', t: 'The Dual-Verse: Row Picture vs Column Picture', d: 'Hyperplane intersections vs vector arrow combinations.', h: 'module1.html#sec-5' },
      { b: 'Module 1', t: 'Assignments & Determinant Code Lab', d: 'Python code challenges and conceptual exercises from Sheet 1.', h: 'module1.html#sec-6' },
      { b: 'Module 2', t: 'Additive Light Mixing (RGB Synthesis)', d: 'Scaling basis light beams to synthesize colors in R^3.', h: 'module2.html#sec-1' },
      { b: 'Module 2', t: 'Acoustic Superposition: Dr. King + Bach', d: 'Waveform mixing and physical linear combinations in sound.', h: 'module2.html#sec-1' },
      { b: 'Module 2', t: 'Dimensional Compatibility & AB != BA', d: 'Why inner dimensions must match and why order matters.', h: 'module2.html#sec-2' },
      { b: 'Module 2', t: 'The Mul-Tea-Plication Kitchen', d: 'Pantry jars, custom tea blends, and row tea vs column tea.', h: 'module2.html#sec-3' },
      { b: 'Module 2', t: 'Binary Image Studio: PXQ Transformations', d: 'What left and right matrix multiplication actually does to pixels.', h: 'module2.html#sec-4' },
      { b: 'Module 3', t: 'Three Perspectives on Vectors', d: 'Physics arrows, CS data lists, and Mathematical vector space elements.', h: 'module3.html#sec-1' },
      { b: 'Module 3', t: 'Vector Addition: Head-to-Tail vs Parallelogram', d: 'Geometric laws of vector sums in R^2.', h: 'module3.html#sec-2' },
      { b: 'Module 3', t: 'Combination vs Span: One Point vs Universe', d: 'Continuous territory swept out by all real scalars.', h: 'module3.html#sec-3' },
      { b: 'Module 3', t: '3D Subspace Rotator', d: 'Exploring 0D points, 1D lines, 2D planes, and full R^3 spaces.', h: 'module3.html#sec-3' },
      { b: 'Module 3', t: 'The Linear Alchemist Game', d: 'Chaining column basis vectors to hit target coordinate targets.', h: 'module3.html#sec-4' },
      { b: 'Jupyter Notebook', t: 'LA_Notebook_1.ipynb Full Showcase', d: 'All 94 cells displayed with cell execution and live widget replacements.', h: 'notebook.html' }
    ];

    function render(term) {
      results.innerHTML = '';
      const t = term.toLowerCase().trim();
      const filtered = INDEX.filter((item) => !t || item.t.toLowerCase().includes(t) || item.d.toLowerCase().includes(t) || item.b.toLowerCase().includes(t));
      if (!filtered.length) {
        results.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted);">No matching topics found. Try "planes", "trichotomy", "tea", or "span".</div>';
        return;
      }
      filtered.forEach((item) => {
        const a = el('a', { class: 'search-item', href: item.h, onclick: () => closeModal('la-modal-search') },
          el('div', { class: 'badge', text: item.b }),
          el('div', { class: 'title', text: item.t }),
          el('div', { class: 'desc', text: item.d })
        );
        results.append(a);
      });
    }

    input.addEventListener('input', (e) => render(e.target.value));
    render('');
  }

  /* ------------------------------------------------------------------ */
  /* Boot sequence                                                        */
  /* ------------------------------------------------------------------ */
  const readyQueue = [];
  const mountedLabs = new Map();

  LA.onReady = (fn) => readyQueue.push(fn);

  LA.mount = function (name, fn) {
    mountedLabs.set(name, fn);
    readyQueue.push(() => LA.runMount(name));
  };

  LA.runMount = function (name) {
    const fn = mountedLabs.get(name);
    if (!fn) return false;
    const m = document.getElementById(name);
    if (!m) return false;
    if (m.dataset.laMounted === 'true') return true;
    try {
      fn();
      m.dataset.laMounted = 'true';
      return true;
    } catch (e) {
      console.error('[LA] lab "' + name + '" failed:', e);
      m.innerHTML = '<div class="status bad">This interactive could not start (' + esc(e.message) + '). Please refresh the page.</div>';
      return false;
    }
  };

  LA.runAllMounts = function () {
    let count = 0;
    mountedLabs.forEach((fn, name) => {
      if (LA.runMount(name)) count++;
    });
    return count;
  };

  document.addEventListener('DOMContentLoaded', () => {
    LA.initTheme();
    const isJupyter = document.body.classList.contains('jupyter-mode') || document.body.dataset.page === 'notebook';
    const page = isJupyter ? 'notebook' : (document.body.dataset.page || 'home');

    if (!isJupyter && !document.querySelector('.jp-header')) {
      buildTopbar(page);
      buildToc(page);
      buildModals();
    }
    LA.renderMath(document.body);
    buildPonders(page);
    if (!isJupyter) {
      buildPager(page);
    }
    LA.runAllMounts();
    readyQueue.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    document.documentElement.classList.add('la-ready');
  });
})();
