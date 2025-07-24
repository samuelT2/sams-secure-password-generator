const nums = '1234567890';
const upps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lows = 'abcdefghijklmnopqrstuvwxyz';

function cryptoSafeRandom(length) {
  const crypto = window.crypto || window.msCrypto;
  const randNum = new Uint32Array(1);
  let x;
  const min = (-length >>> 0) % length;
  do {
    crypto.getRandomValues(randNum);
    x = randNum[0];
  } while (x < min);
  return x % length;
}

function randomFrom(str) {
  return str[cryptoSafeRandom(str.length)];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = cryptoSafeRandom(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generatePasswords() {
  const opts = {
    numbers: document.getElementById('numbers').checked,
    uppercases: document.getElementById('uppercases').checked,
    lowercases: document.getElementById('lowercases').checked,
    symbols: document.getElementById('symbols').checked,
    startsWithLetter: document.getElementById('startsWithLetter').checked,
    length: parseInt(document.getElementById('length').value)
  };

  let charPool = '';

  if (opts.numbers) charPool += nums;
  if (opts.uppercases) charPool += upps;
  if (opts.lowercases) charPool += lows;
  if (opts.symbols) {
    const inputField = document.getElementById('customSymbols');
    let customSyms = inputField.value;

    if (customSyms.trim().length === 0) {
      alert("Please enter at least one symbol when 'Include symbols' is checked.");
      return;
    }

    customSyms = sanitizeSymbols(customSyms);
    inputField.value = customSyms;

    if (customSyms.length > 0) {
      charPool += customSyms;
    }
  }

  if (charPool.length === 0) {
    alert("Please select at least one character type.");
    return;
  }

  const letters = (upps + lows);
  const useLetters = opts.startsWithLetter && (letters.length > 0);
  const passwords = [];

  for (let i = 0; i < 3; i++) {

    let mandatory = [];

    if (opts.numbers) mandatory.push(randomFrom(nums));
    if (opts.uppercases) mandatory.push(randomFrom(upps));
    if (opts.lowercases) mandatory.push(randomFrom(lows));
    if (opts.symbols) {
      const customSyms = document.getElementById('customSymbols').value;
      if (customSyms.length > 0) {
        mandatory.push(randomFrom(customSyms));
      }
    }

    let firstChar = '';
    opts.length < 8 && (opts.length = 8);
    opts.length > 128 && (opts.length = 128);
    let remainingLength = opts.length;

    if (useLetters) {
      firstChar = randomFrom(letters);
      remainingLength--;
    }

    const restPool = [];
    for (let j = 0; j < remainingLength - mandatory.length; j++) {
      restPool.push(randomFrom(charPool));
    }

    const restShuffled = shuffle([...mandatory, ...restPool]);
    const finalPassword = firstChar + restShuffled.join('');
    passwords.push(finalPassword);
  }

  document.getElementById('password-1').value = passwords[0];
  document.getElementById('password-2').value = passwords[1];
  document.getElementById('password-3').value = passwords[2];
}

function copyToClipboard(id) {
  const input = document.getElementById(id);
  const text = input.value;
  const button = input.nextElementSibling;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showCopyMessage(button);
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  } else {
    input.select();
    input.setSelectionRange(0, 99999);
    const successful = document.execCommand("copy");
    if (successful) {
      showCopyMessage(button);
    }
  }
}

function showCopyMessage(button) {
  const message = document.createElement('span');
  message.textContent = '✔ Copied!';
  message.style.marginLeft = '0.5rem';
  message.style.color = 'lightgreen';
  message.style.fontSize = '0.9rem';
  message.style.fontWeight = 'bold';

  button.insertAdjacentElement('afterend', message);

  document.getElementById('copyStatus').textContent = 'Password copied to clipboard.';

  setTimeout(() => message.remove(), 7500);
}

function sanitizeSymbols(input) {
  const maxLen = 100;
  const allBlocked = new Set((nums + upps + lows).split(''));
  const resultSet = new Set();

  for (const char of input) {
    if (!allBlocked.has(char)) {
      resultSet.add(char);
      if (resultSet.size >= maxLen) break;
    }
  }

  return [...resultSet].join('');
}

document.addEventListener('DOMContentLoaded', () => {
  generatePasswords();
  document.getElementById('generateBtn')?.addEventListener('click', generatePasswords);
  document.querySelectorAll('[data-copy-target]').forEach(button => {
    button.addEventListener('click', () => {
      copyToClipboard(button.getAttribute('data-copy-target'));
    });
  });
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});