const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function formatXp(bytes) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} kB`;
  return `${bytes} B`;
}

// draws a cumulative xp line chart into the given container element
export function drawXpOverTime(container, transactions) {
  container.innerHTML = '';

  if (!transactions || transactions.length === 0) {
    container.textContent = 'no xp data';
    return;
  }

  const W = 500;
  const H = 260;
  const PAD = { top: 20, right: 20, bottom: 50, left: 64 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // build cumulative totals
  let running = 0;
  const points = transactions.map(t => {
    running += t.amount;
    return { date: new Date(t.createdAt), xp: running };
  });

  const minDate = points[0].date.getTime();
  const maxDate = points[points.length - 1].date.getTime();
  const maxXp = points[points.length - 1].xp;
  const dateRange = maxDate - minDate || 1;

  function toX(date) {
    return PAD.left + ((date.getTime() - minDate) / dateRange) * innerW;
  }

  function toY(xp) {
    return PAD.top + innerH - (xp / maxXp) * innerH;
  }

  const svg = createSvgEl('svg', { viewBox: `0 0 ${W} ${H}` });

  // area fill path
  let areaD = `M ${toX(points[0].date)} ${PAD.top + innerH}`;
  areaD += ` L ${toX(points[0].date)} ${toY(points[0].xp)}`;
  for (let i = 1; i < points.length; i++) {
    areaD += ` L ${toX(points[i].date)} ${toY(points[i].xp)}`;
  }
  areaD += ` L ${toX(points[points.length - 1].date)} ${PAD.top + innerH} Z`;
  svg.appendChild(createSvgEl('path', { d: areaD, class: 'graph-area' }));

  // line path
  let lineD = `M ${toX(points[0].date)} ${toY(points[0].xp)}`;
  for (let i = 1; i < points.length; i++) {
    lineD += ` L ${toX(points[i].date)} ${toY(points[i].xp)}`;
  }
  svg.appendChild(createSvgEl('path', { d: lineD, class: 'graph-line' }));

  // x axis
  svg.appendChild(createSvgEl('line', {
    x1: PAD.left, y1: PAD.top + innerH,
    x2: PAD.left + innerW, y2: PAD.top + innerH,
    class: 'graph-axis',
  }));

  // y axis
  svg.appendChild(createSvgEl('line', {
    x1: PAD.left, y1: PAD.top,
    x2: PAD.left, y2: PAD.top + innerH,
    class: 'graph-axis',
  }));

  // y axis labels (4 ticks)
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const xp = (maxXp / yTicks) * i;
    const y = toY(xp);
    svg.appendChild(createSvgEl('line', {
      x1: PAD.left - 4, y1: y, x2: PAD.left, y2: y,
      class: 'graph-axis',
    }));
    const label = createSvgEl('text', {
      x: PAD.left - 8, y: y + 4,
      'text-anchor': 'end',
      class: 'graph-label',
    });
    label.textContent = formatXp(Math.round(xp));
    svg.appendChild(label);
  }

  // x axis labels: show first, middle, last date
  const labelIndices = [0, Math.floor(points.length / 2), points.length - 1];
  for (const idx of labelIndices) {
    const p = points[idx];
    const x = toX(p.date);
    svg.appendChild(createSvgEl('line', {
      x1: x, y1: PAD.top + innerH, x2: x, y2: PAD.top + innerH + 4,
      class: 'graph-axis',
    }));
    const label = createSvgEl('text', {
      x, y: PAD.top + innerH + 16,
      'text-anchor': 'middle',
      class: 'graph-label',
    });
    label.textContent = p.date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    svg.appendChild(label);
  }

  // final xp label at end of line
  const last = points[points.length - 1];
  const endLabel = createSvgEl('text', {
    x: toX(last.date) + 6,
    y: toY(last.xp) + 4,
    class: 'graph-title-label',
  });
  endLabel.textContent = formatXp(last.xp);
  svg.appendChild(endLabel);

  container.appendChild(svg);
}

// draws a bar chart comparing audit xp given vs received
export function drawAuditRatio(container, totalUp, totalDown) {
  container.innerHTML = '';

  if (!totalUp && !totalDown) {
    container.textContent = 'no audit data';
    return;
  }

  const W = 360;
  const H = 220;
  const PAD = { top: 20, right: 20, bottom: 60, left: 64 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(totalUp, totalDown);
  const barW = innerW / 3;
  const gap = innerW / 6;

  const bars = [
    { label: 'given', value: totalUp, cssClass: 'bar-given' },
    { label: 'received', value: totalDown, cssClass: 'bar-received' },
  ];

  const svg = createSvgEl('svg', { viewBox: `0 0 ${W} ${H}` });

  // x axis
  svg.appendChild(createSvgEl('line', {
    x1: PAD.left, y1: PAD.top + innerH,
    x2: PAD.left + innerW, y2: PAD.top + innerH,
    class: 'graph-axis',
  }));

  // y axis
  svg.appendChild(createSvgEl('line', {
    x1: PAD.left, y1: PAD.top,
    x2: PAD.left, y2: PAD.top + innerH,
    class: 'graph-axis',
  }));

  // y ticks
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const val = (maxVal / yTicks) * i;
    const y = PAD.top + innerH - (val / maxVal) * innerH;
    svg.appendChild(createSvgEl('line', {
      x1: PAD.left - 4, y1: y, x2: PAD.left, y2: y,
      class: 'graph-axis',
    }));
    const label = createSvgEl('text', {
      x: PAD.left - 8, y: y + 4,
      'text-anchor': 'end',
      class: 'graph-label',
    });
    label.textContent = formatXp(Math.round(val));
    svg.appendChild(label);
  }

  bars.forEach((bar, i) => {
    const barH = (bar.value / maxVal) * innerH;
    const x = PAD.left + gap + i * (barW + gap);
    const y = PAD.top + innerH - barH;

    svg.appendChild(createSvgEl('rect', {
      x, y, width: barW, height: barH,
      rx: 4,
      class: bar.cssClass,
    }));

    // value label above bar
    const valLabel = createSvgEl('text', {
      x: x + barW / 2,
      y: y - 6,
      'text-anchor': 'middle',
      class: 'graph-title-label',
    });
    valLabel.textContent = formatXp(bar.value);
    svg.appendChild(valLabel);

    // x axis category label
    const catLabel = createSvgEl('text', {
      x: x + barW / 2,
      y: PAD.top + innerH + 18,
      'text-anchor': 'middle',
      class: 'graph-label',
    });
    catLabel.textContent = bar.label;
    svg.appendChild(catLabel);
  });

  // ratio text below bars
  if (totalDown > 0) {
    const ratio = (totalUp / totalDown).toFixed(2);
    const ratioLabel = createSvgEl('text', {
      x: PAD.left + innerW / 2,
      y: PAD.top + innerH + 40,
      'text-anchor': 'middle',
      class: 'graph-title-label',
    });
    ratioLabel.textContent = `ratio: ${ratio}`;
    svg.appendChild(ratioLabel);
  }

  container.appendChild(svg);
}
