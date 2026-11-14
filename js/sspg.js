'use strict';

(() => {
  const NUMS = '1234567890';
  const UPPS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWS = 'abcdefghijklmnopqrstuvwxyz';
  const LETTERS = UPPS + LOWS;

  const MIN_LENGTH = 8;
  const MAX_LENGTH = 128;
  const MAX_SYMBOLS = 100;
  const PASSWORD_COUNT = 3;

  // UI texts created in JS. The language comes from <html lang> ("en" on /,
  // "de-CH" on /de/), so both page versions share this one script.
  const MESSAGES = {
    en: {
      symbolsRequired: "Please enter at least one symbol when 'Include symbols' is checked.",
      typeRequired: 'Please select at least one character type.',
      copied: '✔ Copied!',
      copiedAnnounce: 'Password copied to clipboard.',
      copyFailed: 'Could not copy to clipboard.',
    },
    de: {
      symbolsRequired: 'Bitte mindestens ein Sonderzeichen eingeben, wenn «Sonderzeichen verwenden» aktiviert ist.',
      typeRequired: 'Bitte mindestens eine Zeichenart auswählen.',
      copied: '✔ Kopiert!',
      copiedAnnounce: 'Passwort in die Zwischenablage kopiert.',
      copyFailed: 'Kopieren in die Zwischenablage fehlgeschlagen.',
    },
  };
  const LANG = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
  const T = MESSAGES[LANG] || MESSAGES.en;

  // Cached references to status regions (assigned on init).
  let formError = null;
  let copyStatus = null;

  /**
   * Returns a uniformly distributed integer in [0, range) using the
   * platform CSPRNG with rejection sampling to avoid modulo bias.
   */
  function secureRandomInt(range) {
    const sample = new Uint32Array(1);
    // Smallest accepted value: discards the non-uniform tail so the
    // remaining range is an exact multiple of `range`.
    const min = (2 ** 32) % range;
    let x;
    do {
      crypto.getRandomValues(sample);
      x = sample[0];
    } while (x < min);
    return x % range;
  }

  function randomFrom(str) {
    return str[secureRandomInt(str.length)];
  }

  // Fisher–Yates shuffle backed by the CSPRNG.
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Keep only characters that are not already covered by the digit/letter
  // pools, de-duplicate, and cap the length.
  function sanitizeSymbols(input) {
    const reserved = new Set((NUMS + UPPS + LOWS).split(''));
    const result = new Set();
    for (const char of input) {
      if (!reserved.has(char)) {
        result.add(char);
        if (result.size >= MAX_SYMBOLS) break;
      }
    }
    return [...result].join('');
  }

  function clampLength(value) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return MIN_LENGTH;
    return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, n));
  }

  function showError(message) {
    if (!formError) return;
    formError.textContent = message;
    formError.hidden = false;
  }

  function clearError() {
    if (!formError) return;
    formError.textContent = '';
    formError.hidden = true;
  }

  function generatePasswords() {
    clearError();

    const opts = {
      numbers: document.getElementById('numbers').checked,
      uppercases: document.getElementById('uppercases').checked,
      lowercases: document.getElementById('lowercases').checked,
      symbols: document.getElementById('symbols').checked,
      startsWithLetter: document.getElementById('startsWithLetter').checked,
      length: clampLength(document.getElementById('length').value),
    };

    let charPool = '';
    let customSyms = '';

    if (opts.numbers) charPool += NUMS;
    if (opts.uppercases) charPool += UPPS;
    if (opts.lowercases) charPool += LOWS;

    if (opts.symbols) {
      const inputField = document.getElementById('customSymbols');

      if (inputField.value.trim().length === 0) {
        showError(T.symbolsRequired);
        return;
      }

      customSyms = sanitizeSymbols(inputField.value);
      inputField.value = customSyms;
      charPool += customSyms;
    }

    if (charPool.length === 0) {
      showError(T.typeRequired);
      return;
    }

    const useLetters = opts.startsWithLetter && LETTERS.length > 0;
    const passwords = [];

    for (let i = 0; i < PASSWORD_COUNT; i++) {
      const mandatory = [];
      if (opts.numbers) mandatory.push(randomFrom(NUMS));
      if (opts.uppercases) mandatory.push(randomFrom(UPPS));
      if (opts.lowercases) mandatory.push(randomFrom(LOWS));
      if (opts.symbols && customSyms.length > 0) mandatory.push(randomFrom(customSyms));

      let firstChar = '';
      let remainingLength = opts.length;
      if (useLetters) {
        firstChar = randomFrom(LETTERS);
        remainingLength--;
      }

      const restPool = [];
      for (let j = 0; j < remainingLength - mandatory.length; j++) {
        restPool.push(randomFrom(charPool));
      }

      const body = shuffle([...mandatory, ...restPool]).join('');
      passwords.push(firstChar + body);
    }

    passwords.forEach((pw, i) => {
      document.getElementById(`password-${i + 1}`).value = pw;
    });
  }

  function announce(message) {
    if (!copyStatus) return;
    // Reset first so identical consecutive messages are re-announced.
    copyStatus.textContent = '';
    copyStatus.textContent = message;
  }

  function showCopyFeedback(button) {
    const row = button.closest('.result-row');
    if (!row) return;
    let badge = row.querySelector('.copy-feedback');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'copy-feedback';
      badge.textContent = T.copied;
      button.insertAdjacentElement('afterend', badge);
    }
    clearTimeout(badge.dataset.timer);
    badge.dataset.timer = setTimeout(() => badge.remove(), 2000);
    announce(T.copiedAnnounce);
  }

  function copyToClipboard(id) {
    const input = document.getElementById(id);
    if (!input || input.value === '') return;
    const button = input.parentElement.querySelector('[data-copy-target]');

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(input.value)
        .then(() => showCopyFeedback(button))
        .catch(() => announce(T.copyFailed));
      return;
    }

    // Fallback for non-secure contexts (e.g. plain http during local testing).
    input.select();
    input.setSelectionRange(0, input.value.length);
    if (document.execCommand('copy')) {
      showCopyFeedback(button);
    } else {
      announce(T.copyFailed);
    }
    window.getSelection()?.removeAllRanges();
  }

  document.addEventListener('DOMContentLoaded', () => {
    formError = document.getElementById('formError');
    copyStatus = document.getElementById('copyStatus');

    generatePasswords();

    document.getElementById('generator')?.addEventListener('submit', (e) => {
      e.preventDefault();
      generatePasswords();
    });

    document.querySelectorAll('[data-copy-target]').forEach((button) => {
      button.addEventListener('click', () => {
        copyToClipboard(button.getAttribute('data-copy-target'));
      });
    });

    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  });
})();
