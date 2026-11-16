#!/usr/bin/env node
/**
 * Fasst den Lauf von Lighthouse CI als Markdown-Tabelle zusammen (Median-Lauf pro URL).
 * Vorlage: sams-toolbox/seo/lighthouse-summary.cjs. Im Workflow nach "lhci autorun", auch wenn es fehlschlug:
 *
 *   node scripts/lighthouse-summary.cjs >> "$GITHUB_STEP_SUMMARY"
 *
 * Liest .lighthouseci/reports/manifest.json (upload.target filesystem in lighthouserc.cjs).
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), '.lighthouseci', 'reports');
const manifestFile = path.join(dir, 'manifest.json');
if (!fs.existsSync(manifestFile)) {
  console.log('Lighthouse: kein Ergebnis (.lighthouseci/reports/manifest.json fehlt).');
  process.exit(0);
}
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const pct = (v) => (typeof v === 'number' ? Math.round(v * 100) : '–');
const rows = ['| URL | Performance | Barrierefreiheit | Best Practices | SEO | LCP | CLS | TBT |',
  '|---|---|---|---|---|---|---|---|'];
for (const run of manifest.filter((r) => r.isRepresentativeRun)) {
  const lhr = JSON.parse(fs.readFileSync(run.jsonPath, 'utf8'));
  const audit = (id) => lhr.audits[id] && lhr.audits[id].numericValue;
  const ms = (v) => (typeof v === 'number' ? (v / 1000).toFixed(1) + ' s' : '–');
  const cls = audit('cumulative-layout-shift');
  rows.push(`| ${run.url} | ${pct(run.summary.performance)} | ${pct(run.summary.accessibility)} | `
    + `${pct(run.summary['best-practices'])} | ${pct(run.summary.seo)} | ${ms(audit('largest-contentful-paint'))} | `
    + `${typeof cls === 'number' ? cls.toFixed(3) : '–'} | ${typeof audit('total-blocking-time') === 'number' ? Math.round(audit('total-blocking-time')) + ' ms' : '–'} |`);
}
console.log('### Lighthouse (Mobil, Median aus 3 Läufen)\n');
console.log(rows.join('\n'));
console.log('\nBerichte: Artefakt "lighthouse" dieses Laufs (HTML pro URL).');
