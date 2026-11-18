# ARONTE AEGIS — Security profile

ARONTE AEGIS is a reusable static-site hardening and verification tool. It is not a firewall, antivirus, vulnerability scanner, DDoS protection service or intrusion prevention system.

## Use on any static site

Copy `aegis/aegis.mjs` into a project. Adapt the `pages` array to its HTML routes, then run:

```bash
node aegis/aegis.mjs --apply .
node aegis/aegis.mjs .
```

The first command inserts or updates a CSP meta element; the second checks that CSP hashes are current and scans for risky HTML patterns. Re-run `--apply` whenever an inline script changes. The script uses only built-in Node.js modules.

## Actual protections and boundaries

- Content Security Policy: default deny, explicit same-origin scripts, SHA-256 allowlisting for inline scripts, no external network requests through connect-src, no frames or objects, no external form submissions, upgrade insecure requests.
- No telemetry, analytics or external dependencies are added by AEGIS.
- Security tests run in CI on every push and pull request.
- CSP in an HTML meta tag is less capable than a CSP HTTP response header. It cannot enforce `frame-ancestors`, provide report-only monitoring, or protect responses that do not contain the meta tag. A host or CDN should enforce CSP via response headers and supply HSTS, X-Content-Type-Options, Referrer-Policy and Permissions-Policy.
- GitHub Pages handles TLS and infrastructure; this tool cannot configure GitHub's edge firewall, rate limits, account access, branch protection or DDoS controls. Configure repository MFA, branch protection, minimal permissions and secret scanning independently.
- `style-src 'unsafe-inline'` remains for compatibility with the current site's inline styles. Removing it requires refactoring CSS.
- This is defense in depth, not a guarantee that a site cannot be compromised.

## Release process

1. Apply AEGIS after changing HTML or inline JavaScript.
2. Run AEGIS audit and all functional tests.
3. Publish only after CI passes.
4. Periodically review repository collaborators, secrets, dependencies, and third-party scripts.

## Brand

Name: ARONTE AEGIS. Icon: `aegis/aegis.svg`. SVG can be embedded or reused in other static-site projects.
