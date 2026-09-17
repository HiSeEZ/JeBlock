# JezBlock V0.1.1

A no-Mac, no-Xcode proof-of-concept for system-wide iPhone ad/tracker blocking using an installable PWA as the control panel and an iOS encrypted DNS configuration profile as the actual filtering layer.

## What works

- Installable PWA on iPhone.
- Standard profile: AdGuard Public DNS (`https://dns.adguard-dns.com/dns-query`).
- Family profile: AdGuard Family DNS.
- Custom DNS-over-HTTPS profile generator.
- Basic "is a known ad endpoint reachable?" protection test.
- Offline PWA shell.
- No user account and no analytics in the PWA.

## What does NOT work

- The PWA cannot directly enable/disable an installed iOS DNS profile.
- The PWA cannot see all DNS queries or exact block counts.
- DNS filtering cannot block ads that share the same hostname as wanted content.
- Some apps can use their own DNS/VPN/network stack and may bypass system DNS.
- This is not a packet-tunnel VPN.

## Deploy to GitHub Pages

1. Create a GitHub repository, e.g. `jezblock`.
2. Upload all files in this folder to the repository root.
3. In GitHub: Settings -> Pages.
4. Set "Deploy from a branch".
5. Select `main` and `/ (root)`.
6. Open the generated HTTPS GitHub Pages URL on the iPhone.
7. Safari -> Share -> Add to Home Screen.

## Install the DNS profile

From the JezBlock PWA:

1. Choose Standard or Family.
2. Tap "Download ... profile" in Safari. JezBlock rebuilds the profile locally with Apple's configuration-profile MIME type so GitHub Pages does not display the XML as text.
3. If Safari saves the file to Downloads, tap the `.mobileconfig` once. Then go to iPhone Settings -> Profile Downloaded -> Install.
4. If that banner is not visible: Settings -> General -> VPN & Device Management.
5. Return to JezBlock and tap "Test current protection".

To remove:
Settings -> General -> VPN & Device Management -> JezBlock -> Remove Profile.

## Files

- `index.html` — PWA interface.
- `styles.css` — UI.
- `app.js` — profile selection, custom profile generator, test.
- `sw.js` — offline cache.
- `manifest.webmanifest` — installable PWA manifest.
- `jezblock-standard.mobileconfig` — Standard encrypted DNS profile.
- `jezblock-family.mobileconfig` — Family encrypted DNS profile.
- `jezblock-off.mobileconfig` — Unfiltered AdGuard DNS profile (not the same as removing the profile).
- `privacy.html` — simple privacy disclosure.

## Important security note

Do not point Custom DoH at a DNS server you do not trust. DNS operators can observe the domain names your device asks them to resolve.

## V0.2 idea

Replace the public resolver with a private per-user DoH endpoint so JezBlock can provide:
- per-device stats,
- custom allow/block lists,
- protection levels,
- server-side rule updates,
- temporary pause,
- optional account sync.

That requires a backend. The PWA alone cannot provide those network-level controls.
