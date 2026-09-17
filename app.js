const PROFILE_MIME = 'application/x-apple-aspen-config';
const PROFILE_FILES = {
  maximum: 'jeblock-maximum.mobileconfig',
  compatibility: 'jeblock-compatibility.mobileconfig',
  unfiltered: 'jeblock-off.mobileconfig'
};

const $ = (s) => document.querySelector(s);
const installBtn = $('#installBtn');
const compatBtn = $('#compatBtn');
const offProfileBtn = $('#offProfileBtn');
const testBtn = $('#testBtn');
const testResult = $('#testResult');
const statusDot = $('#statusDot');
const statusTitle = $('#statusTitle');
const statusText = $('#statusText');

function triggerProfileDownload(xml, filename) {
  const blob = new Blob([xml], { type: PROFILE_MIME });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.type = PROFILE_MIME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60000);
}

async function downloadProfile(profile) {
  const filename = PROFILE_FILES[profile];
  if (!filename) throw new Error('Unknown JeBlock profile.');
  const response = await fetch(`./${filename}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load ${filename}.`);
  const xml = await response.text();
  if (!xml.includes('<plist') || !xml.includes('PayloadType')) {
    throw new Error('Invalid configuration profile.');
  }
  triggerProfileDownload(xml, filename);
}

async function prepareButton(button, profile, readyText) {
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = 'Preparing…';
  try {
    await downloadProfile(profile);
    statusTitle.textContent = readyText;
    statusText.textContent = 'Open the downloaded profile, install it in Settings, then return here and check protection.';
  } catch (error) {
    console.error(error);
    alert('JeBlock could not prepare the profile. Reload this page in Safari and try again.');
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

installBtn.addEventListener('click', () => prepareButton(installBtn, 'maximum', 'Profile ready'));
compatBtn.addEventListener('click', () => prepareButton(compatBtn, 'compatibility', 'Compatibility profile ready'));
offProfileBtn.addEventListener('click', () => prepareButton(offProfileBtn, 'unfiltered', 'Unfiltered profile ready'));

const TEST_ENDPOINTS = [
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  'https://googleads.g.doubleclick.net/pagead/id',
  'https://adservice.google.com/adsid/integrator.js',
  'https://connect.facebook.net/en_US/fbevents.js',
  'https://analytics.google.com/g/collect'
];

async function endpointBlocked(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    await fetch(url + (url.includes('?') ? '&' : '?') + 'jeblock_test=' + Date.now(), {
      mode: 'no-cors', cache: 'no-store', signal: controller.signal
    });
    return false;
  } catch (_) {
    return true;
  } finally {
    clearTimeout(timer);
  }
}

async function testProtection() {
  testBtn.disabled = true;
  testBtn.textContent = 'Checking…';
  testResult.className = 'result';
  testResult.textContent = 'Checking several common ad and tracker endpoints…';

  const results = await Promise.all(TEST_ENDPOINTS.map(endpointBlocked));
  const blocked = results.filter(Boolean).length;

  if (blocked >= 4) {
    testResult.className = 'result good';
    testResult.textContent = 'Protection is active.';
    statusDot.className = 'status-dot good';
    statusTitle.textContent = 'Protected';
    statusText.textContent = 'JeBlock is blocking common ad and tracker endpoints.';
  } else if (blocked >= 2) {
    testResult.className = 'result warn';
    testResult.textContent = 'Protection may be active, but the result is mixed. Try Airplane Mode on/off, then test again.';
    statusDot.className = 'status-dot unknown';
    statusTitle.textContent = 'Protection uncertain';
    statusText.textContent = 'Some ad/tracker endpoints are blocked and some are reachable.';
  } else {
    testResult.className = 'result bad';
    testResult.textContent = 'Protection was not detected. Make sure the JeBlock profile is installed and active.';
    statusDot.className = 'status-dot bad';
    statusTitle.textContent = 'Not protected';
    statusText.textContent = 'Install the JeBlock profile, then check protection again.';
  }

  testBtn.disabled = false;
  testBtn.textContent = 'Check protection';
}

testBtn.addEventListener('click', testProtection);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
