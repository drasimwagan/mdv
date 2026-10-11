# Security Policy

## Supported versions

MDV is pre-1.0. Security fixes are released only for the latest minor version.

| Package | Supported |
|---|---|
| `@mdv/core` / `@mdv/cli` 0.2.x | ✅ |
| MDV VS Code extension (latest Marketplace release) | ✅ |
| Anything older | ❌ Upgrade to the latest release |

## Reporting a vulnerability

**Please do not open a public issue, discussion, or pull request for a security problem.**

Report it privately through GitHub's private vulnerability reporting:

**→ [Report a vulnerability](https://github.com/drasimwagan/mdv/security/advisories/new)** (Security tab → *Report a vulnerability*)

Please include:

- the affected package and version (`mdv version`), plus your OS and Node version
- a minimal `.mdv` file, data file, or command that reproduces the problem
- the impact you observed (for example, file read outside the document folder, script execution in exported HTML, or a hang or crash)

### What to expect

- **Acknowledgement** within 5 business days.
- An **initial assessment** (accepted or declined, with a severity estimate using CVSS) within 10 business days.
- Ongoing updates in the private advisory until the issue is fixed.
- A **coordinated release**: the fix ships in a patch release, then the GitHub Security Advisory is published (with a CVE where appropriate). Reporters are credited unless they ask not to be.

Please give us a reasonable window, normally up to 90 days, to release a fix before you disclose publicly.

## Scope

MDV renders documents that may come from untrusted sources, so these are in scope:

- **HTML/script injection** in rendered or exported output: raw HTML, attribute values, chart labels, tooltips, and table cells.
- **CSS breakout** through named-style values in front-matter.
- **Path traversal**: dataset references, or the `preview` / `export` servers, reading files outside the document's directory.
- **Denial of service** from crafted input, such as regular-expression backtracking (ReDoS) or unbounded memory or CPU use while parsing.
- **The preview server** being reachable beyond `127.0.0.1`, or serving files it shouldn't.
- **VS Code extension webview** issues, such as script execution or reaching local resources.
- **Supply chain**: compromised or vulnerable dependencies we ship, and our GitHub Actions workflows.

Out of scope:

- Vulnerabilities in Chromium, which puppeteer downloads. Report those upstream.
- Issues that require an attacker to already control the machine or the author's account.
- Missing security headers on the static GitHub Pages site.

## How this repository is protected

- **CodeQL** code scanning (the `security-extended` suite) runs on every pull request, on every push to `dev` and `main`, and weekly. New high-severity alerts block merging.
- **Dependency review** blocks pull requests that introduce a dependency with a known vulnerability (moderate severity or above) or an incompatible license.
- **Dependabot** alerts and automatic security-update pull requests run for npm and GitHub Actions.
- **Secret scanning with push protection** blocks commits that contain credentials before they reach GitHub.
- **Branch rulesets**: `dev` and `main` accept changes only through pull requests with passing checks.

See [CONTRIBUTING.md](CONTRIBUTING.md#security-checks-on-pull-requests) for how contributors handle each of these checks.
