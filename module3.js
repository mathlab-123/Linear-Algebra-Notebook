/* =====================================================================
   Module 3: Vectors and their Properties · Interactive Laboratories
   ===================================================================== */
(function () {
  'use strict';
  const { el, M, C, fmt, g, setStatus } = LA;

  /* ------------------------------------------------------------------ */
  /* Lab 3.1: Three Perspectives on a Single Vector (Physics, CS, Math) */
  /* Notebook Cell [70]: render_three_views                              */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-vector-perspectives', function () {
    const box = LA.lab('#lab-vector-perspectives', {
      cell: 70,
      icon: '🏹',
      kicker: 'Cross-Disciplinary Perspectives',
      title: 'The Three Perspectives on a Single Vector (Translation Invariance)',
      onReset: () => { x_sl.set(2.0); y_sl.set(3.0); tx_sl.set(0.0); ty_sl.set(0.0); }
    });

    const x_sl = LA.slider({ label: 'East Displacement (x):', min: -5, max: 5, step: 0.5, value: 2.0, color: C.emerald, onInput: render });
    const y_sl = LA.slider({ label: 'North Displacement (y):', min: -5, max: 5, step: 0.5, value: 3.0, color: C.emerald, onInput: render });
    const tx_sl = LA.slider({ label: 'Tail Anchor X:', min: -4, max: 4, step: 1.0, value: 0.0, color: C.slate, onInput: render });
    const ty_sl = LA.slider({ label: 'Tail Anchor Y:', min: -4, max: 4, step: 1.0, value: 0.0, color: C.slate, onInput: render });

    box.controls.append(x_sl.el, y_sl.el, tx_sl.el, ty_sl.el);

    const cardsRow = el('div', { class: 'cards' });
    const plot = new LA.Plot2D(box.stage, { xmin: -6, xmax: 6, ymin: -6, ymax: 6, height: 420, equal: true });
    box.stage.prepend(cardsRow);

    // Draggable tip and tail handles
    plot.addHandle({
      color: C.slate,
      get: () => [tx_sl.value, ty_sl.value],
      set: (x, y) => { tx_sl.set(x); ty_sl.set(y); render(); }
    });

    plot.addHandle({
      color: C.emerald,
      get: () => [tx_sl.value + x_sl.value, ty_sl.value + y_sl.value],
      set: (x, y) => { x_sl.set(x - tx_sl.value); y_sl.set(y - ty_sl.value); render(); }
    });

    function render() {
      const dx = x_sl.value, dy = y_sl.value;
      const tx = tx_sl.value, ty = ty_sl.value;

      const mag = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1);

      cardsRow.innerHTML = `
        <div class="card blue">
          <span style="font-size:11px; font-weight:800; text-transform:uppercase; color:#1D4ED8;">Physics View (Arrow)</span>
          <div style="font-size:17px; font-weight:bold; color:#1E40AF; margin-top:4px">v = ${dx >= 0 ? '+' : ''}${fmt(dx, 1)}i + ${dy >= 0 ? '+' : ''}${fmt(dy, 1)}j</div>
          <div style="font-size:12.5px; color:#3B82F6; margin-top:2px">||v|| = ${fmt(mag, 2)} | θ = ${angle}°</div>
        </div>
        <div class="card green">
          <span style="font-size:11px; font-weight:800; text-transform:uppercase; color:#047857;">CS View (Data Array)</span>
          <div style="font-size:17px; font-weight:bold; color:#065F46; margin-top:4px">data = [${fmt(dx, 1)}, ${fmt(dy, 1)}]</div>
          <div style="font-size:12.5px; color:#10B981; margin-top:2px">shape: (2,) | float64 array</div>
        </div>
        <div class="card amber">
          <span style="font-size:11px; font-weight:800; text-transform:uppercase; color:#B45309;">Math View (ℝ² Column)</span>
          <div style="font-size:17px; font-weight:bold; color:#92400E; margin-top:4px">v = [${fmt(dx, 1)}, ${fmt(dy, 1)}]ᵀ ∈ ℝ²</div>
          <div style="font-size:12.5px; color:#D97706; margin-top:2px">Column vector in ℝ²</div>
        </div>
      `;

      setStatus(box.status, 'good',
        `<b>Translation Invariance:</b> Drag the grey tail handle across the field. Notice that moving the anchor in space changes <i>none</i> of the three vector definitions. A vector is purely displacement!`
      );

      plot.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'East (+) / West (-)', ylabel: 'North (+) / South (-)',
          title: `Free Vector Invariance: Rooted at (${tx}, ${ty})`
        });

        // Dotted ghost arrow at standard origin if translated
        if (tx !== 0 || ty !== 0) {
          p.arrow([0, 0], [dx, dy], { color: '#94A3B8', width: 2, dash: true });
          p.text([dx / 2, dy / 2], 'Origin Root (0,0)', { color: '#64748B', size: 11 });
        }

        // Primary vector arrow
        p.arrow([tx, ty], [tx + dx, ty + dy], { color: C.emerald, width: 3.5 });

        // Tail point
        p.point([tx, ty], { shape: 'square', color: C.ink, size: 6 });
        // Tip point
        p.point([tx + dx, ty + dy], { shape: 'star', color: C.gold, stroke: '#000', size: 10 });

        p.legend([
          { label: `Tail / Anchor (${tx}, ${ty})`, color: C.ink, kind: 'point', shape: 'square' },
          { label: `Tip (${fmt(tx + dx, 1)}, ${fmt(ty + dy, 1)})`, color: C.gold, kind: 'point', shape: 'star' },
          (tx !== 0 || ty !== 0) ? { label: 'Origin Root Copy', color: '#94A3B8', kind: 'dash' } : null
        ].filter(Boolean), 'br');
      });
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 3.2: Vector Addition & Scaling Geometry (Head-to-Tail vs Law)  */
  /* Notebook Cell [72]: render_vector_geometry                          */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-vector-addition', function () {
    const box = LA.lab('#lab-vector-addition', {
      cell: 72,
      icon: '📐',
      kicker: 'Vector Algebra & Geometry',
      title: 'Addition &amp; Scaling in ℝ²: Head-to-Tail Rule vs. Parallelogram Law',
      onReset: () => { ux_sl.set(3); uy_sl.set(1); vx_sl.set(2); vy_sl.set(3); c_sl.set(1.0); }
    });

    const modeSeg = LA.seg({
      label: 'Addition Rule View:',
      options: [
        { value: 'tail', label: 'Head-to-Tail Rule' },
        { value: 'para', label: 'Parallelogram Law' }
      ],
      value: 'tail',
      onChange: render
    });

    const ux_sl = LA.slider({ label: 'u₁ (x):', min: -4, max: 5, step: 0.5, value: 3.0, color: C.blue, onInput: render });
    const uy_sl = LA.slider({ label: 'u₂ (y):', min: -4, max: 5, step: 0.5, value: 1.0, color: C.blue, onInput: render });
    const vx_sl = LA.slider({ label: 'v₁ (x):', min: -4, max: 5, step: 0.5, value: 2.0, color: C.orange, onInput: render });
    const vy_sl = LA.slider({ label: 'v₂ (y):', min: -4, max: 5, step: 0.5, value: 3.0, color: C.orange, onInput: render });
    const c_sl = LA.slider({ label: 'Scale v (c dial):', min: -2, max: 2.5, step: 0.25, value: 1.0, color: C.purple, onInput: render });

    box.controls.append(modeSeg.el, ux_sl.el, uy_sl.el, vx_sl.el, vy_sl.el, c_sl.el);

    const plot = new LA.Plot2D(box.stage, { xmin: -7, xmax: 9, ymin: -7, ymax: 9, height: 420, equal: true });

    function render() {
      const u = [ux_sl.value, uy_sl.value];
      const cv = [c_sl.value * vx_sl.value, c_sl.value * vy_sl.value];
      const res = [u[0] + cv[0], u[1] + cv[1]];

      setStatus(box.status, 'info',
        `<b>Resultant Sum:</b> $\\mathbf{u} + c\\mathbf{v} = \\begin{bmatrix}${fmt(u[0], 1)}\\\\${fmt(u[1], 1)}\\end{bmatrix} + (${fmt(c_sl.value, 2)}) \\begin{bmatrix}${fmt(vx_sl.value, 1)}\\\\${fmt(vy_sl.value, 1)}\\end{bmatrix} = \\begin{bmatrix}${fmt(res[0], 1)}\\\\${fmt(res[1], 1)}\\end{bmatrix}$`
      );

      plot.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'x', ylabel: 'y',
          title: `Resultant Sum: [${fmt(res[0], 1)}, ${fmt(res[1], 1)}]ᵀ`
        });

        if (modeSeg.value === 'tail') {
          // u from origin
          p.arrow([0, 0], u, { color: C.blue, width: 3 });
          p.text([u[0] / 2 - 0.2, u[1] / 2 + 0.3], 'u', { color: C.navy, size: 14, bold: true });

          // cv attached to tip of u
          p.arrow(u, res, { color: C.orange, width: 3 });
          p.text([u[0] + cv[0] / 2, u[1] + cv[1] / 2 + 0.3], `c·v (${fmt(c_sl.value, 2)}x)`, { color: C.orange, size: 13, bold: true });

          // Resultant from origin
          p.arrow([0, 0], res, { color: C.purple, width: 3.5 });
          p.text([res[0] / 2 + 0.2, res[1] / 2 - 0.3], 'u + c·v', { color: C.purple, size: 14, bold: true });
        } else {
          // Parallelogram fill
          p.poly([[0, 0], u, res, cv], { fill: '#EDE9FE', fillAlpha: 0.6, stroke: '#C4B5FD', width: 1.5, dash: true });

          // Rooted vectors
          p.arrow([0, 0], u, { color: C.blue, width: 3 });
          p.arrow([0, 0], cv, { color: C.orange, width: 3 });

          // Resultant diagonal
          p.arrow([0, 0], res, { color: C.purple, width: 3.5 });
        }

        p.point(res, { shape: 'star', color: C.red, size: 9, label: `Endpoint (${fmt(res[0], 1)}, ${fmt(res[1], 1)})`, labelStyle: { dx: 12, dy: -12, bold: true } });
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 3.3: 2D Continuous Span Explorer (Plane vs 1D Line Trap)       */
  /* Notebook Cell [77]: render_continuous_2d_span                       */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-2d-span', function () {
    const box = LA.lab('#lab-2d-span', {
      cell: 77,
      icon: '🌌',
      kicker: 'Subspace Explorer',
      title: '2D Span Explorer: Continuous Subspace Representation',
      onReset: () => { vx_sl.set(2); vy_sl.set(0); wx_sl.set(1); wy_sl.set(2); c1_sl.set(1.5); c2_sl.set(1.0); }
    });

    const presetSelect = LA.select({
      label: 'Subspace Scenario Presets:',
      options: [
        { value: 'custom', label: 'Custom Vectors' },
        { value: 'indep', label: 'Independent: [2, 0]ᵀ and [1, 2]ᵀ (Fills Entire ℝ²)' },
        { value: 'dep1', label: 'Dependent: [2, 1]ᵀ and [4, 2]ᵀ (Trapped on Line)' },
        { value: 'dep2', label: 'Dependent: [3, -1]ᵀ and [-3, 1]ᵀ (Opposite Directions)' }
      ],
      value: 'custom',
      onChange: (v) => {
        if (v === 'indep') { vx_sl.set(2); vy_sl.set(0); wx_sl.set(1); wy_sl.set(2); }
        else if (v === 'dep1') { vx_sl.set(2); vy_sl.set(1); wx_sl.set(4); wy_sl.set(2); }
        else if (v === 'dep2') { vx_sl.set(3); vy_sl.set(-1); wx_sl.set(-3); wy_sl.set(1); }
      }
    });

    const vx_sl = LA.slider({ label: 'v₁ (x):', min: -4, max: 4, step: 0.5, value: 2.0, color: C.blue, onInput: render });
    const vy_sl = LA.slider({ label: 'v₂ (y):', min: -4, max: 4, step: 0.5, value: 0.0, color: C.blue, onInput: render });
    const wx_sl = LA.slider({ label: 'w₁ (x):', min: -4, max: 4, step: 0.5, value: 1.0, color: C.orange, onInput: render });
    const wy_sl = LA.slider({ label: 'w₂ (y):', min: -4, max: 4, step: 0.5, value: 2.0, color: C.orange, onInput: render });

    const c1_sl = LA.slider({ label: 'c₁ (v weight):', min: -3, max: 3, step: 0.25, value: 1.5, color: C.teal, onInput: render });
    const c2_sl = LA.slider({ label: 'c₂ (w weight):', min: -3, max: 3, step: 0.25, value: 1.0, color: C.amber, onInput: render });

    box.controls.append(presetSelect.el, vx_sl.el, vy_sl.el, wx_sl.el, wy_sl.el, c1_sl.el, c2_sl.el);

    const plot = new LA.Plot2D(box.stage, { xmin: -6, xmax: 6, ymin: -6, ymax: 6, height: 420, equal: true });

    function render() {
      const v = [vx_sl.value, vy_sl.value];
      const w = [wx_sl.value, wy_sl.value];
      const c1 = c1_sl.value, c2 = c2_sl.value;

      const target = [c1 * v[0] + c2 * w[0], c1 * v[1] + c2 * w[1]];
      const det = v[0] * w[1] - v[1] * w[0];
      const isDependent = Math.abs(det) < 1e-4;

      if (!isDependent) {
        setStatus(box.status, 'good',
          `<b>✅ Linearly Independent! (det = ${fmt(det, 2)} ≠ 0):</b> The vectors point in different directions. Their continuous span is the <b>entire 2D plane ℝ²</b>. Every single coordinate is reachable!`
        );
      } else {
        setStatus(box.status, 'bad',
          `<b>❌ Linearly Dependent! (det = 0.0):</b> Vector $\\mathbf{w}$ is collinear with $\\mathbf{v}$. The span collapses to a <b>1D line trap</b>. Any point off this straight line cannot be built!`
        );
      }

      plot.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'x', ylabel: 'y',
          title: isDependent ? 'Span{v, w} = 1D Line Trap' : 'Span{v, w} = Entire 2D Plane ℝ²'
        });

        if (!isDependent) {
          // Shaded wash representing all reachable points
          p.rect(-6, -6, 6, 6, { fill: '#D1FAE5', fillAlpha: 0.45, stroke: false });
        } else {
          // 1D Subspace Line
          p.line(v[1], -v[0], 0, { color: C.red, width: 3.5, dash: true });
        }

        // Vectors
        p.arrow([0, 0], v, { color: C.blue, width: 3.5 });
        p.text(v, `v [${v[0]}, ${v[1]}]ᵀ`, { color: C.navy, size: 12, bold: true, dx: 8, dy: 8 });

        p.arrow([0, 0], w, { color: C.orange, width: 3.5 });
        p.text(w, `w [${w[0]}, ${w[1]}]ᵀ`, { color: C.orange, size: 12, bold: true, dx: 8, dy: 8 });

        // Linear combination path
        const c1v = [c1 * v[0], c1 * v[1]];
        p.arrow([0, 0], c1v, { color: C.blue, width: 1.8, dash: true });
        p.arrow(c1v, target, { color: C.orange, width: 1.8, dash: true });

        // Selected combination star
        p.point(target, {
          shape: 'star', size: 14, color: C.red, stroke: '#000', strokeWidth: 1.5,
          label: `Combo: ${fmt(c1, 2)}v + ${fmt(c2, 2)}w = [${fmt(target[0], 1)}, ${fmt(target[1], 1)}]ᵀ`,
          labelStyle: { dx: 14, dy: -14, bold: true }
        });
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 3.4: Rotatable 3D Span Laboratory (Lines, Planes, Volumes)    */
  /* Notebook Cell [79]: render_3d_lab                                   */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-3d-span-lab', function () {
    const box = LA.lab('#lab-3d-span-lab', {
      cell: 79,
      icon: '🌌',
      kicker: '3D Subspace Laboratory',
      title: 'Rotatable 3D Span Laboratory: All Subspace Geometries in ℝ³',
      onReset: () => { bx_sl.set(2.0); by_sl.set(2.0); bz_sl.set(3.5); }
    });

    const cases = {
      "Case 1: 1D Line Trap (u & v are Collinear)": {
        u: [2.0, 2.0, 1.0],
        v: [4.0, 4.0, 2.0],
        w: [0.0, 0.0, 0.0],
        active: 2,
        type: 'line',
        desc: "v is just 2·u! Both vectors point along the exact same line. The span collapses to a 1D line."
      },
      "Case 2: 2D Plane Trap (u & v Independent, No 3rd Vector)": {
        u: [3.0, 0.0, 1.0],
        v: [0.0, 3.0, 1.0],
        w: [0.0, 0.0, 0.0],
        active: 2,
        type: 'plane',
        desc: "u and v span a tilted 2D sheet. Any target floating off this sheet cannot be reached."
      },
      "Case 3: Redundant Trio (3 Vectors, but w is in the Plane!)": {
        u: [3.0, 0.0, 1.0],
        v: [0.0, 3.0, 1.0],
        w: [3.0, 3.0, 2.0],
        active: 3,
        type: 'plane',
        desc: "w = u + v! Even with 3 vectors, w gives zero new altitude. Span remains a flat 2D plane."
      },
      "Case 4: Full 3D Volume Span (3 Linearly Independent Vectors)": {
        u: [3.0, 0.0, 0.5],
        v: [0.0, 3.0, 0.5],
        w: [0.0, 0.0, 3.0],
        active: 3,
        type: 'volume',
        desc: "w steps out of the plane! Together, their span fills the entire 3D room (all of ℝ³)."
      }
    };

    const scSelect = LA.select({
      label: 'Select 3D Subspace Scenario:',
      options: Object.keys(cases).map(k => ({ value: k, label: k })),
      value: "Case 2: 2D Plane Trap (u & v Independent, No 3rd Vector)",
      onChange: render
    });

    const bx_sl = LA.slider({ label: 'Target b₁ (X):', min: -5, max: 5, step: 0.5, value: 2.0, color: C.red, onInput: render });
    const by_sl = LA.slider({ label: 'Target b₂ (Y):', min: -5, max: 5, step: 0.5, value: 2.0, color: C.red, onInput: render });
    const bz_sl = LA.slider({ label: 'Target b₃ (Z):', min: -5, max: 5, step: 0.5, value: 3.5, color: C.red, onInput: render });

    box.controls.append(scSelect.el, bx_sl.el, by_sl.el, bz_sl.el);

    const plotDiv = el('div', { class: 'plot3d' });
    box.stage.append(plotDiv);

    function render() {
      const cfg = cases[scSelect.value];
      const target = [bx_sl.value, by_sl.value, bz_sl.value];

      const A = cfg.active === 2 ? M.colStack(cfg.u, cfg.v) : M.colStack(cfg.u, cfg.v, cfg.w);
      const lsq = M.lstsq(A, target);
      const isReachable = lsq.gap < 0.05;

      if (isReachable) {
        setStatus(box.status, 'good',
          `<b>🎯 Target b LIES IN THE SPAN! (Ax = b has a solution):</b> ${cfg.desc}<br>Exact Linear Combination: Distance gap = <b>0.00</b>.`
        );
      } else {
        setStatus(box.status, 'bad',
          `<b>🚫 Target b is OUTSIDE THE SPAN! (Ax = b is IMPOSSIBLE):</b> ${cfg.desc}<br>Target b hovers <b>${fmt(lsq.gap, 2)} units</b> off the accessible subspace! Rotate to inspect the gap.`
        );
      }

      const traces = [];

      // 1. Subspace geometry
      if (cfg.type === 'line') {
        const t_line = LA.linspace(-4, 4, 30);
        traces.push({
          type: 'scatter3d', mode: 'lines',
          x: t_line.map(t => t * cfg.u[0]),
          y: t_line.map(t => t * cfg.u[1]),
          z: t_line.map(t => t * cfg.u[2]),
          line: { color: C.red, width: 8 },
          name: 'Span: 1D Line Trap'
        });
      } else if (cfg.type === 'plane') {
        const R = 2;
        const g1 = LA.linspace(-R, R, 9), g2 = LA.linspace(-R, R, 9);
        const X = [], Y = [], Z = [];
        for (const c2 of g2) {
          X.push(g1.map(c1 => c1 * cfg.u[0] + c2 * cfg.v[0]));
          Y.push(g1.map(c1 => c1 * cfg.u[1] + c2 * cfg.v[1]));
          Z.push(g1.map(c1 => c1 * cfg.u[2] + c2 * cfg.v[2]));
        }
        traces.push({
          type: 'surface', x: X, y: Y, z: Z,
          colorscale: LA.solidScale('#0D9488'), opacity: 0.5, showscale: false,
          name: 'Span: 2D Plane Sheet'
        });
      }

      // Motor vectors
      traces.push({
        type: 'scatter3d', mode: 'lines+markers+text',
        x: [0, cfg.u[0]], y: [0, cfg.u[1]], z: [0, cfg.u[2]],
        line: { color: '#2563EB', width: 8 },
        marker: { size: [3, 7], color: '#2563EB' },
        text: ['', `u [${cfg.u[0]}, ${cfg.u[1]}, ${cfg.u[2]}]ᵀ`],
        name: 'Vector u'
      });

      traces.push({
        type: 'scatter3d', mode: 'lines+markers+text',
        x: [0, cfg.v[0]], y: [0, cfg.v[1]], z: [0, cfg.v[2]],
        line: { color: '#EA580C', width: 8 },
        marker: { size: [3, 7], color: '#EA580C' },
        text: ['', `v [${cfg.v[0]}, ${cfg.v[1]}, ${cfg.v[2]}]ᵀ`],
        name: 'Vector v'
      });

      if (cfg.active === 3 && M.norm(cfg.w) > 0) {
        traces.push({
          type: 'scatter3d', mode: 'lines+markers+text',
          x: [0, cfg.w[0]], y: [0, cfg.w[1]], z: [0, cfg.w[2]],
          line: { color: '#7C3AED', width: 8 },
          marker: { size: [3, 7], color: '#7C3AED' },
          text: ['', `w [${cfg.w[0]}, ${cfg.w[1]}, ${cfg.w[2]}]ᵀ`],
          name: 'Vector w'
        });
      }

      // Target Vector
      traces.push({
        type: 'scatter3d', mode: 'lines+markers+text',
        x: [0, target[0]], y: [0, target[1]], z: [0, target[2]],
        line: { color: '#DC2626', width: 6, dash: 'dash' },
        marker: { size: [3, 11], color: '#DC2626', symbol: 'diamond' },
        text: ['', `Target b [${target[0]}, ${target[1]}, ${target[2]}]ᵀ`],
        name: 'Target b'
      });

      // Gap line if unreachable
      if (!isReachable) {
        traces.push({
          type: 'scatter3d', mode: 'lines+markers',
          x: [lsq.closest[0], target[0]],
          y: [lsq.closest[1], target[1]],
          z: [lsq.closest[2], target[2]],
          line: { color: '#B91C1C', width: 5, dash: 'dot' },
          marker: { size: 5, color: '#B91C1C' },
          name: 'Distance Gap (Unreachable)'
        });
      }

      LA.plot3d(plotDiv, traces, {
        range: 6,
        uirevision: '3d-span-lab'
      });
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 3.5: The Linear Alchemist Capstone Game                        */
  /* Notebook Cell [86]: render_game_scene                               */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-linear-alchemist-game', function () {
    const box = LA.lab('#lab-linear-alchemist-game', {
      cell: 86,
      icon: '🎮',
      kicker: 'Capstone Challenge',
      title: 'The Linear Alchemist: Cross-Domain Synthesis Studio',
      onReset: () => { d1_sl.set(0.2); d2_sl.set(0.2); }
    });

    const levelSelect = LA.select({
      label: 'Select Challenge Level:',
      options: [
        { value: 'lvl1', label: 'Level 1: Stage Light Alchemist (Color Blending)' },
        { value: 'lvl2', label: 'Level 2: Drone Flight Navigation (Head-to-Tail)' },
        { value: 'lvl3', label: 'Level 3: Subspace Span Detective (Solvability Verdict)' }
      ],
      value: 'lvl1',
      onChange: render
    });

    const d1_sl = LA.slider({ label: 'Dial 1 (x₁):', min: 0, max: 1, step: 0.05, value: 0.2, color: C.blue, onInput: render });
    const d2_sl = LA.slider({ label: 'Dial 2 (x₂):', min: 0, max: 1, step: 0.05, value: 0.2, color: C.orange, onInput: render });

    // Level 3 specific controls
    const l3_target = LA.seg({
      label: 'Examine Target:',
      options: [
        { value: 'alpha', label: 'Target Alpha [2, 2, 2]ᵀ' },
        { value: 'beta', label: 'Target Beta [2, 2, 4]ᵀ' }
      ],
      value: 'alpha',
      onChange: render
    });

    const l3_verdict = LA.seg({
      label: 'Your Verdict:',
      options: [
        { value: 'in', label: 'Within Span (Solvable)' },
        { value: 'out', label: 'Outside Span (Impossible)' }
      ],
      value: 'in',
      onChange: render
    });

    box.controls.append(levelSelect.el, d1_sl.el, d2_sl.el, l3_target.el, l3_verdict.el);

    const gameStage = el('div', { class: 'lab-stage' });
    box.stage.append(gameStage);

    function render() {
      const lvl = levelSelect.value;
      gameStage.innerHTML = '';

      if (lvl === 'lvl1') {
        d1_sl.el.style.display = 'flex'; d2_sl.el.style.display = 'flex';
        l3_target.el.style.display = 'none'; l3_verdict.el.style.display = 'none';
        d1_sl.setLabel('Bulb 1 (x₁):'); d2_sl.setLabel('Bulb 2 (x₂):');

        const x1 = d1_sl.value, x2 = d2_sl.value;
        const c1 = [1.0, 0.2, 0.0]; // Warm Red
        const c2 = [0.0, 0.8, 1.0]; // Cyan
        const curColor = [x1 * c1[0] + x2 * c2[0], x1 * c1[1] + x2 * c2[1], x1 * c1[2] + x2 * c2[2]];
        const targetColor = [0.60, 0.52, 0.50];

        const err = Math.hypot(curColor[0] - targetColor[0], curColor[1] - targetColor[1], curColor[2] - targetColor[2]);
        const isSolved = err < 0.06;

        if (isSolved) {
          setStatus(box.status, 'good', '🎉 COLOR MATCHED! Exact recipe found: 0.60·Bulb₁ + 0.50·Bulb₂ = Target Stage Beam!');
        } else {
          setStatus(box.status, 'warn', `Keep blending! Color difference metric: <b>${fmt(err, 3)}</b>. Adjust the dials to match the target swatch.`);
        }

        const sw1 = el('div', { class: 'swatch', style: { background: `rgb(${Math.round(curColor[0]*255)}, ${Math.round(curColor[1]*255)}, ${Math.round(curColor[2]*255)})` } }, el('span', { text: `Your Beam: [${fmt(curColor[0], 2)}, ${fmt(curColor[1], 2)}, ${fmt(curColor[2], 2)}]ᵀ` }));
        const sw2 = el('div', { class: 'swatch', style: { background: `rgb(${Math.round(targetColor[0]*255)}, ${Math.round(targetColor[1]*255)}, ${Math.round(targetColor[2]*255)})` } }, el('span', { text: 'Target Color (b): [0.60, 0.52, 0.50]ᵀ' }));
        gameStage.classList.add('cols-2');
        gameStage.append(sw1, sw2);
      } else if (lvl === 'lvl2') {
        d1_sl.el.style.display = 'flex'; d2_sl.el.style.display = 'flex';
        l3_target.el.style.display = 'none'; l3_verdict.el.style.display = 'none';
        d1_sl.setLabel('Motor u (x₁):'); d2_sl.setLabel('Motor v (x₂):');

        const x1 = d1_sl.value, x2 = d2_sl.value;
        const u = [2.0, 1.0], v = [-1.0, 2.0];
        const target = [3.0, 4.0];
        const cur = [x1 * u[0] + x2 * v[0], x1 * u[1] + x2 * v[1]];
        const dist = Math.hypot(cur[0] - target[0], cur[1] - target[1]);
        const isSolved = dist < 0.2;

        if (isSolved) {
          setStatus(box.status, 'good', '🎯 CERTIFICATES DELIVERED! Exact combination: 2.0·u + 1.0·v = Target Landing Star [3, 4]ᵀ!');
        } else {
          setStatus(box.status, 'warn', `Drone en route. Distance to landing star: <b>${fmt(dist, 2)} units</b>.`);
        }

        gameStage.classList.remove('cols-2');
        const plotDrone = new LA.Plot2D(gameStage, { xmin: -5, xmax: 6, ymin: -3, ymax: 6, height: 400 });
        plotDrone.render((p) => {
          p.frame({ grid: true, axes: true, ticks: true, xlabel: 'x', ylabel: 'y', title: 'Drone Flight Arena' });

          const leg1 = [x1 * u[0], x1 * u[1]];
          p.arrow([0, 0], leg1, { color: C.blue, width: 3 });
          p.arrow(leg1, cur, { color: C.orange, width: 3 });

          p.point(target, { shape: 'star', color: C.red, size: 14, label: 'Target [3, 4]ᵀ' });
          p.point(cur, { shape: 'circle', color: C.green, size: 8 });
        });
      } else {
        d1_sl.el.style.display = 'none'; d2_sl.el.style.display = 'none';
        l3_target.el.style.display = 'flex'; l3_verdict.el.style.display = 'flex';

        const isAlpha = l3_target.value === 'alpha';
        const userSaysIn = l3_verdict.value === 'in';
        // Subspace: u=[2,0,1], v=[0,2,1]. Plane: z = 0.5x + 0.5y
        // Alpha: [2,2,2] => z = 1+1=2 (In plane!)
        // Beta: [2,2,4] => z = 4 != 2 (Off plane!)
        const trulyIn = isAlpha;

        if (userSaysIn === trulyIn) {
          setStatus(box.status, 'good', `🎉 CORRECT VERDICT! ${isAlpha ? 'Target Alpha sits squarely within Span{u, v}.' : 'Target Beta hovers 2 units above the plane—it is mathematically unreachable!'}`);
        } else {
          setStatus(box.status, 'bad', `❌ INCORRECT VERDICT. ${isAlpha ? 'Target Alpha CAN be formed as 1·u + 1·v.' : 'Target Beta cannot be built—it has non-zero vertical gap!'}`);
        }

        gameStage.classList.remove('cols-2');
        const p3d = el('div', { class: 'plot3d' });
        gameStage.append(p3d);

        const targetVec = isAlpha ? [2, 2, 2] : [2, 2, 4];
        LA.plot3d(p3d, [
          LA.zSurface((x, y) => 0.5 * x + 0.5 * y, { name: 'Plane Subspace', color: '#0D9488', opacity: 0.45, range: 4 }),
          { type: 'scatter3d', mode: 'lines+markers+text', x: [0, 2], y: [0, 0], z: [0, 1], line: { color: C.blue, width: 7 }, name: 'u [2,0,1]' },
          { type: 'scatter3d', mode: 'lines+markers+text', x: [0, 0], y: [0, 2], z: [0, 1], line: { color: C.orange, width: 7 }, name: 'v [0,2,1]' },
          { type: 'scatter3d', mode: 'markers+text', x: [targetVec[0]], y: [targetVec[1]], z: [targetVec[2]], marker: { size: 10, color: C.red }, text: [`Target [${targetVec[0]}, ${targetVec[1]}, ${targetVec[2]}]`], name: 'Target' }
        ], { range: 4, uirevision: 'capstone' });
      }
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Code Lab 3: Vector Addition & Scaling                             */
  /* Notebook Cell [90]                                                 */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-code-vector-ops', function () {
    LA.codeLab('#lab-code-vector-ops', {
      id: 'm3-c1',
      title: 'Challenge 1: Vector Addition & Scaling (Fill-in-the-Blanks)',
      intro: 'Complete the script to perform basic component-wise vector addition and scalar multiplication.',
      code: `import numpy as np

# Step 1: Initialize vectors u and v
u = np.array([4, -2])
v = np.array([-1, 5])
c = 3

# Step 2: Add vectors u and v
u_plus_v = [[[u_var]]] + [[[v_var]]]

# Step 3: Scale vector u by scalar c
scaled_u = [[[c_var]]] * [[[u_var2]]]

print("u + v =", u_plus_v)
print("c * u  =", scaled_u)

# Step 4: Verification check
if np.array_equal(u_plus_v, np.array([3, 3])) and np.array_equal(scaled_u, np.array([12, -6])):
    print("✅ Great job! Vector addition and scaling are correct!")
else:
    print("❌ Incorrect output.")`,
      answers: {
        u_var: ['u'],
        v_var: ['v'],
        c_var: ['c'],
        u_var2: ['u']
      },
      hints: {
        u_var: 'First add vector u',
        v_var: 'Then add vector v',
        c_var: 'Multiply scalar c',
        u_var2: 'With vector u'
      },
      run: (vals, ok, all) => {
        if (!all) return [{ t: 'err', s: 'Traceback (most recent call last):\nNameError: undefined vector variable.' }];
        return [
          'u + v = [3  3]',
          'c * u  = [12 -6]',
          { t: 'ok', s: '✅ Great job! Vector addition and scaling are correct!' }
        ];
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Self-Check Quiz: Module 3                                          */
  /* ------------------------------------------------------------------ */
  LA.mount('quiz-m3', function () {
    LA.quiz('#quiz-m3', {
      title: 'Module 3 Mastery Self-Check',
      questions: [
        {
          q: 'What is the crucial difference between a <b>Linear Combination</b> and a <b>Span</b>?',
          options: [
            'A linear combination is one single resulting vector; the Span is the entire infinite set of all possible combinations.',
            'They are identical mathematical terms with different spellings.',
            'A span only applies to matrices, while a combination only applies to scalars.'
          ],
          answer: 0,
          explain: 'Choosing one set of weights produces one point (combination). Allowing weights to take all real numbers sweeps out the continuous subspace (Span).'
        },
        {
          q: 'When does the system $A\\mathbf{x} = \\mathbf{b}$ have <b>at least one solution</b>?',
          options: [
            'Only when all diagonal entries of $A$ are positive.',
            'Whenever the target vector $\\mathbf{b}$ lies within the Column Space (Span) of $A$.',
            'Only when $A$ is a square matrix.'
          ],
          answer: 1,
          explain: 'Solving $A\\mathbf{x} = \\mathbf{b}$ means expressing $\\mathbf{b}$ as a linear combination of the columns of $A$. If $\\mathbf{b} \\in \\text{Span}(\\text{cols})$, it is solvable.'
        }
      ]
    });
  });

})();
