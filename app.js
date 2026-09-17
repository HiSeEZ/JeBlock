const PROFILE_FILES = {
  standard: 'jezblock-standard.mobileconfig',
  family: 'jezblock-family.mobileconfig',
  unfiltered: 'jezblock-off.mobileconfig'
};

const PROFILE_NAMES = {
  standard: 'Standard',
  family: 'Family',
  custom: 'Custom'
};

const PROFILE_MIME = 'application/x-apple-aspen-config';

const $ = (s) => document.querySelector(s);
const radios = [...document.querySelectorAll('input[name="profile"]')];
const installBtn = $('#installBtn');
const offProfileBtn = $('#offProfileBtn');
const customBox = $('#customBox');
const customUrl = $('#customUrl');
const testBtn = $('#testBtn');
const testResult = $('#testResult');
const statusDot = $('#statusDot');
const statusTitle = $('#statusTitle');
const statusText = $('#statusText');

function selectedProfile() {
  return radios.find(r => r.checked)?.value || 'standard';
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, c => ({
    '<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '"':'&quot;'
  })[c]);
}

function profileXml(serverUrl) {
  const id1 = crypto.randomUUID().toUpperCase();
  const id2 = crypto.randomUUID().toUpperCase();
  const clean = escapeXml(serverUrl);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key>
        <string>HTTPS</string>
        <key>ServerURL</key>
        <string>${clean}</string>
        <key>AllowFailover</key>
        <false/>
      </dict>
      <key>PayloadDisplayName</key>
      <string>JezBlock Custom DNS</string>
      <key>PayloadIdentifier</key>
      <string>com.jezblock.dns.custom</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>${id1}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Custom encrypted DNS profile generated locally by JezBlock.</string>
  <key>PayloadDisplayName</key>
  <string>JezBlock Custom DNS</string>
  <key>PayloadIdentifier</key>
  <string>com.jezblock.profile.custom</string>
  <key>PayloadOrganization</key>
  <string>JezBlock</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${id2}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
}

function triggerProfileDownload(xml, filename) {
  // GitHub Pages may serve .mobileconfig as plain text. Rebuilding the file
  // in-browser gives Safari the Apple configuration-profile MIME type.
  const blob = new Blob([xml], { type: PROFILE_MIME });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.type = PROFILE_MIME;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Keep the object URL alive long enough for iOS to hand the file off.
  setTimeout(() => URL.revokeObjectURL(href), 60000);
}

async function downloadBundledProfile(profile) {
  const filename = PROFILE_FILES[profile];
  if (!filename) throw new Error('Unknown JezBlock profile.');

  const response = await fetch(`./${filename}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Could not load ${filename} (${response.status}).`);
  }

  const xml = await response.text();
  if (!xml.includes('<plist') || !xml.includes('PayloadType')) {
    throw new Error('The profile file did not contain a valid configuration payload.');
  }

  triggerProfileDownload(xml, filename);
}

function downloadCustomProfile(url) {
  triggerProfileDownload(profileXml(url), 'jezblock-custom.mobileconfig');
}

function updateChoiceUI() {
  const p = selectedProfile();
  document.querySelectorAll('.option').forEach(label => label.classList.remove('selected'));
  radios.find(r => r.checked)?.closest('.option')?.classList.add('selected');
  customBox.classList.toggle('hidden', p !== 'custom');
  installBtn.textContent = p === 'custom'
    ? 'Download Custom profile'
    : `Download ${PROFILE_NAMES[p]} profile`;
  localStorage.setItem('jezblock_profile_choice', p);
}

radios.forEach(r => r.addEventListener('change', updateChoiceUI));

installBtn.addEventListener('click', async () => {
  const p = selectedProfile();
  const oldText = installBtn.textContent;

  if (p === 'custom') {
    const url = customUrl.value.trim();
    if (!/^https:\/\/.+/i.test(url)) {
      alert('Enter a valid HTTPS DNS-over-HTTPS URL.');
      customUrl.focus();
      return;
    }
    localStorage.setItem('jezblock_custom_doh', url);
    downloadCustomProfile(url);
    return;
  }

  installBtn.disabled = true;
  installBtn.textContent = 'Preparing profile…';

  try {
    await downloadBundledProfile(p);
    statusTitle.textContent = 'Profile prepared';
    statusText.textContent = 'If iOS does not show “Profile Downloaded”, open the .mobileconfig from Safari Downloads, then check Settings.';
  } catch (error) {
    console.error(error);
    alert('JezBlock could not prepare the profile. Please reload the page in Safari and try again.');
  } finally {
    installBtn.disabled = false;
    installBtn.textContent = oldText;
  }
});

if (offProfileBtn) {
  offProfileBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const oldText = offProfileBtn.textContent;
    offProfileBtn.setAttribute('aria-disabled', 'true');
    offProfileBtn.textContent = 'Preparing profile…';

    try {
      await downloadBundledProfile('unfiltered');
    } catch (error) {
      console.error(error);
      alert('JezBlock could not prepare the unfiltered profile. Please reload the page in Safari and try again.');
    } finally {
      offProfileBtn.removeAttribute('aria-disabled');
      offProfileBtn.textContent = oldText;
    }
  });
}

async function testProtection() {
  testBtn.disabled = true;
  testBtn.textContent = 'Testing…';
  testResult.className = 'result';
  testResult.textContent = 'Trying to reach a known advertising endpoint…';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);
  let blocked = false;

  try {
    await fetch(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?jezblock_test=' + Date.now(),
      { mode: 'no-cors', cache: 'no-store', signal: controller.signal }
    );
    blocked = false;
  } catch (e) {
    blocked = true;
  } finally {
    clearTimeout(timer);
  }

  if (blocked) {
    testResult.className = 'result good';
    testResult.textContent = 'Protection appears active — the advertising endpoint could not be reached.';
    statusDot.className = 'status-dot good';
    statusTitle.textContent = 'Protection appears active';
    statusText.textContent = 'DNS filtering is blocking the test advertising endpoint.';
  } else {
    testResult.className = 'result bad';
    testResult.textContent = 'The test advertising endpoint was reachable. The DNS profile may not be installed/active, or this test may be inconclusive.';
    statusDot.className = 'status-dot bad';
    statusTitle.textContent = 'Protection not detected';
    statusText.textContent = 'Install the profile, then test again. Some networks/apps can also bypass system DNS.';
  }

  testBtn.disabled = false;
  testBtn.textContent = 'Test current protection';
}

testBtn.addEventListener('click', testProtection);

const savedChoice = localStorage.getItem('jezblock_profile_choice');
if (savedChoice && PROFILE_NAMES[savedChoice]) {
  const r = radios.find(x => x.value === savedChoice);
  if (r) r.checked = true;
}
customUrl.value = localStorage.getItem('jezblock_custom_doh') || '';
updateChoiceUI();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
