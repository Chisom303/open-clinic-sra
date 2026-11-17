// Charts drawn as inline SVG: no chart library and no network requests, so they work
// offline, keep the tool's privacy promise, and print sharply in the report.
// Every chart carries its numbers as text and a one-sentence summary for screen readers.

const LEVEL_WORD = ['', 'Low', 'Medium', 'High'];
const band = (risk) => (risk >= 6 ? 'high' : risk >= 3 ? 'medium' : 'low');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** 3 × 3 grid: likelihood (rows, high at top) × impact (columns). Counts gaps per cell. */
export function heatMap(findings) {
  const counts = {};
  for (const f of findings) counts[`${f.likelihood}-${f.impact}`] = (counts[`${f.likelihood}-${f.impact}`] ?? 0) + 1;
  const cell = 64;
  const x0 = 78;
  const y0 = 10;
  let cells = '';
  for (let l = 3; l >= 1; l--) {
    for (let i = 1; i <= 3; i++) {
      const n = counts[`${l}-${i}`] ?? 0;
      const x = x0 + (i - 1) * (cell + 4);
      const y = y0 + (3 - l) * (cell + 4);
      cells += `<rect class="hm-cell ${n ? `hm-${band(l * i)}` : 'hm-empty'}" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="6"/>`;
      cells += `<text class="hm-count${n ? '' : ' hm-zero'}" x="${x + cell / 2}" y="${y + cell / 2 + 7}" text-anchor="middle">${n}</text>`;
    }
  }
  let axes = '';
  for (let l = 3; l >= 1; l--) {
    const y = y0 + (3 - l) * (cell + 4) + cell / 2 + 5;
    axes += `<text class="viz-label" x="${x0 - 8}" y="${y}" text-anchor="end">${LEVEL_WORD[l]}</text>`;
  }
  for (let i = 1; i <= 3; i++) {
    const x = x0 + (i - 1) * (cell + 4) + cell / 2;
    axes += `<text class="viz-label" x="${x}" y="${y0 + 3 * (cell + 4) + 14}" text-anchor="middle">${LEVEL_WORD[i]}</text>`;
  }
  const w = x0 + 3 * (cell + 4);
  const h = y0 + 3 * (cell + 4) + 40;
  axes += `<text class="viz-axis" x="${x0 + (3 * (cell + 4)) / 2}" y="${h - 4}" text-anchor="middle">Impact →</text>`;
  axes += `<text class="viz-axis" transform="translate(12 ${y0 + (3 * (cell + 4)) / 2}) rotate(-90)" text-anchor="middle">Likelihood →</text>`;

  const top = counts['3-3'] ?? 0;
  const highBand = Object.entries(counts).filter(([k]) => { const [l, i] = k.split('-').map(Number); return l * i >= 6; }).reduce((a, [, n]) => a + n, 0);
  const summary = findings.length
    ? `${highBand} of ${findings.length} gaps are in the high-risk zone${top ? `, including ${top} rated high likelihood and high impact` : ''}.`
    : 'No gaps to show.';
  return `<figure class="viz">
    <figcaption class="viz-title">Where your gaps sit</figcaption>
    <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Risk heat map. ${esc(summary)}">${cells}${axes}</svg>
    <p class="viz-note">${esc(summary)} Each number counts gaps rated by how likely they are to be exploited and how much harm they could cause.</p>
  </figure>`;
}

const WINDOWS = [7, 14, 30, 60, 90];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const SEV_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

/** Stacked bars: how many gaps fall due in each window, split by severity. */
export function timeline(findings) {
  const rows = WINDOWS.map((d, idx) => {
    const lo = idx ? WINDOWS[idx - 1] : 0;
    const items = findings.filter((f) => f.fix_within_days > lo && (f.fix_within_days <= d || idx === WINDOWS.length - 1));
    return { d, items };
  });
  const max = Math.max(1, ...rows.map((r) => r.items.length));
  const labelW = 70;
  const barW = 190;
  const rowH = 30;
  const top = 30;
  let out = '';
  // Legend
  let lx = 0;
  for (const s of SEVERITIES) {
    out += `<rect class="sev-${s}" x="${lx}" y="4" width="10" height="10" rx="2"/><text class="viz-label" x="${lx + 14}" y="13">${SEV_LABEL[s]}</text>`;
    lx += s === 'critical' ? 66 : s === 'medium' ? 70 : 48;
  }
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    out += `<text class="viz-label" x="${labelW - 8}" y="${y + 15}" text-anchor="end">${r.d} days</text>`;
    out += `<rect class="viz-track" x="${labelW}" y="${y + 3}" width="${barW}" height="16" rx="3"/>`;
    let x = labelW;
    for (const s of SEVERITIES) {
      const n = r.items.filter((f) => f.severity === s).length;
      if (!n) continue;
      const w = (n / max) * barW;
      out += `<rect class="sev-${s}" x="${x}" y="${y + 3}" width="${w}" height="16"/>`;
      x += w;
    }
    out += `<text class="viz-count" x="${labelW + barW + 8}" y="${y + 15}">${r.items.length}</text>`;
  });
  const h = top + rows.length * rowH + 2;
  const soon = rows[0].items.length + rows[1].items.length;
  const summary = findings.length
    ? `${soon} of ${findings.length} gaps should be fixed within 14 days${rows[0].items.length ? `, ${rows[0].items.length} of them within 7 days` : ''}.`
    : 'No gaps to schedule.';
  return `<figure class="viz">
    <figcaption class="viz-title">When to fix them</figcaption>
    <svg viewBox="0 0 ${labelW + barW + 30} ${h}" role="img" aria-label="Remediation timeline. ${esc(summary)}">${out}</svg>
    <p class="viz-note">${esc(summary)} Bars count gaps by suggested deadline, colored by severity.</p>
  </figure>`;
}

/** Horizontal bars of remaining risk per section (for the printed report). */
export function areaBars(sections, scored) {
  const labelW = 190;
  const barW = 220;
  const rowH = 24;
  let out = '';
  sections.forEach((s, i) => {
    const sc = scored[s.id] ?? { ratio: 0, level: 'low', max: 0 };
    const y = i * rowH;
    const pct = Math.round(sc.ratio * 100);
    out += `<text class="viz-label" x="${labelW - 8}" y="${y + 14}" text-anchor="end">${esc(s.title)}</text>`;
    out += `<rect class="viz-track" x="${labelW}" y="${y + 3}" width="${barW}" height="14" rx="3"/>`;
    if (sc.max) out += `<rect class="lvl-${sc.level}" x="${labelW}" y="${y + 3}" width="${Math.max(2, (pct / 100) * barW)}" height="14" rx="3"/>`;
    out += `<text class="viz-count" x="${labelW + barW + 8}" y="${y + 14}">${sc.max ? `${pct}%` : '—'}</text>`;
  });
  const worst = [...sections].filter((s) => scored[s.id]?.max).sort((a, b) => scored[b.id].ratio - scored[a.id].ratio)[0];
  const summary = worst ? `Highest remaining risk: ${worst.title} (${Math.round(scored[worst.id].ratio * 100)}%).` : 'No areas assessed yet.';
  return `<figure class="viz viz-wide">
    <svg viewBox="0 0 ${labelW + barW + 44} ${sections.length * rowH + 4}" role="img" aria-label="Remaining risk by area. ${esc(summary)}">${out}</svg>
    <p class="viz-note">${esc(summary)}</p>
  </figure>`;
}
