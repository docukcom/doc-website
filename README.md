<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/docukcom/brand-assets/main/logo-on-dark.svg">
    <img alt="DOC" src="https://raw.githubusercontent.com/docukcom/brand-assets/main/logo.svg" width="220">
  </picture>
</p>

# doc-website

Source of the DOC website, [doc.uk.com](https://doc.uk.com). The site is in English.

The website explains what DOC is, how the NHS right to choose works in England, how the AI in DOC is designed, and how to get in touch.

## Technology

- Static HTML, CSS and JavaScript. No framework and no build step.
- Fonts and all other files are served from the website itself.
- No cookies, no analytics, no tracking pixels and no third-party scripts.
- The contact form does not send anything. It prepares an email in the visitor's own mail app.

## Structure

```
index.html            Home
how-it-works/         How DOC works: six steps
your-rights/          The NHS right to choose, explained
technology/           How DOC uses AI, and where it stops
organisations/        For employers and clinics
investors/            For investors
about/                About DOC and the team
contact/              Contact form (opens your mail app)
privacy/              Privacy policy
terms/                Terms and legal notice
404.html              Page not found
assets/
  brand/              Logo and app icons
  css/                Styles
  fonts/              Self-hosted fonts
  img/                Photos
  js/                 Scripts
  og/                 Link preview images
favicon.ico, favicon.svg, apple-touch-icon.png, site.webmanifest
```

## View it locally

```bash
git clone https://github.com/docukcom/doc-website.git
cd doc-website
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Licence

All rights reserved. See [LICENSE](LICENSE).

The fonts in `assets/fonts` have their own licence: [Sora](https://fonts.google.com/specimen/Sora) and [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) are licensed under the SIL Open Font License 1.1.

## Contact

Found a typo, a broken link or an outdated fact? Open an issue or email [info@doc.uk.com](mailto:info@doc.uk.com).
