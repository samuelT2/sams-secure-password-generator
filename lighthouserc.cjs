/**
 * Lighthouse CI: Performance als Fail-Faktor im Deploy.
 * Vorlage: sams-toolbox/seo/lighthouserc.cjs (Beschreibung in seo/README.md, Abschnitt "Performance-Gate").
 * Pro Projekt angepasst werden nur PATHS und THRESHOLDS.
 *
 * Hinweis: keine eigenen Variablen mit Präfix LHCI_, die liest Lighthouse CI selbst als Optionen.
 *
 * Gleiche Messung wie pagespeed.web.dev: Lighthouse, Mobil-Profil mit simuliertem 4G, 3 Läufe pro URL,
 * bewertet wird der Median. Aufruf im Workflow:
 *
 *   LH_URL=https://example.ch LH_PROFILE=prod npx --yes @lhci/cli@0.15.1 autorun --config=lighthouserc.cjs
 *
 *   LH_URL         zu messender Host, ohne Pfad (Pflicht)
 *   LH_PROFILE     prod | test | local: wählt die Schwellen (lokal ohne gzip/Cache des Hosters ist langsamer)
 *   LH_BASIC_AUTH  "benutzer:passwort" für einen passwortgeschützten TEST-Host. Geht als Authorization-Header an
 *                  alle Requests der Seite, auch an fremde Hosts: nur für TEST-Zugänge verwenden, nie für echte.
 *
 * Ergebnis: .lighthouseci/ (Berichte als HTML/JSON, im Workflow als Artefakt hochgeladen). Den Ordner nie deployen.
 * Schwellen knapp unter den gemessenen Werten setzen (Lighthouse schwankt um ±5–10 Punkte) und nachziehen, wenn
 * eine Site dauerhaft besser wird.
 */
// "/" ist Englisch (x-default). Achtung: .htaccess leitet Browser mit deutscher Accept-Language von "/" auf "/de/"
// um. Der Runner (ubuntu-latest) schickt en-US; lokal mit deutschem Edge/Chrome zusätzlich
// --collect.settings.chromeFlags="--headless=new --accept-lang=en-US" angeben, sonst wird "/" zweimal als /de/ gemessen.
const PATHS = ['/', '/de/'];

const THRESHOLDS = {
  // Scores 0–1, Messwerte in ms (CLS ohne Einheit). Kein TEST-Host: nur prod (Live-Domain nach dem Deploy) und local
  // (gebaute Site im Runner vor dem Deploy, ohne gzip/Cache-Header des Hosters).
  prod: { performance: 0.85, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95, lcp: 3000, cls: 0.1, tbt: 400 },
  local: { performance: 0.7, accessibility: 0.9, 'best-practices': 0.8, seo: 0.8, lcp: 4500, cls: 0.1, tbt: 600 },
};

const base = (process.env.LH_URL || '').replace(/\/+$/, '');
if (!base) throw new Error('LH_URL fehlt, z.B. https://example.ch');
const profile = process.env.LH_PROFILE || 'prod';
const t = THRESHOLDS[profile];
if (!t) throw new Error(`LH_PROFILE ${profile} unbekannt (${Object.keys(THRESHOLDS).join(', ')})`);
const auth = process.env.LH_BASIC_AUTH || '';

module.exports = {
  ci: {
    collect: {
      url: PATHS.map((p) => base + p),
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        ...(auth ? { extraHeaders: JSON.stringify({ Authorization: 'Basic ' + Buffer.from(auth).toString('base64') }) } : {}),
      },
    },
    assert: {
      aggregationMethod: 'median',
      assertions: {
        'categories:performance': ['error', { minScore: t.performance }],
        'categories:accessibility': ['error', { minScore: t.accessibility }],
        'categories:best-practices': ['error', { minScore: t['best-practices'] }],
        'categories:seo': ['error', { minScore: t.seo }],
        'largest-contentful-paint': ['error', { maxNumericValue: t.lcp }],
        'cumulative-layout-shift': ['error', { maxNumericValue: t.cls }],
        'total-blocking-time': ['error', { maxNumericValue: t.tbt }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' },
  },
};
