/* =====================================================================
   Module 2: Matrix Multiplication · Interactive Laboratories
   ===================================================================== */
(function () {
  'use strict';
  const { el, M, C, fmt, g, setStatus } = LA;

  /* ------------------------------------------------------------------ */
  /* Lab 2.1: Additive Light Studio (RGB Basis Vectors)                  */
  /* Notebook Cell [39]: render_rgb_studio                               */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-rgb-studio', function () {
    const box = LA.lab('#lab-rgb-studio', {
      cell: 39,
      icon: '💡',
      kicker: 'Computer Graphics Simulation',
      title: 'Additive Light Synthesis: Basis Vector Combinations',
      cols: 2,
      onReset: () => { r_slider.set(0.90); g_slider.set(0.45); b_slider.set(0.10); }
    });

    const r_slider = LA.slider({ label: 'Red (r · [1, 0, 0]ᵀ):', min: 0, max: 1, step: 0.02, value: 0.90, color: '#EF4444', onInput: render });
    const g_slider = LA.slider({ label: 'Green (g · [0, 1, 0]ᵀ):', min: 0, max: 1, step: 0.02, value: 0.45, color: '#10B981', onInput: render });
    const b_slider = LA.slider({ label: 'Blue (b · [0, 0, 1]ᵀ):', min: 0, max: 1, step: 0.02, value: 0.10, color: '#3B82F6', onInput: render });

    box.controls.append(r_slider.el, g_slider.el, b_slider.el);

    const swatchDiv = el('div', { class: 'swatch' }, el('span', { text: 'Synthesizing...' }));
    const plotBars = new LA.Plot2D(box.stage, { xmin: -0.8, xmax: 2.8, ymin: 0, ymax: 1.25, height: 320 });

    box.stage.prepend(swatchDiv);

    function render() {
      const r = r_slider.value, g_val = g_slider.value, b = b_slider.value;
      const hex = '#' + [r, g_val, b].map(v => Math.round(LA.clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

      swatchDiv.style.background = hex;
      swatchDiv.querySelector('span').innerHTML = `<b>Synthesized Vector:</b> [${fmt(r, 2)}, ${fmt(g_val, 2)}, ${fmt(b, 2)}]ᵀ<br><b>Hex Code:</b> ${hex}`;

      setStatus(box.status, 'info',
        `<b>Column Linear Combination:</b> $\\mathbf{c} = ${fmt(r, 2)} \\begin{bmatrix}1\\\\0\\\\0\\end{bmatrix} + ${fmt(g_val, 2)} \\begin{bmatrix}0\\\\1\\\\0\\end{bmatrix} + ${fmt(b, 2)} \\begin{bmatrix}0\\\\0\\\\1\\end{bmatrix} = \\begin{bmatrix}${fmt(r, 2)}\\\\${fmt(g_val, 2)}\\\\${fmt(b, 2)}\\end{bmatrix}$`
      );

      plotBars.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xticks: [
            { v: 0, label: 'r·Col 1\n[1,0,0]ᵀ' },
            { v: 1, label: 'g·Col 2\n[0,1,0]ᵀ' },
            { v: 2, label: 'b·Col 3\n[0,0,1]ᵀ' }
          ],
          ylabel: 'Scalar Weight (Intensity)'
        });

        p.bar(0, 0, r, 0.45, { color: '#EF4444' });
        p.text([0, r + 0.06], fmt(r, 2), { align: 'center', bold: true });

        p.bar(1, 0, g_val, 0.45, { color: '#10B981' });
        p.text([1, g_val + 0.06], fmt(g_val, 2), { align: 'center', bold: true });

        p.bar(2, 0, b, 0.45, { color: '#3B82F6' });
        p.text([2, b + 0.06], fmt(b, 2), { align: 'center', bold: true });
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 2.2: Audio Acoustic Superposition (MLK Audio Waveform & Player)*/
  /* Notebook Cell [43]: update_audio_superposition                      */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-audio-superposition', function () {
    const box = LA.lab('#lab-audio-superposition', {
      cell: 43,
      icon: '🎵',
      kicker: 'Audio Engineering Studio',
      title: 'Acoustic Superposition: Real Audio Vectors Superposed in Time',
      onReset: () => { bach_slider.set(0.70); mlk_slider.set(0.80); }
    });

    const bach_slider = LA.slider({ label: 'Bach Classical Organ (c₁):', min: 0, max: 1.5, step: 0.05, value: 0.70, color: '#2563EB', onInput: render });
    const mlk_slider = LA.slider({ label: 'Dr. King Spoken Voice (c₂):', min: 0, max: 1.5, step: 0.05, value: 0.80, color: '#EA580C', onInput: render });

    box.controls.append(bach_slider.el, mlk_slider.el);

    const plotAudio = new LA.Plot2D(box.stage, { xmin: 0, xmax: 40, ymin: -2.5, ymax: 2.5, height: 380 });

    const playerCard = el('div', { class: 'panel', style: { marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' } },
      el('div', {},
        el('b', { style: { color: C.purple, fontSize: '15px' }, text: '🔊 Audio Playback & Synthesizer Engine' }),
        el('p', { class: 'muted', style: { margin: '2px 0 0 0', fontSize: '13px' }, text: 'WebAudio API blends Bach harmonic tone and MLK speech waveform dynamically using sliders c₁ and c₂.' })
      ),
      el('div', { style: { display: 'flex', gap: '10px' } },
        LA.btn('▶ Play Superposed Audio', startAudio, 'primary'),
        LA.btn('⏹ Stop Audio', stopAudio, 'warn')
      )
    );

    box.stage.append(playerCard);

    // Simulated waveform generator (Bach organ harmonic chords + King acoustic speech envelope)
    function getWaveAt(t_ms, c1, c2) {
      const t = t_ms / 1000;
      // Bach: rich baroque organ harmonics (220Hz, 440Hz, 660Hz)
      const bach = 0.55 * Math.sin(2 * Math.PI * 220 * t) + 0.35 * Math.sin(2 * Math.PI * 440 * t) + 0.20 * Math.sin(2 * Math.PI * 660 * t);
      // MLK: voice formant frequencies with modulation (130Hz pitch, speech formant bursts)
      const mlk = (0.7 * Math.sin(2 * Math.PI * 135 * t) + 0.4 * Math.sin(2 * Math.PI * 270 * t) + 0.3 * Math.sin(2 * Math.PI * 850 * t)) * (0.8 + 0.3 * Math.sin(2 * Math.PI * 12 * t));
      return {
        bach_scaled: c1 * bach,
        mlk_scaled: c2 * mlk,
        mixed: c1 * bach + c2 * mlk
      };
    }

    function render() {
      const c1 = bach_slider.value;
      const c2 = mlk_slider.value;

      setStatus(box.status, 'info',
        `<b>Superposition Vector:</b> $\\mathbf{s}_{\\text{mixed}} = (${fmt(c1, 2)}) \\cdot \\mathbf{s}_{\\text{Bach}} + (${fmt(c2, 2)}) \\cdot \\mathbf{s}_{\\text{MLK}}$. Point-by-point air pressure addition across 22,050 samples per second.`
      );

      plotAudio.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'Time Window (milliseconds)', ylabel: 'Amplitude',
          title: `Resultant Superposition: (${fmt(c1, 2)})·s₁ + (${fmt(c2, 2)})·s₂  (Showing 40ms Cycle Window)`
        });

        // Plot Bach
        p.fn((t) => getWaveAt(t, c1, c2).bach_scaled, { color: '#2563EB', width: 2 });
        // Plot MLK
        p.fn((t) => getWaveAt(t, c1, c2).mlk_scaled, { color: '#EA580C', width: 2 });
        // Plot Superposed
        p.fn((t) => getWaveAt(t, c1, c2).mixed, { color: '#7C3AED', width: 3.5 });

        p.legend([
          { label: `Scaled Bach: ${fmt(c1, 2)} · s₁`, color: '#2563EB', kind: 'line' },
          { label: `Scaled MLK: ${fmt(c2, 2)} · s₂`, color: '#EA580C', kind: 'line' },
          { label: 'Superposition: c₁s₁ + c₂s₂', color: '#7C3AED', kind: 'line' }
        ], 'tr');
      });

      updateAudioGains();
      LA.renderMath(box.status);
    }

    // WebAudio synthesis & MLK playback
    let audioCtx = null;
    let bachGainNode = null, mlkGainNode = null;
    let bachOsc1 = null, bachOsc2 = null, mlkSource = null;
    let isPlaying = false;

    function initAudio() {
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function updateAudioGains() {
      if (!audioCtx || !isPlaying) return;
      if (bachGainNode) bachGainNode.gain.setValueAtTime(bach_slider.value * 0.25, audioCtx.currentTime);
      if (mlkGainNode) mlkGainNode.gain.setValueAtTime(mlk_slider.value * 0.45, audioCtx.currentTime);
    }

    function startAudio() {
      initAudio();
      stopAudio();
      isPlaying = true;

      // 1. Synthesize Bach Organ
      bachGainNode = audioCtx.createGain();
      bachGainNode.gain.value = bach_slider.value * 0.25;

      bachOsc1 = audioCtx.createOscillator();
      bachOsc1.type = 'sawtooth';
      bachOsc1.frequency.value = 220; // A3

      bachOsc2 = audioCtx.createOscillator();
      bachOsc2.type = 'sine';
      bachOsc2.frequency.value = 440; // A4

      bachOsc1.connect(bachGainNode);
      bachOsc2.connect(bachGainNode);
      bachGainNode.connect(audioCtx.destination);
      bachOsc1.start();
      bachOsc2.start();

      // 2. Play MLK recording from base64 if present, or vocal synthesis
      mlkGainNode = audioCtx.createGain();
      mlkGainNode.gain.value = mlk_slider.value * 0.45;
      mlkGainNode.connect(audioCtx.destination);

      if (window.MLK_AUDIO_B64) {
        try {
          const raw = atob(window.MLK_AUDIO_B64);
          const rawLength = raw.length;
          const array = new Uint8Array(new ArrayBuffer(rawLength));
          for (let i = 0; i < rawLength; i++) array[i] = raw.charCodeAt(i);
          audioCtx.decodeAudioData(array.buffer, (buffer) => {
            if (!isPlaying) return;
            mlkSource = audioCtx.createBufferSource();
            mlkSource.buffer = buffer;
            mlkSource.loop = true;
            mlkSource.connect(mlkGainNode);
            mlkSource.start();
          });
        } catch (e) {
          console.warn('Fallback audio decoding', e);
        }
      }
    }

    function stopAudio() {
      isPlaying = false;
      if (bachOsc1) { try { bachOsc1.stop(); } catch (e) {} bachOsc1 = null; }
      if (bachOsc2) { try { bachOsc2.stop(); } catch (e) {} bachOsc2 = null; }
      if (mlkSource) { try { mlkSource.stop(); } catch (e) {} mlkSource = null; }
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 2.3: Dimension Compatibility & Alignment Laboratory           */
  /* Notebook Cell [46]: render_compatibility_dashboard                  */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-dimension-compatibility', function () {
    const box = LA.lab('#lab-dimension-compatibility', {
      cell: 46,
      icon: '📐',
      kicker: 'Order Paradox & Compatibility',
      title: 'Matrix Dimension Alignment Visualizer: Inner Dimension Match',
      onReset: () => { m_sl.set(2); n_sl.set(3); p_sl.set(3); q_sl.set(2); }
    });

    const m_sl = LA.slider({ label: 'A Rows (m):', min: 1, max: 4, step: 1, value: 2, color: C.blue, onInput: render });
    const n_sl = LA.slider({ label: 'A Cols (n):', min: 1, max: 4, step: 1, value: 3, color: C.blue, onInput: render });
    const p_sl = LA.slider({ label: 'B Rows (p):', min: 1, max: 4, step: 1, value: 3, color: C.orange, onInput: render });
    const q_sl = LA.slider({ label: 'B Cols (q):', min: 1, max: 4, step: 1, value: 2, color: C.orange, onInput: render });

    const randBtn = LA.btn('🎲 Regenerate Random Numbers', () => { seed++; render(); }, 'small');

    box.controls.append(m_sl.el, n_sl.el, p_sl.el, q_sl.el, randBtn);

    const matricesWrap = el('div', { class: 'mat-eq' });
    box.stage.append(matricesWrap);

    let seed = 101;
    function pseudoRand(s) {
      const x = Math.sin(s++) * 10000;
      return Math.floor((x - Math.floor(x)) * 7) - 3;
    }

    function render() {
      const m = m_sl.value, n = n_sl.value, p = p_sl.value, q = q_sl.value;
      const abValid = (n === p);
      const baValid = (q === m);

      let curSeed = seed;
      const A = Array.from({ length: m }, () => Array.from({ length: n }, () => pseudoRand(curSeed++)));
      const B = Array.from({ length: p }, () => Array.from({ length: q }, () => pseudoRand(curSeed++)));

      let abCard = '';
      if (abValid) {
        abCard = `<div class="status good" style="margin-bottom:6px"><b>✅ Product AB is DEFINED:</b> Inner dimensions match: <b>(${m} × <span style="background:#DCFCE7; padding:2px 5px; border-radius:3px;">${n}</span>) × (<span style="background:#DCFCE7; padding:2px 5px; border-radius:3px;">${p}</span> × ${q})</b> → Output Size: <b>(${m} × ${q})</b></div>`;
      } else {
        abCard = `<div class="status bad" style="margin-bottom:6px"><b>❌ Product AB is UNDEFINED:</b> Inner dimensions do not match: <b>(${m} × <span style="background:#FEE2E2; padding:2px 5px; border-radius:3px;">${n}</span>) × (<span style="background:#FEE2E2; padding:2px 5px; border-radius:3px;">${p}</span> × ${q})</b> (${n} ≠ ${p}). Row length of A does not match column height of B!</div>`;
      }

      let baCard = '';
      if (baValid) {
        baCard = `<div class="status good"><b>✅ Reverse Product BA is DEFINED:</b> Inner dimensions match: <b>(${p} × <span style="background:#DCFCE7; padding:2px 5px; border-radius:3px;">${q}</span>) × (<span style="background:#DCFCE7; padding:2px 5px; border-radius:3px;">${m}</span> × ${n})</b> → Output Size: <b>(${p} × ${n})</b></div>`;
      } else {
        baCard = `<div class="status bad"><b>❌ Reverse Product BA is UNDEFINED:</b> Inner dimensions do not match: <b>(${p} × <span style="background:#FEE2E2; padding:2px 5px; border-radius:3px;">${q}</span>) × (<span style="background:#FEE2E2; padding:2px 5px; border-radius:3px;">${m}</span> × ${n})</b> (${q} ≠ ${m}).</div>`;
      }

      box.status.innerHTML = `<div><div style="font-weight:bold; margin-bottom:6px; color:#1E293B;">Current Configuration: Matrix A is <b>(${m} × ${n})</b> | Matrix B is <b>(${p} × ${q})</b></div>${abCard}${baCard}</div>`;

      // Render HTML matrices
      matricesWrap.innerHTML = '';

      function drawMatrixTable(mat, title, color, bg) {
        const wrap = el('div', { class: 'mat-fig' });
        wrap.append(el('div', { class: 'cap', style: { color }, text: title }));
        const grid = el('div', { class: 'mat-grid', style: { gridTemplateColumns: `repeat(${mat[0].length}, 34px)`, borderColor: color, background: bg } });
        mat.forEach(row => {
          row.forEach(val => {
            grid.append(el('div', { text: String(val) }));
          });
        });
        wrap.append(grid);
        return wrap;
      }

      matricesWrap.append(drawMatrixTable(A, `Matrix A (${m}×${n})`, C.blue, '#EFF6FF'));
      matricesWrap.append(el('span', { class: 'sym', text: '×' }));
      matricesWrap.append(drawMatrixTable(B, `Matrix B (${p}×${q})`, C.orange, '#FFFBEB'));

      if (abValid) {
        const AB = M.mul(A, B);
        matricesWrap.append(el('span', { class: 'sym', text: '=' }));
        matricesWrap.append(drawMatrixTable(AB, `Product AB (${m}×${q})`, C.green, '#F0FDF4'));
      }
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 2.4: The Mul-Tea-Plication Kitchen (Column Tea: A · x)         */
  /* Notebook Cell [51]: render_chai_kitchen                             */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-tea-kitchen', function () {
    const box = LA.lab('#lab-tea-kitchen', {
      cell: 51,
      icon: '🍵',
      kicker: 'Physical Metaphor Studio',
      title: 'The Mul-Tea-Plication Kitchen: Column Tea Linear Combination',
      cols: 3,
      onReset: () => { x1_sl.set(1.5); x2_sl.set(1.0); x3_sl.set(1.0); }
    });

    const presetSeg = LA.seg({
      label: 'Recipe Presets:',
      options: [
        { value: 'custom', label: 'Custom' },
        { value: 'kadak', label: 'Kadak Chai (Strong)' },
        { value: 'doodh', label: 'Doodh Chai (Milky)' },
        { value: 'sweet', label: 'Kashmiri Sweet (Sweet)' }
      ],
      value: 'custom',
      onChange: (v) => {
        if (v === 'kadak') { x1_sl.set(2.5); x2_sl.set(0.5); x3_sl.set(0.75); }
        else if (v === 'doodh') { x1_sl.set(0.75); x2_sl.set(2.5); x3_sl.set(1.0); }
        else if (v === 'sweet') { x1_sl.set(1.0); x2_sl.set(1.5); x3_sl.set(2.75); }
      }
    });

    const x1_sl = LA.slider({ label: 'Tea Leaves (x₁ scoops):', min: 0, max: 3, step: 0.25, value: 1.5, color: '#B45309', onInput: render });
    const x2_sl = LA.slider({ label: 'Milk (x₂ cups):', min: 0, max: 3, step: 0.25, value: 1.0, color: '#D97706', onInput: render });
    const x3_sl = LA.slider({ label: 'Sugar (x₃ spoons):', min: 0, max: 3, step: 0.25, value: 1.0, color: '#0284C7', onInput: render });

    box.controls.append(presetSeg.el, x1_sl.el, x2_sl.el, x3_sl.el);

    // Matrix A: Ingredients as Columns
    const A_tea = [
      [4.0, 0.2, 0.0], // Boldness
      [0.5, 5.0, 0.2], // Creaminess
      [0.0, 1.2, 6.0]  // Sweetness
    ];

    const panelMat = el('div', { class: 'panel' }, el('div', { class: 'panel-title', text: '🏺 Matrix A (Pantry Ingredient Jars)' }));
    const panelCup = el('div', { class: 'panel' }, el('div', { class: 'panel-title', text: '☕ Physical Brewed Chai Glass' }));
    const panelBars = el('div', { class: 'panel' }, el('div', { class: 'panel-title', text: '📊 Output Vector Ax (Taste Sensory Radar)' }));

    const plotCup = new LA.Plot2D(panelCup, { xmin: -1.2, xmax: 1.2, ymin: -0.2, ymax: 3.8, height: 380 });
    const plotBars = new LA.Plot2D(panelBars, { xmin: -0.8, xmax: 2.8, ymin: 0, ymax: 25, height: 380 });

    box.stage.append(panelMat, panelCup, panelBars);

    function render() {
      const x1 = x1_sl.value, x2 = x2_sl.value, x3 = x3_sl.value;
      const x_vec = [x1, x2, x3];

      const col_tea = M.scale([4.0, 0.5, 0.0], x1);
      const col_milk = M.scale([0.2, 5.0, 1.2], x2);
      const col_sugar = M.scale([0.0, 0.2, 6.0], x3);

      const Ax = [
        col_tea[0] + col_milk[0] + col_sugar[0],
        col_tea[1] + col_milk[1] + col_sugar[1],
        col_tea[2] + col_milk[2] + col_sugar[2]
      ];

      setStatus(box.status, 'good',
        `<b>Column Linear Combination:</b> $A\\mathbf{x} = ${fmt(x1, 2)} \\begin{bmatrix}4.0\\\\0.5\\\\0.0\\end{bmatrix} + ${fmt(x2, 2)} \\begin{bmatrix}0.2\\\\5.0\\\\1.2\\end{bmatrix} + ${fmt(x3, 2)} \\begin{bmatrix}0.0\\\\0.2\\\\6.0\\end{bmatrix} = \\begin{bmatrix}${fmt(Ax[0], 1)}\\\\${fmt(Ax[1], 1)}\\\\${fmt(Ax[2], 1)}\\end{bmatrix}$`
      );

      // 1. Matrix A breakdown table
      panelMat.innerHTML = `<div class="panel-title">🏺 Matrix A (Pantry Ingredient Jars)</div>
      <div style="font-size:13.5px; margin-bottom:8px">Columns are ingredients; rows are sensory metrics:</div>
      <table class="nice" style="margin:0">
        <tr><th>Metric</th><th>Tea (${fmt(x1, 1)})</th><th>Milk (${fmt(x2, 1)})</th><th>Sugar (${fmt(x3, 1)})</th></tr>
        <tr><td><b>Boldness</b></td><td>4.0</td><td>0.2</td><td>0.0</td></tr>
        <tr><td><b>Creaminess</b></td><td>0.5</td><td>5.0</td><td>0.2</td></tr>
        <tr><td><b>Sweetness</b></td><td>0.0</td><td>1.2</td><td>6.0</td></tr>
      </table>`;

      // 2. Physical Cup simulation
      plotCup.render((p) => {
        p.frame({ grid: false, axes: false, ticks: false, title: `Brewed Chai Glass (Vol: ${fmt(x1+x2+x3*0.2, 1)})` });

        // Glass contour
        p.poly([[-0.6, 0.2], [-0.8, 3.2], [0.8, 3.2], [0.6, 0.2]], { fill: '#F8FAFC', stroke: '#64748B', width: 3 });

        // Liquid level & color
        const total = x1 + x2 + x3 * 0.2;
        const fillHeight = LA.clamp(0.2 + (total / 6.0) * 2.8, 0.2, 3.1);
        const milkRatio = (x1 + x2 > 0.05) ? (x2 / (x1 + x2)) : 0.5;

        // Chai color blend
        const r = (1 - milkRatio) * 0.45 + milkRatio * 0.94;
        const g_c = (1 - milkRatio) * 0.22 + milkRatio * 0.82;
        const b = (1 - milkRatio) * 0.08 + milkRatio * 0.65;
        const chaiColor = `rgb(${Math.round(r*255)}, ${Math.round(g_c*255)}, ${Math.round(b*255)})`;

        const topW = 0.6 + (fillHeight - 0.2) * (0.2 / 3.0);
        p.poly([[-0.58, 0.22], [-topW, fillHeight], [topW, fillHeight], [0.58, 0.22]], { fill: chaiColor, stroke: false });
        p.poly([[-topW, fillHeight], [topW, fillHeight]], { stroke: '#78350F', width: 2 });
      });

      // 3. Profile bars
      plotBars.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xticks: [
            { v: 0, label: 'Boldness' },
            { v: 1, label: 'Creaminess' },
            { v: 2, label: 'Sweetness' }
          ],
          ylabel: 'Taste Intensity',
          title: `Result: [${fmt(Ax[0], 1)}, ${fmt(Ax[1], 1)}, ${fmt(Ax[2], 1)}]ᵀ`
        });

        const width = 0.22;
        // Tea component
        p.bar(0 - width, 0, col_tea[0], width, { color: '#B45309' });
        p.bar(1 - width, 0, col_tea[1], width, { color: '#B45309' });
        p.bar(2 - width, 0, col_tea[2], width, { color: '#B45309' });

        // Milk component
        p.bar(0, 0, col_milk[0], width, { color: '#FDE68A' });
        p.bar(1, 0, col_milk[1], width, { color: '#FDE68A' });
        p.bar(2, 0, col_milk[2], width, { color: '#FDE68A' });

        // Sugar component
        p.bar(0 + width, 0, col_sugar[0], width, { color: '#38BDF8' });
        p.bar(1 + width, 0, col_sugar[1], width, { color: '#38BDF8' });
        p.bar(2 + width, 0, col_sugar[2], width, { color: '#38BDF8' });

        // Result markers
        p.point([0, Ax[0]], { color: C.red, size: 6, label: fmt(Ax[0], 1), labelStyle: { dy: -10, bold: true } });
        p.point([1, Ax[1]], { color: C.red, size: 6, label: fmt(Ax[1], 1), labelStyle: { dy: -10, bold: true } });
        p.point([2, Ax[2]], { color: C.red, size: 6, label: fmt(Ax[2], 1), labelStyle: { dy: -10, bold: true } });
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 2.5: Binary Images Transformation Studio (P · X · Q)          */
  /* Notebook Cell [54]: render_equation_and_image                       */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-binary-image-studio', function () {
    const box = LA.lab('#lab-binary-image-studio', {
      cell: 54,
      icon: '🖼️',
      kicker: 'Digital Image Processing',
      title: 'Binary Images as Matrices Studio: Left Multiplier P vs Right Q',
      onReset: () => { imgPick.set('F'); leftPick.set('U'); rightPick.set('R'); }
    });

    const imgPick = LA.select({
      label: 'Select Test Shape (Matrix X):',
      options: [
        { value: 'F', label: 'Asymmetric Letter F (Best for testing flips!)' },
        { value: 'center', label: '2×2 Center Block (X₀)' },
        { value: 'L', label: 'L-Shape (X_L)' },
        { value: 'diag', label: 'Main Diagonal (I₄)' }
      ],
      value: 'F',
      onChange: render
    });

    const leftPick = LA.select({
      label: 'Left Multiplier P (Acts on ROWS):',
      options: [
        { value: 'I', label: 'Identity I (No vertical motion)' },
        { value: 'U', label: 'Shift Up U (Rows move up)' },
        { value: 'D', label: 'Shift Down D (Rows move down)' },
        { value: 'F', label: 'Flip Vertical F (Upside down)' },
        { value: 'U2', label: 'Shift Up 2 U² (Rows up by 2)' },
        { value: 'D2', label: 'Shift Down 2 D² (Rows down by 2)' }
      ],
      value: 'U',
      onChange: render
    });

    const rightPick = LA.select({
      label: 'Right Multiplier Q (Acts on COLUMNS):',
      options: [
        { value: 'I', label: 'Identity I (No horizontal motion)' },
        { value: 'L', label: 'Shift Left L (Cols move left)' },
        { value: 'R', label: 'Shift Right R (Cols move right)' },
        { value: 'F', label: 'Flip Horizontal F (Mirror reflection)' },
        { value: 'L2', label: 'Shift Left 2 L² (Cols left by 2)' },
        { value: 'R2', label: 'Shift Right 2 R² (Cols right by 2)' }
      ],
      value: 'R',
      onChange: render
    });

    box.controls.append(imgPick.el, leftPick.el, rightPick.el);

    const matricesWrap = el('div', { class: 'mat-eq' });
    box.stage.append(matricesWrap);

    // Shapes
    const X_shapes = {
      F: [[1,1,1,0],[1,0,0,0],[1,1,0,0],[1,0,0,0]],
      center: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
      L: [[1,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]],
      diag: [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    };

    // Multipliers
    const I4 = M.eye(4);
    const U4 = M.shiftUp(4, 1);
    const D4 = M.shiftDown(4, 1);
    const F4 = M.flip(4);

    const opDict = {
      I: I4,
      U: U4,
      D: D4,
      F: F4,
      U2: M.shiftUp(4, 2),
      D2: M.shiftDown(4, 2),
      L: D4, // on right, D acts as Left Shift
      R: U4, // on right, U acts as Right Shift
      L2: M.shiftDown(4, 2),
      R2: M.shiftUp(4, 2)
    };

    function render() {
      const X = X_shapes[imgPick.value];
      const P = opDict[leftPick.value];
      const Q = opDict[rightPick.value];

      const PXQ = M.mul(M.mul(P, X), Q);

      setStatus(box.status, 'info',
        `<b>Algebraic Duality:</b> Left multiplier $P$ controls vertical motion (row operations). Right multiplier $Q$ controls horizontal motion (column operations). Result: <b>$P \\cdot X \\cdot Q$</b>.`
      );

      matricesWrap.innerHTML = '';

      function drawMatrixTable(mat, title, color, bg) {
        const wrap = el('div', { class: 'mat-fig' });
        wrap.append(el('div', { class: 'cap', style: { color }, text: title }));
        const grid = el('div', { class: 'mat-grid', style: { gridTemplateColumns: 'repeat(4, 34px)', borderColor: color, background: bg } });
        mat.forEach(row => {
          row.forEach(val => {
            const cell = el('div', { text: String(val) });
            if (val > 0) { cell.classList.add('on'); cell.style.background = color; cell.style.color = '#fff'; }
            grid.append(cell);
          });
        });
        wrap.append(grid);
        return wrap;
      }

      matricesWrap.append(drawMatrixTable(P, 'Left P (Rows)', C.purple, '#F5F3FF'));
      matricesWrap.append(el('span', { class: 'sym', text: '·' }));
      matricesWrap.append(drawMatrixTable(X, 'Shape X', C.blue, '#EFF6FF'));
      matricesWrap.append(el('span', { class: 'sym', text: '·' }));
      matricesWrap.append(drawMatrixTable(Q, 'Right Q (Cols)', C.green, '#F0FDF4'));
      matricesWrap.append(el('span', { class: 'sym', text: '=' }));
      matricesWrap.append(drawMatrixTable(PXQ, 'Result (P·X·Q)', C.orange, '#FFF7ED'));
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 2.6: Canteen Menu Studio: Matrix-Matrix Product AB              */
  /* Notebook Cell [58]: render_canteen_menu                             */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-canteen-menu-studio', function () {
    const box = LA.lab('#lab-canteen-menu-studio', {
      cell: 58,
      icon: '🍲',
      kicker: 'Matrix-Matrix Multiplication',
      title: 'From One Recipe to a Recipe Book: Menu Matrix (A · B)',
      onReset: () => {
        viewMode.set('col');
        d1_rice.set(1.0);
        d2_paneer.set(1.0);
        d3_paneer.set(2.0);
      }
    });

    const viewMode = LA.seg({
      label: 'Inspection Mode:',
      options: [
        { value: 'col', label: 'Column View: Finished Dishes' },
        { value: 'row', label: 'Row View: Property Across Menu' }
      ],
      value: 'col',
      onChange: render
    });

    const d1_rice = LA.slider({ label: 'Dish 1 Rice units:', min: 0.0, max: 3.0, step: 0.5, value: 1.0, color: C.amber, onInput: render });
    const d2_paneer = LA.slider({ label: 'Dish 2 Paneer units:', min: 0.0, max: 3.0, step: 0.5, value: 1.0, color: C.emerald, onInput: render });
    const d3_paneer = LA.slider({ label: 'Dish 3 Paneer units:', min: 0.0, max: 3.0, step: 0.5, value: 2.0, color: C.blue, onInput: render });

    box.controls.append(viewMode.el, d1_rice.el, d2_paneer.el, d3_paneer.el);

    const layoutWrap = el('div', { style: 'display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 10px;' });
    const matrixCard = el('div', { class: 'card', style: 'padding: 14px 16px;' });
    const plotContainer = el('div', { class: 'plot2d', style: 'height: 380px;' });
    layoutWrap.append(matrixCard, plotContainer);
    box.stage.append(layoutWrap);

    const plot = new LA.Plot2D(plotContainer, { xmin: -0.5, xmax: 3.5, ymin: 0, ymax: 550, height: 380 });

    const A = [
      [20.0, 60.0, 30.0],   // Cost (₹)
      [200.0, 250.0, 80.0], // Calories (kcal)
      [4.0, 18.0, 3.0]      // Protein (g)
    ];

    function render() {
      const B = [
        [d1_rice.value, 1.0, 0.0],
        [0.0, d2_paneer.value, d3_paneer.value],
        [1.0, 1.0, 1.0]
      ];

      // Multiply AB
      const AB = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let k = 0; k < 3; k++) sum += A[r][k] * B[k][c];
          AB[r][c] = sum;
        }
      }

      const isCol = viewMode.value === 'col';
      if (isCol) {
        setStatus(box.status, 'good',
          '<b>Column Interpretation:</b> Each column of $AB$ is the finished nutritional output vector of one complete dish ($A \\cdot \\mathbf{b}_j$).'
        );
      } else {
        setStatus(box.status, 'good',
          '<b>Row Interpretation:</b> Each row of $AB$ tracks a single nutritional property (Cost, Calories, or Protein) across the entire menu ($(\\text{Row}_i A) \\cdot B$).'
        );
      }

      matrixCard.innerHTML = `
        <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:var(--brand); margin-bottom:8px;">
          Product Matrix AB (3 Properties × 3 Dishes)
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:12.5px; text-align:center;">
          <thead>
            <tr style="border-bottom:1px solid var(--line);">
              <th style="padding:6px; text-align:left;">Property</th>
              <th style="padding:6px; color:#b45309;">Dish 1 (Rice+Veg)</th>
              <th style="padding:6px; color:#15803d;">Dish 2 (Fried Rice)</th>
              <th style="padding:6px; color:#1d4ed8;">Dish 3 (Paneer Stack)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--line);">
              <td style="padding:6px; font-weight:bold; text-align:left; color:#f59e0b;">Cost (₹)</td>
              <td style="padding:6px; font-weight:bold;">${fmt(AB[0][0], 0)}</td>
              <td style="padding:6px; font-weight:bold;">${fmt(AB[0][1], 0)}</td>
              <td style="padding:6px; font-weight:bold;">${fmt(AB[0][2], 0)}</td>
            </tr>
            <tr style="border-bottom:1px solid var(--line);">
              <td style="padding:6px; font-weight:bold; text-align:left; color:#ef4444;">Calories (kcal)</td>
              <td style="padding:6px; font-weight:bold;">${fmt(AB[1][0], 0)}</td>
              <td style="padding:6px; font-weight:bold;">${fmt(AB[1][1], 0)}</td>
              <td style="padding:6px; font-weight:bold;">${fmt(AB[1][2], 0)}</td>
            </tr>
            <tr>
              <td style="padding:6px; font-weight:bold; text-align:left; color:#10b981;">Protein (g)</td>
              <td style="padding:6px; font-weight:bold;">${fmt(AB[2][0], 0)}</td>
              <td style="padding:6px; font-weight:bold;">${fmt(AB[2][1], 0)}</td>
              <td style="padding:6px; font-weight:bold;">${fmt(AB[2][2], 0)}</td>
            </tr>
          </tbody>
        </table>
        <div style="font-size:12px; color:var(--muted); margin-top:10px; line-height:1.4;">
          <b>Dimensions:</b> $(3\\times 3) \\times (3\\times 3) = 3\\times 3$.
        </div>
      `;

      plot.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: isCol ? 'Dish' : 'Dish Number',
          ylabel: 'Value',
          xticks: [
            { v: 0.5, label: 'Dish 1' },
            { v: 1.5, label: 'Dish 2' },
            { v: 2.5, label: 'Dish 3' }
          ],
          title: isCol ? 'Finished Dishes: Grouped Bar Profiles' : 'Property Profiles Across Menu'
        });

        if (isCol) {
          // Bar charts for each dish
          const dishes = [0, 1, 2];
          dishes.forEach((d) => {
            const cx = d + 0.5;
            p.bar(cx - 0.22, 0, AB[0][d], 0.18, { color: '#f59e0b', stroke: '#d97706' });
            p.bar(cx, 0, AB[1][d], 0.18, { color: '#ef4444', stroke: '#dc2626' });
            p.bar(cx + 0.22, 0, AB[2][d] * 10, 0.18, { color: '#10b981', stroke: '#059669' });
          });
          p.legend([
            { label: 'Cost (₹)', color: '#f59e0b', kind: 'box' },
            { label: 'Calories (kcal)', color: '#ef4444', kind: 'box' },
            { label: 'Protein (g × 10)', color: '#10b981', kind: 'box' }
          ], 'tr');
        } else {
          // Line plots for each property
          const ptsCost = [[0.5, AB[0][0]], [1.5, AB[0][1]], [2.5, AB[0][2]]];
          const ptsCal = [[0.5, AB[1][0]], [1.5, AB[1][1]], [2.5, AB[1][2]]];
          const ptsProt = [[0.5, AB[2][0] * 10], [1.5, AB[2][1] * 10], [2.5, AB[2][2] * 10]];

          p.polyline(ptsCost, { color: '#f59e0b', width: 3 });
          p.polyline(ptsCal, { color: '#ef4444', width: 3 });
          p.polyline(ptsProt, { color: '#10b981', width: 3 });

          ptsCost.forEach((pt) => p.point(pt, { color: '#f59e0b', size: 5 }));
          ptsCal.forEach((pt) => p.point(pt, { color: '#ef4444', size: 5 }));
          ptsProt.forEach((pt) => p.point(pt, { color: '#10b981', size: 5 }));

          p.legend([
            { label: 'Cost Row: Row₁(A) · B', color: '#f59e0b', kind: 'line' },
            { label: 'Calories Row: Row₂(A) · B', color: '#ef4444', kind: 'line' },
            { label: 'Protein Row: Row₃(A) · B (×10)', color: '#10b981', kind: 'line' }
          ], 'tr');
        }
      });
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 2.7: Color Palette Studio: CD Base Lights x Recipes            */
  /* Notebook Cell [60]: render_palette                                  */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-color-palette-studio', function () {
    const box = LA.lab('#lab-color-palette-studio', {
      cell: 60,
      icon: '🎨',
      kicker: 'Cross-Domain Isomorphism',
      title: 'Color Palette Studio: Matrix Product C · D',
      onReset: () => { s2_amber.set(0.5); s2_cyan.set(0.5); }
    });

    const s2_amber = LA.slider({ label: 'Swatch 2 Amber Ratio:', min: 0.0, max: 1.0, step: 0.1, value: 0.5, color: C.amber, onInput: render });
    const s2_cyan = LA.slider({ label: 'Swatch 2 Cyan Ratio:', min: 0.0, max: 1.0, step: 0.1, value: 0.5, color: C.teal, onInput: render });

    box.controls.append(s2_amber.el, s2_cyan.el);

    const swatchesWrap = el('div', { style: 'display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 14px;' });
    box.stage.append(swatchesWrap);

    // Base light matrix C: [R, G, B] x [Amber, Cyan]
    const C_base = [
      [1.0, 0.0],
      [0.5, 1.0],
      [0.0, 1.0]
    ];

    function render() {
      // Recipe matrix D: 2 base lights x 3 swatches
      const D = [
        [1.0, s2_amber.value, 0.2],
        [0.0, s2_cyan.value,  0.8]
      ];

      // CD = C @ D (3 x 3 palette matrix)
      const CD = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          CD[r][c] = C_base[r][0] * D[0][c] + C_base[r][1] * D[1][c];
        }
      }

      setStatus(box.status, 'good',
        `<b>Isomorphic Structure:</b> $C_{(3\\times 2)} \\times D_{(2\\times 3)} = (CD)_{(3\\times 3)}$. Physical base lights combine into custom swatch colors exactly like canteen recipes!`
      );

      swatchesWrap.innerHTML = '';
      const swatchNames = ['Swatch 1 (Pure Amber)', 'Swatch 2 (Blended)', 'Swatch 3 (Cyan-heavy)'];

      for (let j = 0; j < 3; j++) {
        const r = Math.min(255, Math.round(Math.max(0, CD[0][j]) * 255));
        const g = Math.min(255, Math.round(Math.max(0, CD[1][j]) * 255));
        const b = Math.min(255, Math.round(Math.max(0, CD[2][j]) * 255));
        const rgbStr = `rgb(${r}, ${g}, ${b})`;

        const card = el('div', {
          class: 'card',
          style: 'padding: 16px; display:flex; flex-direction:column; align-items:center; gap:10px;'
        },
          el('div', {
            style: `width: 100%; height: 110px; border-radius: 10px; background: ${rgbStr}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid var(--line);`
          }),
          el('b', { style: 'font-size: 14px; color: var(--ink);', text: swatchNames[j] }),
          el('div', {
            style: 'font-family: var(--mono); font-size: 12.5px; background: var(--bg); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--line);',
            text: `RGB: [${fmt(CD[0][j], 2)}, ${fmt(CD[1][j], 2)}, ${fmt(CD[2][j], 2)}]ᵀ`
          })
        );
        swatchesWrap.append(card);
      }
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 2.8: 8x8 Scale-Up Studio: Powers of Shift Operators            */
  /* Notebook Cell [62]: render_8x8_studio                               */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-8x8-studio', function () {
    const box = LA.lab('#lab-8x8-studio', {
      cell: 62,
      icon: '📐',
      kicker: 'Scale-Up Challenge',
      title: '8×8 Image Studio: Powers of Shift Operators (P_↑k · X_8 · Q_←k)',
      onReset: () => { shiftUp.set(2); shiftLeft.set(2); }
    });

    const shiftUp = LA.slider({ label: 'Shift Up (P = U^k rows):', min: 0, max: 4, step: 1, value: 2, color: C.blue, onInput: render });
    const shiftLeft = LA.slider({ label: 'Shift Left (Q = L^k cols):', min: 0, max: 4, step: 1, value: 2, color: C.orange, onInput: render });

    box.controls.append(shiftUp.el, shiftLeft.el);

    const studioWrap = el('div', { style: 'display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 14px;' });
    const leftWrap = el('div', { class: 'card center', style: 'padding: 16px;' });
    const rightWrap = el('div', { class: 'card center', style: 'padding: 16px;' });
    studioWrap.append(leftWrap, rightWrap);
    box.stage.append(studioWrap);

    // Centered 4x4 block in 8x8 matrix
    const X8 = [];
    for (let r = 0; r < 8; r++) {
      const row = [];
      for (let c = 0; c < 8; c++) row.push((r >= 2 && r <= 5 && c >= 2 && c <= 5) ? 1 : 0);
      X8.push(row);
    }

    function render() {
      const kUp = shiftUp.value;
      const kLeft = shiftLeft.value;

      // Result matrix
      const res = [];
      for (let r = 0; r < 8; r++) {
        const row = [];
        for (let c = 0; c < 8; c++) {
          const origR = r + kUp;
          const origC = c + kLeft;
          if (origR < 8 && origC < 8) {
            row.push(X8[origR][origC]);
          } else {
            row.push(0);
          }
        }
        res.push(row);
      }

      setStatus(box.status, 'good',
        `<b>Shift Composition:</b> $P = U^{${kUp}}$ shifts rows up by ${kUp} (left multiplier), while $Q = L^{${kLeft}}$ shifts columns left by ${kLeft} (right multiplier). Transformed output: $P \\cdot X_8 \\cdot Q$.`
      );

      function drawGridHtml(mat, color, title) {
        let h = `<div style="font-weight:800; font-size:14px; margin-bottom:10px; color:var(--ink);">${title}</div>`;
        h += `<div style="display:inline-grid; grid-template-columns: repeat(8, 26px); gap: 2px; padding: 6px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px;">`;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const val = mat[r][c];
            const bg = val === 1 ? color : 'var(--card)';
            const border = val === 1 ? 'transparent' : 'var(--line)';
            h += `<div style="width:26px; height:26px; background:${bg}; border:1px solid ${border}; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; color:${val === 1 ? '#fff' : 'var(--muted-2)'};">${val}</div>`;
          }
        }
        h += `</div>`;
        return h;
      }

      leftWrap.innerHTML = drawGridHtml(X8, '#2563eb', 'Original Centered 4×4 Block (X₈)');
      rightWrap.innerHTML = drawGridHtml(res, '#ea580c', `Transformed Image: P_↑${kUp} · X₈ · Q_←${kLeft}`);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Code Lab 2: Column-Way Tea Recipe Combiner                         */
  /* Notebook Cell [64]                                                 */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-code-tea-recipe', function () {
    LA.codeLab('#lab-code-tea-recipe', {
      id: 'm2-c1',
      title: 'Challenge 1: The Column-Way "Tea Recipe" Linear Combiner',
      intro: 'Complete the script to multiply matrix $A$ by column vector $x$ using pure <b>Column Slicing</b> (no @ operator!).',
      code: `import numpy as np

# Step 1: Define matrix A and proportion vector x
A = np.array([
    [1,  1,  1],
    [1, -1,  0],
    [1,  1,  1]
])
x = np.array([1, 1, -2])

# Step 2: Extract individual columns using NumPy slicing A[:, col_index]
col_1 = A[:, [[[idx1]]]]
col_2 = A[:, [[[idx2]]]]
col_3 = A[:, [[[idx3]]]]

# Step 3: Compute linear combination using vector x components
tea_mix = ([[[x0]]] * col_1) + ([[[x1]]] * col_2) + ([[[x2]]] * col_3)

print("Resulting Tea Mix Vector via Column-Way:")
print(tea_mix)

# Step 4: Verification check against built-in operator
expected_result = A @ x
if np.array_equal(tea_mix, expected_result):
    print("✅ Correct! You successfully implemented Column-Way multiplication!")
else:
    print("❌ Output mismatch.")`,
      answers: {
        idx1: ['0'],
        idx2: ['1'],
        idx3: ['2'],
        x0: ['x[0]'],
        x1: ['x[1]'],
        x2: ['x[2]']
      },
      hints: {
        idx1: 'First column index in 0-indexed Python is 0',
        idx2: 'Second column index is 1',
        idx3: 'Third column index is 2',
        x0: 'Weight of col_1 is x[0]',
        x1: 'Weight of col_2 is x[1]',
        x2: 'Weight of col_3 is x[2]'
      },
      run: (vals, ok, all) => {
        if (!all) return [{ t: 'err', s: 'Traceback (most recent call last):\nIndexError: invalid column index or weight expression.' }];
        return [
          'Resulting Tea Mix Vector via Column-Way:',
          '[ 0  0  0]',
          { t: 'ok', s: '✅ Correct! You successfully implemented Column-Way multiplication!' }
        ];
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Self-Check Quiz: Module 2                                          */
  /* ------------------------------------------------------------------ */
  LA.mount('quiz-m2', function () {
    LA.quiz('#quiz-m2', {
      title: 'Module 2 Mastery Self-Check',
      questions: [
        {
          q: 'If $A$ is a $2 \\times 3$ matrix and $B$ is a $3 \\times 2$ matrix, what are the dimensions of $AB$ and $BA$?',
          options: [
            '$AB$ is $2 \\times 2$ and $BA$ is $3 \\times 3$. Both exist!',
            '$AB$ is $3 \\times 3$ and $BA$ is $2 \\times 2$.',
            '$AB$ exists, but $BA$ is undefined.'
          ],
          answer: 0,
          explain: 'Inner dimensions match for both: $(2 \\times 3) \\times (3 \\times 2) = (2 \\times 2)$, while $(3 \\times 2) \\times (2 \\times 3) = (3 \\times 3)$. Notice that $AB \\neq BA$!'
        },
        {
          q: 'To shift an image <b>upward by 1 pixel</b>, on which side must the shift matrix $U$ be multiplied?',
          options: [
            'On the Right ($X \\cdot U$)',
            'On the Left ($U \\cdot X$)',
            'On both sides simultaneously'
          ],
          answer: 1,
          explain: 'Multiplying on the Left operates strictly on the horizontal rows of $X$, moving Row 2 to Row 1, Row 3 to Row 2, etc.'
        }
      ]
    });
  });

})();
