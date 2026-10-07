/* =====================================================================
   Module 1: System of Linear Equations · Interactive Laboratories
   ===================================================================== */
(function () {
  'use strict';
  const { el, M, C, fmt, g, pyf, bmat, setStatus } = LA;

  /* ------------------------------------------------------------------ */
  /* Lab 1.1: Linearity Demo (Constant vs Fluctuating Rate of Change)   */
  /* Notebook Cell [10]: plot_linearity_demo                             */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-linearity', function () {
    const box = LA.lab('#lab-linearity', {
      cell: 10,
      icon: '📈',
      kicker: 'Interactive Simulation',
      title: 'Testing Linearity &amp; Uniform Rate of Change (Δy/Δx)',
      onReset: () => { eqSelect.set('linear'); stepSlider.set(1.5); },
    });

    const eqSelect = LA.seg({
      label: 'Equation Function:',
      options: [
        { value: 'linear', label: 'Linear: x + y = 2  (y = 2 − x)' },
        { value: 'nonlinear', label: 'Non-Linear: sin(x) + sin(y) = 1' }
      ],
      value: 'linear',
      onChange: render,
    });

    const stepSlider = LA.slider({
      label: 'Sampling Step Size (Δx):',
      min: 0.5,
      max: 3.0,
      step: 0.5,
      value: 1.5,
      color: C.green,
      onInput: render,
    });

    box.controls.append(eqSelect.el, stepSlider.el);

    const plot = new LA.Plot2D(box.stage, {
      xmin: -5.5, xmax: 5.5, ymin: -4.5, ymax: 4.5, height: 420
    });

    function render() {
      const isLin = eqSelect.value === 'linear';
      const dx = stepSlider.value;

      if (isLin) {
        setStatus(box.status, 'good',
          '<b>Linearity Verified:</b> Rate of change $\\frac{\\Delta y}{\\Delta x} = -1.0$ is strictly invariant everywhere along the line.'
        );
      } else {
        setStatus(box.status, 'warn',
          '<b>Non-Linear Curve:</b> Rate of change $\\frac{\\Delta y}{\\Delta x}$ fluctuates continuously across sample points.'
        );
      }

      plot.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'x-axis', ylabel: 'y-axis'
        });

        // Continuous curve
        if (isLin) {
          p.fn((x) => 2 - x, { color: C.green, width: 3 });
        } else {
          // sin(x) + sin(y) = 1 => y = arcsin(clip(1 - sin(x), -1, 1))
          p.fn((x) => Math.asin(LA.clamp(1 - Math.sin(x), -1, 1)), { color: C.pink, width: 3 });
        }

        // Discrete sample points within visible plot bounds
        const samples = [];
        const startX = isLin ? -2.0 : -3.0;
        const endX = isLin ? 3.5 : 3.0;
        for (let sx = startX; sx <= endX + 1e-4; sx += dx) {
          const sy = isLin ? (2 - sx) : Math.asin(LA.clamp(1 - Math.sin(sx), -1, 1));
          samples.push([sx, sy]);
        }

        // Draw sample markers and text
        samples.forEach(([sx, sy]) => {
          p.point([sx, sy], {
            color: C.red, size: 6,
            label: `(${fmt(sx, 1)}, ${fmt(sy, 1)})`,
            labelColor: isLin ? '#14532D' : '#831843',
            labelStyle: { dx: 8, dy: -8, size: 11 }
          });
        });

        p.legend([
          { label: isLin ? 'x + y = 2 (Line)' : 'sin(x) + sin(y) = 1 (Curve)', color: isLin ? C.green : C.pink, kind: 'line' },
          { label: 'Step Samples', color: C.red, kind: 'point' }
        ], 'tr');
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 1.2: Solving 2x2 System Geometry                               */
  /* Notebook Cell [15]: Geometric Intersection                          */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-2x2-intersection', function () {
    const box = LA.lab('#lab-2x2-intersection', {
      cell: 15,
      icon: '✨',
      kicker: 'Visual Demonstration',
      title: 'Geometric Intersection of a 2×2 Linear System',
    });

    const plot = new LA.Plot2D(box.stage, {
      xmin: -1, xmax: 5, ymin: -1, ymax: 4, height: 400
    });

    plot.render((p) => {
      p.frame({
        grid: true, axes: true, ticks: true,
        xlabel: 'x-axis', ylabel: 'y-axis',
        title: 'Geometric Intersection of:  x + y = 3  and  x - y = 1',
        titleColor: C.navy
      });

      // Line 1: x + y = 3 => y = 3 - x
      p.line(1, 1, 3, { color: C.cyan, width: 3.5 });

      // Line 2: x - y = 1 => y = x - 1
      p.line(1, -1, 1, { color: C.pink, width: 3.5 });

      // Unique Solution: (2, 1)
      p.point([2, 1], {
        shape: 'star', size: 14, color: C.gold, stroke: '#000', strokeWidth: 1.5,
        label: 'Solution (2, 1)', labelColor: C.navy, labelStyle: { dx: 14, dy: -14, size: 13, bold: true }
      });

      p.legend([
        { label: 'Line 1: x + y = 3', color: C.cyan, kind: 'line' },
        { label: 'Line 2: x - y = 1', color: C.pink, kind: 'line' },
        { label: 'Intersection: (2, 1)', color: C.gold, kind: 'point', shape: 'star' }
      ], 'tl');
    });

    setStatus(box.status, 'good',
      '<b>Simultaneous Solution Found:</b> The point $(2, 1)$ satisfies both equations simultaneously because it is the unique point lying on both lines.'
    );
    LA.renderMath(box.status);
  });

  /* ------------------------------------------------------------------ */
  /* Lab 1.3: Full Interactive 2D Simulator (a1, b1, c1, a2, b2, c2)    */
  /* Notebook Cell [17]: plot_interactive_2d_system                      */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-2d-simulator', function () {
    const box = LA.lab('#lab-2d-simulator', {
      cell: 17,
      icon: '🎮',
      kicker: 'Interactive Simulator',
      title: 'Full 2D System Simulator: Slopes, Intercepts &amp; Solvability',
      onReset: () => {
        a1.set(3); b1.set(-2); c1.set(6);
        a2.set(1); b2.set(1); c2.set(2);
        zoom.set(10);
      }
    });

    const a1 = LA.num({ label: 'a₁ (x coeff):', value: 3.0, onInput: render });
    const b1 = LA.num({ label: 'b₁ (y coeff):', value: -2.0, onInput: render });
    const c1 = LA.num({ label: 'c₁ (constant):', value: 6.0, onInput: render });

    const a2 = LA.num({ label: 'a₂ (x coeff):', value: 1.0, onInput: render });
    const b2 = LA.num({ label: 'b₂ (y coeff):', value: 1.0, onInput: render });
    const c2 = LA.num({ label: 'c₂ (constant):', value: 2.0, onInput: render });

    const zoom = LA.slider({
      label: 'Zoom Range (±X/Y):',
      min: 2, max: 50, step: 2, value: 10, color: C.brand,
      onInput: render
    });

    const eq1Row = el('div', { class: 'eq-row' },
      el('span', { class: 'eq-tag', style: { background: C.crimson }, text: 'Equation 1' }),
      a1.el, el('span', { class: 'op', text: 'x  +' }),
      b1.el, el('span', { class: 'op', text: 'y  =' }),
      c1.el
    );

    const eq2Row = el('div', { class: 'eq-row' },
      el('span', { class: 'eq-tag', style: { background: C.steel }, text: 'Equation 2' }),
      a2.el, el('span', { class: 'op', text: 'x  +' }),
      b2.el, el('span', { class: 'op', text: 'y  =' }),
      c2.el
    );

    box.controls.append(eq1Row, eq2Row, zoom.el);

    const plot = new LA.Plot2D(box.stage, {
      xmin: -10, xmax: 10, ymin: -10, ymax: 10, height: 460
    });

    function render() {
      const z = zoom.value;
      plot.setView({ xmin: -z, xmax: z, ymin: -z, ymax: z });

      const A = [[a1.value, b1.value], [a2.value, b2.value]];
      const b_vec = [c1.value, c2.value];
      const det = M.det2(A);

      const aug = [[a1.value, b1.value, c1.value], [a2.value, b2.value, c2.value]];
      const rankA = M.rank(A);
      const rankAug = M.rank(aug);

      let solState = '';
      let solPoint = null;

      if (Math.abs(det) > 1e-5) {
        solPoint = M.solve(A, b_vec);
        solState = `Unique Solution: (x = ${fmt(solPoint[0], 2)}, y = ${fmt(solPoint[1], 2)})`;
        setStatus(box.status, 'good',
          `<b>✅ Unique Solution:</b> Det(A) = ${fmt(det, 3)} ≠ 0. Exactly one intersection at <b>(${fmt(solPoint[0], 2)}, ${fmt(solPoint[1], 2)})</b>.`
        );
      } else if (rankA === rankAug) {
        solState = 'Infinitely Many Solutions (Coincident Lines)';
        setStatus(box.status, 'info',
          `<b>♾️ Infinitely Many Solutions:</b> Det(A) = 0 and Rank(A) = Rank([A|b]) = ${rankA}. Both equations describe the exact same coincident line.`
        );
      } else {
        solState = 'No Solution (Parallel Lines)';
        setStatus(box.status, 'bad',
          `<b>❌ No Solution (Inconsistent):</b> Det(A) = 0 and Rank(A) = ${rankA} ≠ Rank([A|b]) = ${rankAug}. Lines are parallel and never meet.`
        );
      }

      plot.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'x Axis', ylabel: 'y Axis',
          title: `System of Equations Visualization [${solState}]`,
          titleColor: Math.abs(det) > 1e-5 ? C.green : (rankA === rankAug ? C.blue : C.red)
        });

        // Eq 1
        p.line(a1.value, b1.value, c1.value, { color: C.crimson, width: 3 });

        // Eq 2
        p.line(a2.value, b2.value, c2.value, { color: C.steel, width: 3, dash: true });

        // Solution marker
        if (solPoint) {
          p.point(solPoint, {
            shape: 'star', size: 16, color: C.green, stroke: '#000', strokeWidth: 1.5,
            label: `Unique Solution: (${fmt(solPoint[0], 2)}, ${fmt(solPoint[1], 2)})`,
            labelColor: '#14532D', labelStyle: { dx: 14, dy: -14, size: 12, bold: true }
          });
        }

        p.legend([
          { label: `Eq 1: ${g(a1.value)}x + ${g(b1.value)}y = ${g(c1.value)}`, color: C.crimson, kind: 'line' },
          { label: `Eq 2: ${g(a2.value)}x + ${g(b2.value)}y = ${g(c2.value)}`, color: C.steel, kind: 'dash' },
          solPoint ? { label: `Solution (${fmt(solPoint[0], 2)}, ${fmt(solPoint[1], 2)})`, color: C.green, kind: 'point', shape: 'star' } : null
        ].filter(Boolean), 'tr');
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 1.4: 3D Rotatable Planes Dashboard (6 Sheet 1 Configurations)  */
  /* Notebook Cell [21]: 3D Rotatable Planes Dashboard                  */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-3d-planes-dashboard', function () {
    const box = LA.lab('#lab-3d-planes-dashboard', {
      cell: 21,
      icon: '🔵',
      kicker: '3D Interactive Laboratory',
      title: 'Interactive 3D Rotatable Planes Dashboard (All 6 Configurations)',
    });

    const scenarios = {
      "1. Unique Solution (3 Planes meet at a single Point)": {
        z1: (X, Y) => 1.0 - X - Y,
        z2: (X, Y) => (2.0 - X + Y) / 2.0,
        z3: (X, Y) => 2.0 * X + Y - 3.0,
        desc: "Unique Solution: All 3 planes meet at exactly one coordinate point (1.4, -0.6, 0.2).",
        point: [1.4, -0.6, 0.2],
        line: null
      },
      "2. Infinitely Many Solutions (Open Book — Line of Intersection)": {
        z1: (X, Y) => 1.0 - X - Y,
        z2: (X, Y) => 2.0 - 2.0 * X - Y,
        z3: (X, Y) => (3.0 - 3.0 * X - 2.0 * Y) / 2.0,
        desc: "Infinitely Many Solutions: All 3 planes intersect along a continuous shared line.",
        point: null,
        line: true
      },
      "3. Infinitely Many Solutions (3 Coincident / Identical Planes)": {
        z1: (X, Y) => 1.0 - X - Y,
        z2: (X, Y) => 1.0 - X - Y + 0.04,
        z3: (X, Y) => 1.0 - X - Y - 0.04,
        desc: "Infinitely Many Solutions: All 3 equations describe the exact same plane.",
        point: null,
        line: null
      },
      "4. No Solution (Parallel Planes from Sheet 1: x+y+z=1 and 2x+2y+2z=-1)": {
        z1: (X, Y) => 1.0 - X - Y,
        z2: (X, Y) => -0.5 - X - Y,
        z3: (X, Y) => X + Y,
        desc: "No Solution: Planes 1 and 2 are parallel and never intersect (Inconsistent system).",
        point: null,
        line: null
      },
      "5. No Solution (Triangular Tent / Prism — Pairwise Parallel Lines)": {
        z1: (X, Y) => 1.0 - X - Y,
        z2: (X, Y) => 2.5 - X - Y,
        z3: (X, Y) => 1.0 - X + Y,
        desc: "No Solution: Planes meet in pairs along parallel lines forming a prism/tent with no common intersection.",
        point: null,
        line: null
      },
      "6. No Solution (3 Parallel Planes)": {
        z1: (X, Y) => 1.5 - X - Y,
        z2: (X, Y) => 0.0 - X - Y,
        z3: (X, Y) => -1.5 - X - Y,
        desc: "No Solution: All three planes are strictly parallel to one another.",
        point: null,
        line: null
      }
    };

    const scDropdown = LA.select({
      label: 'Select Geometric Scenario from Sheet 1:',
      options: Object.keys(scenarios).map(k => ({ value: k, label: k })),
      value: Object.keys(scenarios)[0],
      onChange: render
    });

    const t1 = LA.toggle({ label: 'Plane 1 (Blue)', value: true, color: '#3B82F6', onChange: render });
    const t2 = LA.toggle({ label: 'Plane 2 (Orange)', value: true, color: '#F97316', onChange: render });
    const t3 = LA.toggle({ label: 'Plane 3 (Green)', value: true, color: '#22C55E', onChange: render });

    box.controls.append(scDropdown.el, el('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' } }, t1.el, t2.el, t3.el));

    const plotDiv = el('div', { class: 'plot3d' });
    box.stage.append(plotDiv);

    function render() {
      const cfg = scenarios[scDropdown.value];
      setStatus(box.status, cfg.point ? 'good' : (cfg.line ? 'info' : 'bad'), `<b>${cfg.desc}</b>`);

      const traces = [];

      // Plane 1
      if (t1.value) {
        traces.push(LA.zSurface(cfg.z1, {
          name: 'Plane 1 (Blue)', color: '#3B82F6', opacity: 0.65, range: 3
        }));
      }

      // Plane 2
      if (t2.value) {
        traces.push(LA.zSurface(cfg.z2, {
          name: 'Plane 2 (Orange)', color: '#F97316', opacity: 0.65, range: 3
        }));
      }

      // Plane 3
      if (t3.value) {
        traces.push(LA.zSurface(cfg.z3, {
          name: 'Plane 3 (Green)', color: '#22C55E', opacity: 0.65, range: 3
        }));
      }

      // Point Solution
      if (cfg.point && t1.value && t2.value && t3.value) {
        traces.push({
          type: 'scatter3d',
          mode: 'markers+text',
          x: [cfg.point[0]], y: [cfg.point[1]], z: [cfg.point[2]],
          marker: { size: 9, color: '#000000', symbol: 'diamond' },
          text: ['Unique Solution Point'],
          textposition: 'top center',
          name: 'Solution Point'
        });
      }

      // Shared Line
      if (cfg.line && (t1.value || t2.value)) {
        const t_line = LA.linspace(-3, 3, 30);
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: t_line.map(() => 1),
          y: t_line,
          z: t_line.map(v => -v),
          line: { color: '#000000', width: 8 },
          name: 'Shared Intersection Line'
        });
      }

      LA.plot3d(plotDiv, traces, {
        range: 4,
        zrange: [-4, 4],
        eye: { x: 1.6, y: -1.6, z: 1.2 },
        uirevision: '3d-planes'
      });
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 1.5: 3x3 Arbitrary Planes Solver Simulator                     */
  /* Notebook Cell [24]: plot_3d_system                                  */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-3d-arbitrary-solver', function () {
    const box = LA.lab('#lab-3d-arbitrary-solver', {
      cell: 24,
      icon: '🌌',
      kicker: '3D Solver Laboratory',
      title: 'General 3×3 Linear System Simulator with Real-Time Solvability',
      onReset: () => {
        a1.set(1); b1.set(1); c1.set(1); d1.set(6);
        a2.set(0); b2.set(2); c2.set(5); d2.set(-4);
        a3.set(2); b3.set(5); c3.set(-1); d3.set(27);
      }
    });

    const a1 = LA.num({ label: 'a₁:', value: 1.0, onInput: render });
    const b1 = LA.num({ label: 'b₁:', value: 1.0, onInput: render });
    const c1 = LA.num({ label: 'c₁:', value: 1.0, onInput: render });
    const d1 = LA.num({ label: '= d₁:', value: 6.0, onInput: render });

    const a2 = LA.num({ label: 'a₂:', value: 0.0, onInput: render });
    const b2 = LA.num({ label: 'b₂:', value: 2.0, onInput: render });
    const c2 = LA.num({ label: 'c₂:', value: 5.0, onInput: render });
    const d2 = LA.num({ label: '= d₂:', value: -4.0, onInput: render });

    const a3 = LA.num({ label: 'a₃:', value: 2.0, onInput: render });
    const b3 = LA.num({ label: 'b₃:', value: 5.0, onInput: render });
    const c3 = LA.num({ label: 'c₃:', value: -1.0, onInput: render });
    const d3 = LA.num({ label: '= d₃:', value: 27.0, onInput: render });

    box.controls.append(
      el('div', { class: 'eq-row' }, el('span', { class: 'eq-tag', style: { background: '#2563EB' }, text: 'Eq 1' }), a1.el, b1.el, c1.el, d1.el),
      el('div', { class: 'eq-row' }, el('span', { class: 'eq-tag', style: { background: '#DC2626' }, text: 'Eq 2' }), a2.el, b2.el, c2.el, d2.el),
      el('div', { class: 'eq-row' }, el('span', { class: 'eq-tag', style: { background: '#16A34A' }, text: 'Eq 3' }), a3.el, b3.el, c3.el, d3.el)
    );

    const plotDiv = el('div', { class: 'plot3d' });
    box.stage.append(plotDiv);

    function render() {
      const A = [
        [a1.value, b1.value, c1.value],
        [a2.value, b2.value, c2.value],
        [a3.value, b3.value, c3.value]
      ];
      const b_vec = [d1.value, d2.value, d3.value];
      const aug = A.map((r, i) => [...r, b_vec[i]]);

      const rankA = M.rank(A);
      const rankAug = M.rank(aug);

      let statusMsg = '';
      let statusKind = 'info';

      const traces = [
        LA.planeSurface(a1.value, b1.value, c1.value, d1.value, { name: 'Eq 1 (Blue)', color: '#2563EB', opacity: 0.6 }),
        LA.planeSurface(a2.value, b2.value, c2.value, d2.value, { name: 'Eq 2 (Red)', color: '#DC2626', opacity: 0.6 }),
        LA.planeSurface(a3.value, b3.value, c3.value, d3.value, { name: 'Eq 3 (Green)', color: '#16A34A', opacity: 0.6 }),
      ].filter(Boolean);

      if (rankA === 3 && rankAug === 3) {
        const sol = M.solve(A, b_vec);
        statusMsg = `<b>Unique Solution Point:</b> (x, y, z) = (${fmt(sol[0], 2)}, ${fmt(sol[1], 2)}, ${fmt(sol[2], 2)})`;
        statusKind = 'good';

        traces.push({
          type: 'scatter3d',
          mode: 'markers+text',
          x: [sol[0]], y: [sol[1]], z: [sol[2]],
          marker: { size: 10, color: '#DC2626', symbol: 'diamond' },
          text: [`  Intersection: (${fmt(sol[0], 2)}, ${fmt(sol[1], 2)}, ${fmt(sol[2], 2)})`],
          textposition: 'top right',
          name: 'Unique Solution Point'
        });
      } else if (rankA === rankAug && rankA < 3) {
        statusMsg = `<b>Infinitely Many Solutions:</b> Rank(A) = ${rankA}, Rank([A|b]) = ${rankAug}. Continuous line/plane of intersections.`;
        statusKind = 'info';

        if (rankA === 2) {
          // Compute nullspace vector using cross product of row normals
          const n1 = [a1.value, b1.value, c1.value];
          const n2 = [a2.value, b2.value, c2.value];
          let dir = M.cross(n1, n2);
          if (M.norm(dir) < 1e-4) dir = M.cross(n1, [a3.value, b3.value, c3.value]);
          const normDir = M.norm(dir);

          if (normDir > 1e-5) {
            const udir = M.scale(dir, 1 / normDir);
            const part = M.lstsq(A, b_vec).closest;
            const t_line = LA.linspace(-5, 5, 40);
            traces.push({
              type: 'scatter3d',
              mode: 'lines',
              x: t_line.map(t => part[0] + udir[0] * t),
              y: t_line.map(t => part[1] + udir[1] * t),
              z: t_line.map(t => part[2] + udir[2] * t),
              line: { color: 'darkgreen', width: 9 },
              name: 'Line of Solutions'
            });
          }
        }
      } else {
        statusMsg = `<b>No Solution (Inconsistent System):</b> Rank(A) = ${rankA} ≠ Rank([A|b]) = ${rankAug}. The planes never meet simultaneously.`;
        statusKind = 'bad';
      }

      setStatus(box.status, statusKind, statusMsg);

      LA.plot3d(plotDiv, traces, {
        range: 5,
        title: statusMsg.replace(/<[^>]+>/g, ''),
        titleColor: statusKind === 'good' ? '#16A34A' : (statusKind === 'bad' ? '#DC2626' : '#2563EB'),
        uirevision: 'arbitrary-3x3'
      });
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 1.6: 2D Trichotomy Explorer (Sheet 1 Page 6)                   */
  /* Notebook Cell [28]: plot_trichotomy_2d                              */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-trichotomy-2d', function () {
    const box = LA.lab('#lab-trichotomy-2d', {
      cell: 28,
      icon: '📐',
      kicker: 'Trichotomy Explorer',
      title: 'Theorem 1: The Three Row-Picture Behaviors in 2D Space',
    });

    const caseSeg = LA.seg({
      label: 'Benchmark System from Sheet 1:',
      vertical: true,
      options: [
        { value: 'unique', label: '1. One solution (-1, 2):  x + 2y = 3  and  4x + 5y = 6' },
        { value: 'parallel', label: '2. Parallel (No solution):  x + 2y = 3  and  4x + 8y = 6' },
        { value: 'coincident', label: '3. Whole line of solutions:  x + 2y = 3  and  4x + 8y = 12' }
      ],
      value: 'unique',
      onChange: render
    });

    box.controls.append(caseSeg.el);

    const plot = new LA.Plot2D(box.stage, {
      xmin: -5, xmax: 6, ymin: -3, ymax: 4.5, height: 420
    });

    function render() {
      const mode = caseSeg.value;

      if (mode === 'unique') {
        setStatus(box.status, 'good',
          '<b>Consistent System (Exactly 1 Solution):</b> Lines have different slopes ($-0.5$ vs $-0.8$) and intersect at $(-1, 2)$.'
        );
      } else if (mode === 'parallel') {
        setStatus(box.status, 'bad',
          '<b>Inconsistent System (0 Solutions):</b> Lines share the exact same slope ($-0.5$) but have different intercepts ($1.5$ vs $0.75$). They run parallel forever.'
        );
      } else {
        setStatus(box.status, 'info',
          '<b>Consistent System (Infinitely Many Solutions):</b> Equation 2 is exactly $4 \\times$ Equation 1. Both lines lie identically on top of each other.'
        );
      }

      plot.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'x-axis', ylabel: 'y-axis',
          title: mode === 'unique' 
            ? 'Consistent System: Exactly ONE Unique Solution (-1, 2)'
            : (mode === 'parallel' 
              ? 'Inconsistent System: Slopes match (-0.5), different intercepts => No Solution'
              : 'Consistent System: Identical lines => Whole Line of Infinitely Many Solutions'),
          titleColor: mode === 'unique' ? C.green : (mode === 'parallel' ? C.orange : C.blue)
        });

        // Line 1 is always x + 2y = 3
        p.line(1, 2, 3, { color: C.blue, width: 3 });

        if (mode === 'unique') {
          // Line 2: 4x + 5y = 6
          p.line(4, 5, 6, { color: C.green, width: 3 });
          p.point([-1, 2], {
            color: C.red, size: 8,
            label: 'Intersection (-1, 2)', labelColor: '#B91C1C',
            labelStyle: { dx: 10, dy: -10, bold: true }
          });
          p.legend([
            { label: 'Line 1: x + 2y = 3', color: C.blue, kind: 'line' },
            { label: 'Line 2: 4x + 5y = 6', color: C.green, kind: 'line' },
            { label: 'Unique Solution (-1, 2)', color: C.red, kind: 'point' }
          ], 'tr');
        } else if (mode === 'parallel') {
          // Line 2: 4x + 8y = 6
          p.line(4, 8, 6, { color: C.orange, width: 3, dash: true });
          p.legend([
            { label: 'Line 1: x + 2y = 3', color: C.blue, kind: 'line' },
            { label: 'Line 2: 4x + 8y = 6 (Parallel)', color: C.orange, kind: 'dash' }
          ], 'tr');
        } else {
          // Line 2: 4x + 8y = 12 (Coincident)
          p.line(4, 8, 12, { color: C.yellow, width: 5, dash: 'dot' });
          p.legend([
            { label: 'Line 1: x + 2y = 3', color: C.blue, kind: 'line' },
            { label: 'Line 2: 4x + 8y = 12 (Coincident)', color: C.yellow, kind: 'dot' }
          ], 'tr');
        }
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Lab 1.7: Side-by-Side Dual-Verse (Row Picture vs Column Picture)    */
  /* Notebook Cell [31]: render_dual_verse                               */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-dual-verse', function () {
    const box = LA.lab('#lab-dual-verse', {
      cell: 31,
      icon: '🌌',
      kicker: 'Dual-Verse Explorer',
      title: 'The Dual-Verse: Side-by-Side Row Picture vs. Column Picture',
      cols: 2,
      onReset: () => {
        a11.set(1); a12.set(1); a21.set(-1); a22.set(1);
        b1.set(2); b2.set(0);
        x_slider.set(1); y_slider.set(1);
      }
    });

    const a11 = LA.num({ label: 'a₁₁:', value: 1.0, onInput: render });
    const a12 = LA.num({ label: 'a₁₂:', value: 1.0, onInput: render });
    const a21 = LA.num({ label: 'a₂₁:', value: -1.0, onInput: render });
    const a22 = LA.num({ label: 'a₂₂:', value: 1.0, onInput: render });

    const b1 = LA.num({ label: 'Target b₁:', value: 2.0, onInput: render });
    const b2 = LA.num({ label: 'Target b₂:', value: 0.0, onInput: render });

    const x_slider = LA.slider({ label: 'Scale x (Col 1 dial):', min: -4, max: 4, step: 0.1, value: 1.0, color: C.teal, onInput: render });
    const y_slider = LA.slider({ label: 'Scale y (Col 2 dial):', min: -4, max: 4, step: 0.1, value: 1.0, color: C.amber, onInput: render });

    const matrixRow = el('div', { class: 'eq-row' },
      el('b', { style: { alignSelf: 'center', marginRight: '6px' }, text: 'Matrix A:' }),
      a11.el, a12.el,
      el('b', { style: { alignSelf: 'center', margin: '0 6px 0 14px' }, text: 'Target b:' }),
      b1.el, b2.el
    );
    const matrixRow2 = el('div', { class: 'eq-row', style: { marginTop: '-4px' } },
      el('span', { style: { width: '70px' } }),
      a21.el, a22.el
    );

    box.controls.append(matrixRow, matrixRow2, x_slider.el, y_slider.el);

    const panelRow = el('div', { class: 'panel' }, el('div', { class: 'panel-title', text: '📍 LENS 1: Row Picture (Line Intersections)' }));
    const panelCol = el('div', { class: 'panel' }, el('div', { class: 'panel-title', text: '🎯 LENS 2: Column Picture (Scaling &amp; Vector Addition)' }));

    const plotRow = new LA.Plot2D(panelRow, { xmin: -6, xmax: 6, ymin: -6, ymax: 6, height: 420, equal: true });
    const plotCol = new LA.Plot2D(panelCol, { xmin: -6, xmax: 6, ymin: -6, ymax: 6, height: 420, equal: true });

    box.stage.append(panelRow, panelCol);

    // Draggable point handle on the row picture!
    plotRow.addHandle({
      color: C.purple,
      get: () => [x_slider.value, y_slider.value],
      set: (x, y) => { x_slider.set(x); y_slider.set(y); render(); }
    });

    function render() {
      const x = x_slider.value;
      const y = y_slider.value;

      const col1 = [a11.value, a21.value];
      const col2 = [a12.value, a22.value];
      const target = [b1.value, b2.value];

      const v1_s = [x * col1[0], x * col1[1]];
      const v2_s = [y * col2[0], y * col2[1]];
      const res = [v1_s[0] + v2_s[0], v1_s[1] + v2_s[1]];

      const dist = Math.hypot(res[0] - target[0], res[1] - target[1]);
      const isSolved = dist < 0.08;

      if (isSolved) {
        setStatus(box.status, 'good',
          `<b>🎉 DUAL-VERSE SOLVED!</b> When $(x, y) = (${fmt(x, 1)}, ${fmt(y, 1)})$ sits on the intersection in the Row Picture, the scaled column vectors simultaneously land directly on target $\\mathbf{b} = [${target[0]}, ${target[1]}]^T$!`
        );
      } else {
        setStatus(box.status, 'warn',
          `<b>Current Coordinates:</b> Tested $(x, y) = (${fmt(x, 1)}, ${fmt(y, 1)})$. Distance to column target: <b>${fmt(dist, 2)} units</b>. Move the purple marker or sliders to hit the intersection!`
        );
      }

      // 1. Row Picture
      plotRow.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'x', ylabel: 'y',
          title: 'Row Picture: Line Intersection'
        });

        // Line 1: a11*x + a12*y = b1
        p.line(a11.value, a12.value, b1.value, { color: C.blue, width: 2.5 });

        // Line 2: a21*x + a22*y = b2
        p.line(a21.value, a22.value, b2.value, { color: C.red, width: 2.5 });

        // Tested point marker
        p.point([x, y], {
          shape: 'x', size: 10, color: C.purple, lineWidth: 3.5,
          label: `Tested (${fmt(x, 1)}, ${fmt(y, 1)})`, labelColor: C.purple,
          labelStyle: { dx: 12, dy: -12, bold: true }
        });

        p.legend([
          { label: `Line 1: ${g(a11.value)}x + ${g(a12.value)}y = ${g(b1.value)}`, color: C.blue, kind: 'line' },
          { label: `Line 2: ${g(a21.value)}x + ${g(a22.value)}y = ${g(b2.value)}`, color: C.red, kind: 'line' },
          { label: `Tested Point (${fmt(x, 1)}, ${fmt(y, 1)})`, color: C.purple, kind: 'point', shape: 'x' }
        ], 'bl');
      });

      // 2. Column Picture
      plotCol.render((p) => {
        p.frame({
          grid: true, axes: true, ticks: true,
          xlabel: 'x₁', ylabel: 'x₂',
          title: 'Column Picture: Scaling & Adding Vectors'
        });

        // Scaled Col 1 from origin
        p.arrow([0, 0], v1_s, { color: C.teal, width: 3.5 });

        // Scaled Col 2 from tip of Col 1
        p.arrow(v1_s, res, { color: C.amber, width: 3.5 });

        // Resultant vector
        p.arrow([0, 0], res, { color: C.purple, width: 2, dash: true });

        // Target star
        p.point(target, {
          shape: 'star', size: 14, color: C.pink, stroke: '#000', strokeWidth: 1.5,
          label: `Target b [${target[0]}, ${target[1]}]`, labelColor: C.pink,
          labelStyle: { dx: 14, dy: 14, bold: true }
        });

        p.legend([
          { label: `x · Col 1: ${fmt(x, 1)}·[${col1[0]}, ${col1[1]}]`, color: C.teal, kind: 'arrow' },
          { label: `y · Col 2: ${fmt(y, 1)}·[${col2[0]}, ${col2[1]}]`, color: C.amber, kind: 'arrow' },
          { label: `Resultant: [${fmt(res[0], 1)}, ${fmt(res[1], 1)}]`, color: C.purple, kind: 'dash' },
          { label: `Target b: [${target[0]}, ${target[1]}]`, color: C.pink, kind: 'point', shape: 'star' }
        ], 'bl');
      });

      LA.renderMath(box.status);
    }

    render();
  });

  /* ------------------------------------------------------------------ */
  /* Code Lab 1: 2D Determinant Checker                                 */
  /* Notebook Cell [35]                                                 */
  /* ------------------------------------------------------------------ */
  LA.mount('lab-code-determinant', function () {
    LA.codeLab('#lab-code-determinant', {
      id: 'm1-c1',
      title: 'Challenge 1: The 2D Determinant Checker (Fill-in-the-Blanks)',
      intro: 'Write a script that builds the matrix $A$ from two lines, calculates its determinant using NumPy, and solves the system.',
      code: `import numpy as np

# System of Equations:
# Line 1:  2x - 3y = 6
# Line 2:  4x + 1y = 5

# Step 1: Fill in the coefficient matrix A and the constants vector b
A = np.array([
    [[[a1]], [[b1]]],
    [[[a2]], [[b2]]]
])
b = np.array([[[c1]], [[c2]]])

# Step 2: Calculate the determinant of Matrix A using NumPy
det_A = np.linalg.det([[[det_arg]]])
print(f"Determinant of A: {det_A:.2f}")

# Step 3: Check if unique intersection exists
if abs(det_A) > 1e-5:
    solution = np.linalg.solve(A, b)
    print(f"✅ Unique Intersection Found at: x = {solution[0]:.2f}, y = {solution[1]:.2f}")
else:
    print("❌ Matrix is Singular (Determinant = 0). Lines are Parallel or Coincident!")`,
      answers: {
        a1: ['2', '2.0'],
        b1: ['-3', '-3.0'],
        a2: ['4', '4.0'],
        b2: ['1', '1.0'],
        c1: ['6', '6.0'],
        c2: ['5', '5.0'],
        det_arg: ['A']
      },
      hints: {
        a1: 'Coefficient of x in Line 1 is 2',
        b1: 'Coefficient of y in Line 1 is -3',
        a2: 'Coefficient of x in Line 2 is 4',
        b2: 'Coefficient of y in Line 2 is 1',
        c1: 'Constant of Line 1 is 6',
        c2: 'Constant of Line 2 is 5',
        det_arg: 'Pass the coefficient matrix A into np.linalg.det()'
      },
      run: (vals, ok, all) => {
        if (!all) return [{ t: 'err', s: 'Traceback (most recent call last):\nValueError: Matrix coefficients or determinant argument do not match the system.' }];
        const det = 2 * 1 - (-3 * 4); // 2 - (-12) = 14
        const x = (6 * 1 - (-3 * 5)) / 14; // (6 + 15)/14 = 21/14 = 1.50
        const y = (2 * 5 - 6 * 4) / 14; // (10 - 24)/14 = -14/14 = -1.00
        return [
          `Determinant of A: ${det.toFixed(2)}`,
          { t: 'ok', s: `✅ Unique Intersection Found at: x = ${x.toFixed(2)}, y = ${y.toFixed(2)}` }
        ];
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Self-Check Quiz: Module 1                                          */
  /* ------------------------------------------------------------------ */
  LA.mount('quiz-m1', function () {
    LA.quiz('#quiz-m1', {
      title: 'Module 1 Mastery Self-Check',
      questions: [
        {
          q: 'Why can a system of linear equations <b>never have exactly 2 solutions</b>?',
          options: [
            'Because determinants only evaluate to positive or negative numbers.',
            'If two points satisfy a linear system, the entire straight line connecting them satisfies every plane simultaneously (infinitely many solutions).',
            'Because computers can only compute even dimensions in hardware.'
          ],
          answer: 1,
          explain: 'Any linear combination $t \\mathbf{p}_1 + (1-t) \\mathbf{p}_2$ also satisfies the linear system, instantly creating an entire 1D continuum of solutions.'
        },
        {
          q: 'What is the physical meaning of the <b>Column Picture</b> of $A\\mathbf{x} = \\mathbf{b}$?',
          options: [
            'Finding where two or more planes intersect in coordinate space.',
            'Scaling the column vectors of $A$ and adding them head-to-tail to reach target $\\mathbf{b}$.',
            'Calculating the slope of the steepest row.'
          ],
          answer: 1,
          explain: 'The Column Picture expresses $A\\mathbf{x}$ as $x_1 \\mathbf{a}_1 + x_2 \\mathbf{a}_2 + \\dots = \\mathbf{b}$.'
        },
        {
          q: 'Which geometric condition produces <b>zero solutions</b> in a $3 \\times 3$ plane system?',
          options: [
            'All 3 planes intersect at a single vertex point.',
            'Two planes are parallel and non-intersecting, or the planes meet in pairwise parallel lines forming a triangular prism.',
            'All 3 planes intersect along a single shared line.'
          ],
          answer: 1,
          explain: 'Parallel planes or triangular prisms mean there is no single coordinate point shared by all 3 planes at once.'
        }
      ]
    });
  });

})();
