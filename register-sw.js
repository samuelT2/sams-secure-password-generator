if (location.protocol === 'https:' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}