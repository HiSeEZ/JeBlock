# JeBlock V0.2 Beta

JeBlock is a deliberately simple iPhone ad/tracker blocker proof-of-concept.

## V0.2 goal

One button, one profile, aggressive DNS-level blocking, almost no settings.

- Main button: **Protect this iPhone**
- Default profile: aggressive HaGeZi Ultimate filtering through Control D's public DoH endpoint.
- Compatibility profile: less aggressive HaGeZi Pro filtering.
- Unfiltered profile for troubleshooting.
- Multi-endpoint protection check.
- No graphs, no customer DNS history, no account, no PWA analytics.

## Important limitation

The V0.2 beta is intended to test how far DNS-only blocking can go. It cannot honestly guarantee 99% blocking or zero pop-ups on every site. DNS cannot safely block ads that share the same hostname as wanted content, and some apps can bypass system DNS.

## Install

Deploy the files to GitHub Pages, open the site in Safari, tap **Protect this iPhone**, open the downloaded `.mobileconfig`, then install it from Settings.

## Beta resolver notes

The Maximum profile currently points to:
`https://freedns.controld.com/x-hagezi-ultimate`

The Compatibility profile points to:
`https://freedns.controld.com/x-hagezi-pro`

These are public third-party endpoints for testing only. A commercial JeBlock release should use JeBlock-controlled infrastructure and its own domain.
