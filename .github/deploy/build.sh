#!/usr/bin/env bash
# Build for the deployment, in the checkout (in place): minify HTML, CSS and JS. The committed source files stay
# readable. Called by prod-deploy.yml and tests.yml, so the tests check exactly what is deployed.
#
#   bash .github/deploy/build.sh
#
# Tool versions are pinned for reproducible builds.
set -euo pipefail

minify_js() {
  npx -y terser@5.48.0 "$1" -c -m -o "$1.min"
  mv "$1.min" "$1"
}

minify_js js/sspg.js
minify_js register-sw.js
minify_js sw.js
npx -y clean-css-cli@5.6.3 css/style.css -o css/style.css.min
mv css/style.css.min css/style.css
# all HTML pages (incl. the German version de/ and the 404 page), also removes the comments
for page in index.html de/index.html 404.html; do
  npx -y html-minifier-terser@7.2.0 \
    --collapse-whitespace --remove-comments \
    "$page" -o "$page.min"
  mv "$page.min" "$page"
done
