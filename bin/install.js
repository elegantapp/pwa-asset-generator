import installer from '../dist/helpers/installer.js';
installer
  .installPreferredBrowserRevision()
  .then((info) => console.log('Installed chromium rev', info));
