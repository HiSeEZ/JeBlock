const PROFILE_MIME = 'application/x-apple-aspen-config';
const PROFILE_FILES = {
  maximum: 'jeblock-maximum.mobileconfig',
  compatibility: 'jeblock-compatibility.mobileconfig',
  proplus: 'jeblock-proplus.mobileconfig',
  unfiltered: 'jeblock-off.mobileconfig'
};

const $ = (s) => document.querySelector(s);
const installBtn = $('#installBtn');
const compatBtn = $('#compatBtn');
const proPlusBtn = $('#proPlusBtn');
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
  if (!xml.includes('<plist') || !xml.includes('com.apple.dnsSettings.managed')) throw new Error('Invalid configuration profile.');
  triggerProfileDownload(xml, filename);
}

async function prepareButton(button, profile, readyText) {
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = 'Preparing…';
  try {
    await downloadProfile(profile);
    statusTitle.textContent = readyText;
    statusText.textContent = 'Install the downloaded profile in Settings, toggle Airplane Mode on/off, then test again.';
  } catch (error) {
    console.error(error);
    alert('JeBlock could not prepare the profile. Reload this page in Safari and try again.');
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

installBtn.addEventListener('click', () => prepareButton(installBtn, 'maximum', 'OISD profile ready'));
compatBtn.addEventListener('click', () => prepareButton(compatBtn, 'compatibility', 'AdGuard profile ready'));
proPlusBtn.addEventListener('click', () => prepareButton(proPlusBtn, 'proplus', 'Pro++ profile ready'));
offProfileBtn.addEventListener('click', () => prepareButton(offProfileBtn, 'unfiltered', 'Unfiltered profile ready'));

const TEST_ENDPOINTS = [
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  'https://connect.facebook.net/en_US/fbevents.js',
  'https://static.ads-twitter.com/uwt.js'
];

// Use real <script> requests instead of fetch(). Safari can behave inconsistently
// with cross-origin no-cors fetches to ad hosts, especially when DNS filtering is
// returning a blocked address. A script either loads or fails, which makes this
// much more reliable for a simple on-device protection check.
function scriptBlocked(url, timeoutMs = 4500) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    let finished = false;

    const finish = (blocked) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      script.remove();
      resolve(blocked);
    };

    const timer = setTimeout(() => finish(true), timeoutMs);
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.onload = () => finish(false);
    script.onerror = () => finish(true);
    script.src = url + (url.includes('?') ? '&' : '?') + 'jeblock_probe=' + Date.now() + Math.random();
    document.head.appendChild(script);
  });
}

async function testProtection() {
  if (!testBtn) return;

  testBtn.disabled = true;
  testBtn.textContent = 'Checking…';
  testResult.className = 'result';
  testResult.textContent = 'Checking protection…';

  // Absolute escape hatch: the UI must never get stuck on “Checking…”.
  const overallTimeout = new Promise((resolve) => {
    setTimeout(() => resolve(null), 6000);
  });

  try {
    const probe = Promise.all(TEST_ENDPOINTS.map((url) => scriptBlocked(url)));
    const results = await Promise.race([probe, overallTimeout]);

    if (!results) {
      testResult.className = 'result warn';
      testResult.textContent = 'Protection check timed out. Your DNS may still be working — use the blocker benchmark for confirmation.';
      statusDot.className = 'status-dot unknown';
      statusTitle.textContent = 'Protection check inconclusive';
      statusText.textContent = 'The browser test timed out. This does not disable JeBlock.';
      return;
    }

    const blocked = results.filter(Boolean).length;
    const total = results.length;

    if (blocked === total) {
      testResult.className = 'result good';
      testResult.textContent = 'Protection is active.';
      statusDot.className = 'status-dot good';
      statusTitle.textContent = 'Protected';
      statusText.textContent = 'JeBlock is blocking the tested advertising and tracking hosts.';
    } else if (blocked >= 1) {
      testResult.className = 'result warn';
      testResult.textContent = `Protection is partially detected (${blocked}/${total} test hosts blocked).`;
      statusDot.className = 'status-dot unknown';
      statusTitle.textContent = 'Protection partially detected';
      statusText.textContent = 'Some advertising hosts are blocked. The full benchmark gives a better measurement.';
    } else {
      testResult.className = 'result bad';
      testResult.textContent = 'Protection was not detected.';
      statusDot.className = 'status-dot bad';
      statusTitle.textContent = 'Not protected';
      statusText.textContent = 'Check that the JeBlock DNS profile is installed and active.';
    }
  } catch (error) {
    console.error('JeBlock protection test failed:', error);
    testResult.className = 'result warn';
    testResult.textContent = 'Protection check could not complete. Use the blocker benchmark to confirm filtering.';
    statusDot.className = 'status-dot unknown';
    statusTitle.textContent = 'Check inconclusive';
    statusText.textContent = 'JeBlock may still be active; the browser-side test could not complete.';
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Check protection';
  }
}

testBtn.addEventListener('click', testProtection);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
