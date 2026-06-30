# Sam's Secure Password Generator (SSPG)

My favorite password generator disappeared - so I made my own. 😃 It's available [here](https://sspg.ch) (hosted in Switzerland).

**Everything happens on your device - nothing is logged, stored or sent anywhere.** The app is responsive, PWA ready and cookieless.

Ideas or bugs? [Submit an issue](https://github.com/samuelT2/sams-secure-password-generator/issues/new/choose).

![App-Screenshot](https://github.com/samuelT2/sams-secure-password-generator/blob/main/assets/favicon/app.png "App-Screenshot")
![App-Screenshot](https://github.com/samuelT2/sams-secure-password-generator/blob/main/assets/favicon/app_dark.png "App-Screenshot")

## How it works

- Passwords are generated **entirely client-side** using the browser's CSPRNG
  (`window.crypto.getRandomValues`), with rejection sampling to avoid modulo bias.
- You choose which character types to include (numbers, uppercase, lowercase,
  custom symbols), the length (8–128), and whether the password must start with a
  letter. Each selected type is guaranteed to appear at least once.
- Three suggestions are generated at a time, each with its own copy button.
- No passwords are stored, logged or transmitted. There are no cookies, no
  analytics and no third-party / CDN requests.

## Privacy & security

- **No network calls** beyond loading the static app assets from the same origin.
- A strict **Content-Security-Policy** (`default-src 'self'`, no inline scripts or
  styles) limits what the page is allowed to load.
- Generated passwords live only in the page's input fields; copying uses the
  Clipboard API. Nothing is persisted.

## Offline / PWA

- A service worker ([`sw.js`](sw.js)) caches the app shell for offline use.
- Bump `CACHE_NAME` together with the `?v=` query strings in
  [`index.html`](index.html) whenever assets change, so clients pick up updates.

## Local development

Service workers and the Clipboard API require a secure context, so serve the
folder over `http://localhost` (or HTTPS) rather than opening `index.html` via
`file://`. For example:

```bash
python -m http.server 8080
# then open http://localhost:8080
```

## Tech

Vanilla HTML, CSS and JavaScript - no frameworks, no build step, no dependencies.

## License

See [LICENSE](LICENSE).
