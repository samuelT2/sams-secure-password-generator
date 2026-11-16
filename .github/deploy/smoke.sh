#!/usr/bin/env bash
# Smoke-Test der Website: jede Seite aus der Sitemap (und die zusätzlich angegebenen) mit HTTP 200, vollständig
# (</html>), ohne PHP-Fehlermeldung, dazu jede lokal verlinkte Datei (CSS, JS, Bilder, Icons) und die 404-Seite.
# Läuft in tests.yml gegen den gebauten Checkout (lokaler Server) und in prod-deploy.yml nach dem Deploy gegen PROD.
#
#   bash .github/deploy/smoke.sh <basis-url> [weitere Pfade ...]
#   z.B. bash .github/deploy/smoke.sh http://127.0.0.1:8080 /impressum /datenschutz
set -euo pipefail

base=${1:?Basis-URL fehlt}
base=${base%/}
shift
failed=0
body=$(mktemp)
trap 'rm -f "$body"' EXIT

fetch() {
  curl --silent --show-error --location --retry 3 --retry-delay 5 --connect-timeout 10 --max-time 30 \
    -o "$body" -w '%{http_code}' "$base$1" || echo 000
}

fail() {
  echo "::error::$1"
  failed=1
}

# HTML-Seite prüfen und ihre lokalen Verweise merken
declare -A assets=()
check_html() {
  local path=$1 ref
  grep -q '</html>' "$body" || fail "$path: unvollständig (kein </html>)"
  if grep -qE '(Fatal error|Parse error|Warning|Notice|Deprecated)(</b>)?: .* on line (<b>)?[0-9]+' "$body"; then
    fail "$path: PHP-Fehlermeldung in der Seite"
  fi
  if grep -q '__BUILD__' "$body"; then
    fail "$path: Platzhalter __BUILD__ nicht ersetzt"
  fi
  while IFS= read -r ref; do
    ref=${ref%%#*}
    ref=${ref%%\?*}
    case "$ref" in
      '' | http:* | https:* | //* | mailto:* | tel:* | data:* | javascript:*) continue ;;
      /*) assets[$ref]=1 ;;
      *) assets[${path%/*}/$ref]=1 ;;
    esac
  done < <(grep -oE '(href|src)="[^"]*"' "$body" | sed -E 's/^(href|src)="//; s/"$//' | sed 's/&amp;/\&/g')
}

# Seiten: Sitemap (absolute URLs, nur der Pfad zählt) + Startseite + Argumente
status=$(fetch /sitemap.xml)
[ "$status" = 200 ] || fail "/sitemap.xml: HTTP $status"
declare -A pages=([/]=1)
if [ "$status" = 200 ]; then
  while IFS= read -r path; do
    pages[$path]=1
  done < <(grep -oE '<loc>[^<]+</loc>' "$body" | sed -E 's#<loc>https?://[^/]+##; s#</loc>##; s#^$#/#')
fi
for path in "$@"; do
  pages[$path]=1
done

for path in "${!pages[@]}"; do
  status=$(fetch "$path")
  if [ "$status" != 200 ]; then
    fail "$path: HTTP $status"
    continue
  fi
  check_html "$path"
done

status=$(fetch /robots.txt)
[ "$status" = 200 ] || fail "/robots.txt: HTTP $status"

# Fehlerseite: unbekannte Adresse -> 404 mit vollständiger Seite
status=$(fetch /smoke-test-gibt-es-nicht)
[ "$status" = 404 ] || fail "/smoke-test-gibt-es-nicht: HTTP $status statt 404"

for ref in "${!assets[@]}"; do
  status=$(fetch "$ref")
  [ "$status" = 200 ] || fail "$ref: HTTP $status (verlinkt in einer Seite)"
done

echo "Geprüft: ${#pages[@]} Seiten, ${#assets[@]} verlinkte Dateien, robots.txt, sitemap.xml und 404 auf $base"
exit "$failed"
