# JeBlock V0.2.2 Beta

Benchmark build focused on the DNS layer.

## Default profile

`jeblock-maximum.mobileconfig` uses Control D's public OISD Full DoH endpoint:
`https://freedns.controld.com/x-oisd`

## Test profiles

- `jeblock-compatibility.mobileconfig` — AdGuard Public DNS (known-good fallback from V0.1 testing).
- `jeblock-proplus.mobileconfig` — HaGeZi Pro++ through Control D, for comparison only.
- `jeblock-off.mobileconfig` — unfiltered Control D DNS.

Use only one DNS settings profile at a time. Remove the current JeBlock test profile before switching.

## Test sequence

1. Remove the old JeBlock/JezBlock DNS profile.
2. Open JeBlock in Safari and install Maximum.
3. Toggle Airplane Mode on/off once after installation.
4. Run JeBlock's built-in check.
5. Run the same external blocker benchmark used before and record the result.
6. If Maximum is weak, repeat with AdGuard and then Pro++ so we can compare on the same iPhone/network.

## Important limitation

This PWA only configures the DNS layer. DNS cannot remove every popup/cosmetic element or same-domain ad. A Safari content-blocker extension is a separate native extension layer and cannot be installed by this PWA.

## Privacy

This PWA has no account and no analytics. The public DNS provider processes DNS queries according to its own privacy policy. These public profiles are for beta testing; a production JeBlock service should use JeBlock-controlled endpoints.


## V0.2.2
- Reworked the on-device protection check for Safari reliability.
- Added a hard timeout so the Check protection button can never remain stuck.
- Kept OISD Full as the Maximum profile after the 96% d3ward result.
