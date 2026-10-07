/* =====================================================================
   M3 Linear Algebra — Jupyter Notebook Showcase Renderer
   Full-featured notebook renderer:
   - 94 cells exact layout
   - Python syntax highlighting & line numbers
   - Dark/Light mode switcher with Plotly/Canvas sync
   - Cell folding (Code & Output)
   - Student bookmarks (⭐) and personal persistent sticky notes (📝)
   - Reading progress bar & live execution simulation
   - Formula sheet modal & Print-to-PDF support
   - Offline image fallback & KaTeX math rendering
   ===================================================================== */
(function () {
  'use strict';

  const CELL_WIDGET_MAP = {
    10: 'lab-linearity',
    15: 'lab-2x2-intersection',
    17: 'lab-2d-simulator',
    21: 'lab-3d-planes-dashboard',
    24: 'lab-3d-arbitrary-solver',
    28: 'lab-trichotomy-2d',
    31: 'lab-dual-verse',
    35: 'lab-code-determinant',
    39: 'lab-rgb-studio',
    43: 'lab-audio-superposition',
    46: 'lab-dimension-compatibility',
    51: 'lab-tea-kitchen',
    54: 'lab-binary-image-studio',
    64: 'lab-code-tea-recipe',
    70: 'lab-vector-perspectives',
    72: 'lab-vector-addition',
    77: 'lab-2d-span',
    79: 'lab-3d-span-lab',
    86: 'lab-linear-alchemist-game',
    90: 'lab-code-vector-ops'
  };

  const LOCAL_IMG_MAP = [
    { match: 'Gemini-Generated-Image', local: 'welcome.jpg', fallback: 'assets/img/welcome.jpg' },
    { match: 'types-of-solutions', local: 'solutions_2var.jpg', fallback: 'assets/img/solutions_2var.jpg' },
    { match: 'm-Ka-MMDb', local: 'solutions_3var.jpg', fallback: 'assets/img/solutions_3var.jpg' },
    { match: 'Screenshot-2026-07-27-at-11-56-14', local: 'column_way.png', fallback: 'assets/img/column_way.png' },
    { match: 'Screenshot-2026-07-27-at-11-58-41', local: 'row_way.png', fallback: 'assets/img/row_way.png' }
  ];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function parseMarkdown(md) {
    if (!md) return '';
    let s = md;

    LOCAL_IMG_MAP.forEach(item => {
      if (s.includes(item.match)) {
        s = s.replace(new RegExp(`src="[^"]*${item.match}[^"]*"`, 'g'), `src="${item.local}" onerror="this.onerror=null;this.src='${item.fallback}'"`);
      }
    });

    const trimmed = s.trim();
    if (trimmed.startsWith('<div') || trimmed.startsWith('<table') || trimmed.startsWith('<style')) {
      return s;
    }

    const mathTokens = [];
    s = s.replace(/\$\$([\s\S]*?)\$\$/g, function (m) {
      mathTokens.push(m);
      return '@@MATH_TOKEN_' + (mathTokens.length - 1) + '@@';
    });
    s = s.replace(/\$([^\$\n\r]+)\$/g, function (m) {
      mathTokens.push(m);
      return '@@MATH_TOKEN_' + (mathTokens.length - 1) + '@@';
    });

    s = s.replace(/^###[ \t]+(.*$)/gim, '<h3 style="margin-top:16px; margin-bottom:8px; font-weight:700;">$1</h3>');
    s = s.replace(/^##[ \t]+(.*$)/gim, '<h2 style="margin-top:20px; margin-bottom:10px; border-bottom:1px solid var(--jp-border-color); padding-bottom:6px; font-weight:800;">$1</h2>');
    s = s.replace(/^#[ \t]+(.*$)/gim, '<h1 style="margin-top:24px; margin-bottom:12px; border-bottom:2px solid var(--jp-border-color); padding-bottom:8px; font-weight:800;">$1</h1>');

    s = s.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');

    s = s.replace(/`([^`]+)`/g, '<code style="background:var(--jp-input-header-bg); padding:2px 5px; border-radius:4px; font-size:90%; font-family:monospace;">$1</code>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--jp-cell-active-border); text-decoration:underline;">$1</a>');
    s = s.replace(/^\>[ \t]+(.*$)/gim, '<blockquote style="border-left:4px solid var(--jp-cell-active-border); padding:8px 12px; margin:10px 0; background:var(--jp-input-header-bg); border-radius:4px;">$1</blockquote>');

    const paragraphs = s.split(/\n\s*\n/);
    s = paragraphs.map(function (p) {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<blockquote') || p.startsWith('<table')) {
        return p;
      }
      return '<p style="margin-bottom:10px; line-height:1.68;">' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');

    s = s.replace(/@@MATH_TOKEN_(\d+)@@/g, function (_, idx) {
      return mathTokens[parseInt(idx, 10)];
    });

    return s;
  }

  function initNotebookShowcase() {
    const data = window.NOTEBOOK_DATA;
    if (!data || !data.cells) {
      console.error('Notebook data not found!');
      return;
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem('m3_notebook_theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }

    // Apply saved line numbers
    if (localStorage.getItem('m3_line_numbers') === 'true') {
      document.body.classList.add('show-line-numbers');
    }

    const container = document.getElementById('jp-cells-container');
    const tocList = document.getElementById('jp-toc-list');
    if (!container) return;

    container.innerHTML = '';
    if (tocList) tocList.innerHTML = '';

    let codeExecutionCounter = 1;

    data.cells.forEach((cell, idx) => {
      const cellEl = document.createElement('div');
      cellEl.className = `jp-cell jp-cell-${cell.cell_type}`;
      cellEl.id = `cell-${idx}`;
      cellEl.dataset.index = idx;
      cellEl.dataset.type = cell.cell_type;
      if (CELL_WIDGET_MAP[idx]) cellEl.dataset.hasWidget = 'true';

      if (cell.cell_type === 'markdown') {
        renderMarkdownCell(cell, idx, cellEl, tocList);
      } else if (cell.cell_type === 'code') {
        renderCodeCell(cell, idx, cellEl, codeExecutionCounter++);
      }

      container.appendChild(cellEl);

      // Section self-check quiz insertions at module boundaries
      if (idx === 36) {
        const qWrap = document.createElement('div');
        qWrap.style.margin = '20px 0 30px 0';
        qWrap.innerHTML = '<div style="font-size:12px; font-weight:800; color:#0284c7; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Module 1 Knowledge Check</div><div id="quiz-m1"></div>';
        container.appendChild(qWrap);
      } else if (idx === 67) {
        const qWrap = document.createElement('div');
        qWrap.style.margin = '20px 0 30px 0';
        qWrap.innerHTML = '<div style="font-size:12px; font-weight:800; color:#0284c7; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Module 2 Knowledge Check</div><div id="quiz-m2"></div>';
        container.appendChild(qWrap);
      } else if (idx === 92) {
        const qWrap = document.createElement('div');
        qWrap.style.margin = '20px 0 30px 0';
        qWrap.innerHTML = '<div style="font-size:12px; font-weight:800; color:#0284c7; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Module 3 Knowledge Check</div><div id="quiz-m3"></div>';
        container.appendChild(qWrap);
      }
    });

    // 1. Mount interactive widgets
    if (window.LA && typeof LA.runAllMounts === 'function') {
      LA.runAllMounts();
    }

    // 2. Render KaTeX math
    if (window.renderMathInElement) {
      renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        throwOnError: false
      });
    }

    setupToolbarControls();
    setupScrollSpyAndProgress();
    updateBookmarksSidebar();
  }

  function renderMarkdownCell(cell, idx, cellEl, tocList) {
    const wrapper = document.createElement('div');
    wrapper.className = 'jp-cell-wrapper';

    const prompt = document.createElement('div');
    prompt.className = 'jp-prompt';

    const content = document.createElement('div');
    content.className = 'jp-cell-content';

    // Cell action bar (Bookmark & Sticky Note)
    const cellActionBar = document.createElement('div');
    cellActionBar.style.cssText = 'display:flex; justify-content:flex-end; gap:6px; margin-bottom:4px;';
    const isBookmarked = localStorage.getItem(`m3_bm_${idx}`) === '1';
    const hasNote = !!localStorage.getItem(`m3_note_${idx}`);

    cellActionBar.innerHTML = `
      <button class="jp-bookmark-btn ${isBookmarked ? 'active' : ''}" id="bm-btn-${idx}" onclick="toggleBookmark(${idx})" title="Bookmark this cell">⭐</button>
      <button class="jp-collapse-btn" onclick="toggleNote(${idx})" title="Add personal note">📝 Note</button>
    `;

    const mdContent = document.createElement('div');
    mdContent.className = 'jp-markdown-cell';
    mdContent.innerHTML = parseMarkdown(cell.source);

    // Sticky note box
    const noteBox = createNoteBox(idx, hasNote);

    content.appendChild(cellActionBar);
    content.appendChild(mdContent);
    content.appendChild(noteBox);

    // Populate Table of Contents from headings
    const headingMatch = cell.source.match(/^(#{1,3})\s+(.*)$/m) || cell.source.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    if (headingMatch && tocList) {
      const rawTitle = (headingMatch[2] || headingMatch[1]).replace(/<[^>]+>/g, '').trim();
      const cleanTitle = rawTitle.replace(/[*#]/g, '').trim();
      if (cleanTitle) {
        const li = document.createElement('li');
        li.className = 'jp-toc-item';
        li.innerHTML = `<a href="#cell-${idx}" class="jp-toc-link"><span class="jp-toc-badge">C${idx}</span> ${cleanTitle}</a>`;
        tocList.appendChild(li);
      }
    }

    wrapper.appendChild(prompt);
    wrapper.appendChild(content);
    cellEl.appendChild(wrapper);
  }

  function renderCodeCell(cell, idx, cellEl, execCount) {
    const wrapper = document.createElement('div');
    wrapper.className = 'jp-cell-wrapper';

    // In [X]: prompt
    const inPrompt = document.createElement('div');
    inPrompt.className = 'jp-prompt in-prompt';
    inPrompt.id = `in-prompt-${idx}`;
    inPrompt.textContent = `In [${cell.execution_count || execCount}]:`;

    const content = document.createElement('div');
    content.className = 'jp-cell-content';

    // Input Code Box
    const inputArea = document.createElement('div');
    inputArea.className = 'jp-input-area';

    const hasWidget = !!CELL_WIDGET_MAP[idx];
    const badgeText = hasWidget ? 'Interactive Lab Cell' : 'Python 3';
    const badgeStyle = hasWidget ? 'background:rgba(2,132,199,0.15); color:#0284c7; padding:2px 8px; border-radius:10px; font-weight:700;' : '';
    const isBookmarked = localStorage.getItem(`m3_bm_${idx}`) === '1';

    const inputHeader = document.createElement('div');
    inputHeader.className = 'jp-input-header';
    inputHeader.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="jp-collapse-btn" onclick="toggleCellCode(${idx})" id="fold-code-${idx}" title="Fold / Unfold Code">▾ Code</button>
        <span>Cell ${idx}</span> · <span style="${badgeStyle}">${badgeText}</span>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <span class="jp-exec-time" id="exec-time-${idx}"></span>
        <button class="jp-bookmark-btn ${isBookmarked ? 'active' : ''}" id="bm-btn-${idx}" onclick="toggleBookmark(${idx})" title="Bookmark this cell">⭐</button>
        <button class="jp-collapse-btn" onclick="toggleNote(${idx})" title="Add personal note">📝 Note</button>
        <button class="jp-btn" style="padding:2px 7px; font-size:11px;" onclick="copyCellCode(${idx})">📋 Copy</button>
        <button class="jp-btn primary" style="padding:2px 7px; font-size:11px;" onclick="simulateRunCell(${idx})">▶ Run</button>
      </div>`;

    // Code wrap with line numbers gutter
    const codeWrap = document.createElement('div');
    codeWrap.className = 'jp-code-wrap';

    const linesCount = (cell.source || '').split('\n').length;
    const lineNumbers = document.createElement('div');
    lineNumbers.className = 'jp-line-numbers';
    lineNumbers.innerHTML = Array.from({ length: linesCount }, (_, i) => i + 1).join('<br>');

    const codeBody = document.createElement('pre');
    codeBody.className = 'jp-code-body';
    codeBody.id = `code-${idx}`;
    if (window.LA && typeof LA.highlightPy === 'function') {
      codeBody.innerHTML = LA.highlightPy(cell.source);
    } else {
      codeBody.textContent = cell.source;
    }

    codeWrap.appendChild(lineNumbers);
    codeWrap.appendChild(codeBody);

    inputArea.appendChild(inputHeader);
    inputArea.appendChild(codeWrap);
    content.appendChild(inputArea);

    // Sticky note box
    const noteBox = createNoteBox(idx, !!localStorage.getItem(`m3_note_${idx}`));
    content.appendChild(noteBox);

    // Outputs Area
    const widgetId = CELL_WIDGET_MAP[idx];
    const hasOutputs = (cell.outputs && cell.outputs.length > 0) || widgetId;

    if (hasOutputs) {
      const outputWrapper = document.createElement('div');
      outputWrapper.className = 'jp-output-wrapper';

      const outPrompt = document.createElement('div');
      outPrompt.className = 'jp-prompt out-prompt';
      outPrompt.textContent = `Out [${cell.execution_count || execCount}]:`;

      const outputArea = document.createElement('div');
      outputArea.className = 'jp-output-area';

      // Output Header with collapse button
      const outputHeader = document.createElement('div');
      outputHeader.style.cssText = 'display:flex; justify-content:flex-end; margin-bottom:4px;';
      outputHeader.innerHTML = `<button class="jp-collapse-btn" onclick="toggleCellOutput(${idx})" id="fold-out-${idx}">▾ Collapse Output</button>`;
      outputArea.appendChild(outputHeader);

      // 1. Text streams / print statements / HTML
      if (cell.outputs && cell.outputs.length > 0) {
        cell.outputs.forEach(out => {
          if (out.text) {
            const pre = document.createElement('pre');
            pre.className = 'jp-output-text';
            pre.textContent = out.text;
            outputArea.appendChild(pre);
          }
          if (out.html && !out.html.includes('plotly-notice')) {
            const div = document.createElement('div');
            div.innerHTML = out.html;
            outputArea.appendChild(div);
          }
          if (out.imagePng) {
            const img = document.createElement('img');
            img.className = 'jp-output-image';
            img.src = 'data:image/png;base64,' + out.imagePng;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '6px';
            img.style.margin = '8px 0';
            img.style.boxShadow = '0 1px 4px rgba(0,0,0,0.15)';
            img.alt = `Cell ${idx} output plot`;
            outputArea.appendChild(img);
          }
        });
      }

      // 2. Interactive Widget
      if (widgetId) {
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'jp-widget-container';
        widgetContainer.id = widgetId;
        outputArea.appendChild(widgetContainer);
      }

      outputWrapper.appendChild(outPrompt);
      outputWrapper.appendChild(outputArea);
      content.appendChild(outputWrapper);
    }

    wrapper.appendChild(inPrompt);
    wrapper.appendChild(content);
    cellEl.appendChild(wrapper);
  }

  function createNoteBox(idx, hasSavedNote) {
    const noteBox = document.createElement('div');
    noteBox.className = `jp-note-box ${hasSavedNote ? 'open' : ''}`;
    noteBox.id = `note-box-${idx}`;

    const ta = document.createElement('textarea');
    ta.className = 'jp-note-textarea';
    ta.placeholder = `✍️ Personal Note for Cell ${idx} (e.g. key formula, question for professor, exam note)...`;
    ta.value = localStorage.getItem(`m3_note_${idx}`) || '';

    let timer;
    ta.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (ta.value.trim()) {
          localStorage.setItem(`m3_note_${idx}`, ta.value);
        } else {
          localStorage.removeItem(`m3_note_${idx}`);
        }
        updateBookmarksSidebar();
      }, 300);
    });

    noteBox.appendChild(ta);
    return noteBox;
  }

  // Window utilities
  window.copyCellCode = function (idx) {
    const codeEl = document.getElementById(`code-${idx}`);
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent).then(() => {
        const btn = event?.currentTarget;
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '✓ Copied!';
          setTimeout(() => { btn.innerHTML = orig; }, 1500);
        } else {
          alert(`Cell ${idx} code copied!`);
        }
      });
    }
  };

  window.simulateRunCell = function (idx) {
    const promptEl = document.getElementById(`in-prompt-${idx}`);
    const cellEl = document.getElementById(`cell-${idx}`);
    const timeEl = document.getElementById(`exec-time-${idx}`);
    if (promptEl) {
      promptEl.textContent = 'In [*]:';
      if (cellEl) cellEl.classList.add('active-cell');
      const start = performance.now();
      setTimeout(() => {
        promptEl.textContent = `In [${idx + 1}]:`;
        if (timeEl) {
          const dur = ((performance.now() - start) / 1000).toFixed(2);
          timeEl.textContent = `[${dur}s]`;
        }
      }, 250);
    }
  };

  window.toggleCellCode = function (idx) {
    const cellEl = document.getElementById(`cell-${idx}`);
    const btn = document.getElementById(`fold-code-${idx}`);
    if (cellEl) {
      cellEl.classList.toggle('collapsed-code');
      const collapsed = cellEl.classList.contains('collapsed-code');
      if (btn) btn.innerHTML = collapsed ? '▸ Code' : '▾ Code';
    }
  };

  window.toggleCellOutput = function (idx) {
    const cellEl = document.getElementById(`cell-${idx}`);
    const btn = document.getElementById(`fold-out-${idx}`);
    if (cellEl) {
      cellEl.classList.toggle('collapsed-output');
      const collapsed = cellEl.classList.contains('collapsed-output');
      if (btn) btn.innerHTML = collapsed ? '▸ Expand Output' : '▾ Collapse Output';
    }
  };

  window.toggleBookmark = function (idx) {
    const key = `m3_bm_${idx}`;
    const cur = localStorage.getItem(key) === '1';
    if (cur) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, '1');
    }
    const btn = document.getElementById(`bm-btn-${idx}`);
    if (btn) btn.classList.toggle('active', !cur);
    updateBookmarksSidebar();
  };

  window.toggleNote = function (idx) {
    const box = document.getElementById(`note-box-${idx}`);
    if (box) {
      box.classList.toggle('open');
      if (box.classList.contains('open')) {
        const ta = box.querySelector('textarea');
        if (ta) ta.focus();
      }
    }
  };

  window.toggleAllCode = function () {
    const cells = document.querySelectorAll('.jp-cell-code');
    const isAnyExpanded = Array.from(cells).some(c => !c.classList.contains('collapsed-code'));
    cells.forEach(c => {
      const idx = c.dataset.index;
      const btn = document.getElementById(`fold-code-${idx}`);
      if (isAnyExpanded) {
        c.classList.add('collapsed-code');
        if (btn) btn.innerHTML = '▸ Code';
      } else {
        c.classList.remove('collapsed-code');
        if (btn) btn.innerHTML = '▾ Code';
      }
    });
    const mainBtn = document.getElementById('toggle-all-code-btn');
    if (mainBtn) mainBtn.innerHTML = isAnyExpanded ? '▸ Expand All Code' : '▾ Fold All Code';
  };

  window.toggleDarkMode = function () {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('m3_notebook_theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';

    // Synchronize Plotly 3D graphs
    if (window.Plotly) {
      const darkBg = isDark ? '#0b1120' : '#ffffff';
      const textColor = isDark ? '#f8fafc' : '#0f172a';
      document.querySelectorAll('.plot3d, .plotly-graph-div').forEach(gd => {
        try {
          Plotly.relayout(gd, {
            'paper_bgcolor': darkBg,
            'plot_bgcolor': darkBg,
            'font.color': textColor
          });
        } catch (e) { }
      });
    }
  };

  window.toggleLineNumbers = function () {
    const on = document.body.classList.toggle('show-line-numbers');
    localStorage.setItem('m3_line_numbers', on ? 'true' : 'false');
    const btn = document.getElementById('line-nums-btn');
    if (btn) btn.classList.toggle('active', on);
  };

  window.runAllNotebookCells = function () {
    const cells = Array.from(document.querySelectorAll('.jp-cell-code'));
    const bar = document.getElementById('jp-exec-bar');
    const label = document.getElementById('jp-exec-status-label');
    if (bar) bar.classList.add('active');

    let idx = 0;
    function runNext() {
      if (idx >= cells.length) {
        if (label) label.textContent = '✓ All 32 code cells executed successfully!';
        setTimeout(() => { if (bar) bar.classList.remove('active'); }, 2000);
        return;
      }
      const c = cells[idx];
      const cellIdx = parseInt(c.dataset.index, 10);
      if (label) label.textContent = `Executing Cell ${cellIdx} (${idx + 1} of ${cells.length})...`;
      window.simulateRunCell(cellIdx);
      idx++;
      setTimeout(runNext, 60);
    }
    runNext();
  };

  window.openFormulaModal = function () {
    const modal = document.getElementById('formula-modal');
    if (modal) modal.classList.add('open');
  };

  window.closeFormulaModal = function () {
    const modal = document.getElementById('formula-modal');
    if (modal) modal.classList.remove('open');
  };

  function updateBookmarksSidebar() {
    const list = document.getElementById('jp-bookmarks-list');
    if (!list) return;

    list.innerHTML = '';
    const data = window.NOTEBOOK_DATA;
    if (!data || !data.cells) return;

    let count = 0;
    data.cells.forEach((cell, idx) => {
      const isBm = localStorage.getItem(`m3_bm_${idx}`) === '1';
      const note = localStorage.getItem(`m3_note_${idx}`);
      if (isBm || note) {
        count++;
        const li = document.createElement('li');
        li.className = 'jp-toc-item';
        const titleSnippet = (cell.source || '').replace(/[#*`\n]/g, ' ').slice(0, 38).trim() + '...';
        li.innerHTML = `
          <a href="#cell-${idx}" class="jp-toc-link">
            <span class="jp-toc-badge">C${idx}</span> ${isBm ? '⭐ ' : ''}${titleSnippet}
            ${note ? `<div style="font-size:11px; color:#eab308; margin-top:2px;">📝 "${esc(note.slice(0, 30))}..."</div>` : ''}
          </a>`;
        list.appendChild(li);
      }
    });

    if (count === 0) {
      list.innerHTML = '<li style="padding:10px 8px; font-size:12.5px; color:#94a3b8;">No bookmarks or notes yet. Click ⭐ or 📝 Note on any cell to save key concepts here!</li>';
    }

    const tabBadge = document.getElementById('bookmarks-tab-count');
    if (tabBadge) tabBadge.textContent = count > 0 ? `(${count})` : '';
  }

  function setupToolbarControls() {
    const filterSelect = document.getElementById('jp-filter-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const cells = document.querySelectorAll('.jp-cell');
        cells.forEach(c => {
          if (val === 'all') c.style.display = 'block';
          else if (val === 'code') c.style.display = c.dataset.type === 'code' ? 'block' : 'none';
          else if (val === 'markdown') c.style.display = c.dataset.type === 'markdown' ? 'block' : 'none';
          else if (val === 'widgets') c.style.display = c.dataset.hasWidget === 'true' ? 'block' : 'none';
        });
      });
    }

    const searchInput = document.getElementById('jp-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const cells = document.querySelectorAll('.jp-cell');
        cells.forEach(c => {
          const text = c.textContent.toLowerCase();
          c.style.display = text.includes(term) ? 'block' : 'none';
        });
      });
    }

    // Sidebar tab switching
    const tabToc = document.getElementById('tab-toc');
    const tabBm = document.getElementById('tab-bookmarks');
    const listToc = document.getElementById('jp-toc-list');
    const listBm = document.getElementById('jp-bookmarks-list');

    if (tabToc && tabBm) {
      tabToc.addEventListener('click', () => {
        tabToc.classList.add('active');
        tabBm.classList.remove('active');
        if (listToc) listToc.style.display = 'block';
        if (listBm) listBm.style.display = 'none';
      });
      tabBm.addEventListener('click', () => {
        tabBm.classList.add('active');
        tabToc.classList.remove('active');
        if (listToc) listToc.style.display = 'none';
        if (listBm) listBm.style.display = 'block';
        updateBookmarksSidebar();
      });
    }
  }

  function setupScrollSpyAndProgress() {
    const links = document.querySelectorAll('.jp-toc-link');
    const progressBar = document.getElementById('jp-reading-progress');

    window.addEventListener('scroll', () => {
      // Reading progress
      if (progressBar) {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
        progressBar.style.width = pct + '%';
      }

      // Scroll spy
      if (links.length) {
        let currentId = '';
        const cells = document.querySelectorAll('.jp-cell');
        const scrollPos = window.scrollY + 140;

        cells.forEach(c => {
          if (c.offsetTop <= scrollPos) {
            currentId = c.id;
          }
        });

        links.forEach(l => {
          const href = l.getAttribute('href');
          if (href === '#' + currentId) {
            l.classList.add('active');
          } else {
            l.classList.remove('active');
          }
        });
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotebookShowcase);
  } else {
    initNotebookShowcase();
  }
})();
