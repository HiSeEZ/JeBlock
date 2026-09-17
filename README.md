# JeBlock V0.2.3 Beta

Experimental iPhone DNS build focused on stronger system-wide ad/tracker blocking while keeping the user experience simple.

## Default profile — Maximum + Apple

`jeblock-maximum.mobileconfig` uses a RethinkDNS encrypted DNS endpoint configured with:

- OISD Big
- Apple-native advertising/tracking blocklist

The generated RethinkDNS blockstamp is `1:IAAgEA==`.

This is a beta comparison build. It does **not** promise that all Apple ads or all in-app ads will disappear, and aggressive Apple-domain blocking can potentially break individual Apple features.

## Test / fallback profiles

- `jeblock-oisd.mobileconfig` — previous Control D OISD-only profile that scored about 91–96% in our iPhone benchmark testing.
- `jeblock-compatibility.mobileconfig` — AdGuard Public DNS fallback.
- `jeblock-proplus.mobileconfig` — HaGeZi Pro++ comparison profile.
- `jeblock-off.mobileconfig` — unfiltered DNS.

Use only one DNS settings profile at a time.

## Test sequence

1. Remove the old JeBlock DNS profile.
2. Install Maximum + Apple.
3. Toggle Airplane Mode on/off once.
4. Run JeBlock's built-in protection check.
5. Run the same d3ward blocker benchmark.
6. Check Apple apps where ads were visible before (for example App Store / News / Stocks where available).
7. If anything breaks or the benchmark drops, remove Maximum + Apple and install the OISD-only fallback.

## Why this build exists

OISD-only produced the strongest DNS benchmark result so far. V0.2.3 keeps an OISD layer and adds a dedicated Apple-native list so we can measure whether it improves real iPhone in-app blocking without causing unacceptable breakage.

## Privacy

This PWA has no account and no analytics. Beta profiles use third-party public encrypted DNS resolvers. A production JeBlock service should move to JeBlock-controlled endpoints with minimal retention.
