# Publishing the VS Code extension

Step-by-step to get `mdv-vscode` onto the VS Code Marketplace.

## Prerequisites (one-time)

### 1. Create a Publisher on the Marketplace

1. Sign in with a Microsoft account at <https://marketplace.visualstudio.com/manage>.
2. Click **Create publisher**.
3. Use `drasimwagan` as the **Publisher ID** (must match `publisher` in `packages/mdv-vscode/package.json`). Display name can be anything.
4. Fill in website and contact email.

### 2. Get a Personal Access Token (PAT) from Azure DevOps

Marketplace auth goes through Azure DevOps.

1. Sign in at <https://dev.azure.com> with the **same** Microsoft account you used for the publisher.
2. If prompted, create an organization (any name, default settings).
3. Click your avatar (top-right) → **User Settings** → **Personal access tokens** → **New Token**.
4. Set:
   - **Name**: `vsce-publish-mdv`
   - **Organization**: **All accessible organizations** (critical)
   - **Expiration**: up to you (1 year is typical)
   - **Scopes**: **Custom defined** → under **Marketplace**, check **Manage**
5. Click **Create** and copy the token immediately (Azure won't show it again).

### 3. Log in with `vsce` locally

```bash
cd packages/mdv-vscode
npx vsce login drasimwagan
# paste the PAT when prompted
```

The token is cached under `~/.vsce`. You only do this once per machine.

## Build and publish

### Build a `.vsix`

```bash
cd packages/mdv-vscode
npm run build                       # typechecks + bundles via esbuild
npm run package                     # writes mdv-vscode-<version>.vsix
```

### Install locally to smoke-test

```bash
code --install-extension mdv-vscode-0.1.0.vsix
```

Open any `.mdv` file and press **Ctrl+Shift+V** — make sure the preview works.

### Publish to the Marketplace

```bash
npm run publish                     # vsce publish — uploads the current version
# or publish a version bump in one shot:
npx vsce publish patch              # 0.1.0 → 0.1.1
npx vsce publish minor              # 0.1.0 → 0.2.0
npx vsce publish major              # 0.1.0 → 1.0.0
```

Within a few minutes your extension is live at:

<https://marketplace.visualstudio.com/items?itemName=drasimwagan.mdv-vscode>

## Versioning rules

- Bump `version` in `packages/mdv-vscode/package.json`.
- Update `CHANGELOG.md` for every release.
- The Marketplace rejects uploading the same version twice — always bump before re-publishing.

## Pre-flight checklist

Before `vsce publish`, confirm:

- [ ] `publisher` field matches the publisher you registered (`drasimwagan`).
- [ ] `version` bumped and `CHANGELOG.md` updated.
- [ ] `README.md` in the extension folder is current — it becomes the Marketplace listing page.
- [ ] `icon.png` exists and is at least 128×128.
- [ ] `npm run build` produces a clean `dist/extension.js`.
- [ ] `npm run package` prints **no warnings** (or only the "file is large" warning — that's fine).
- [ ] Locally installing the `.vsix` and opening an `.mdv` file works.

## Automated publish via GitHub Actions (optional)

Add the `VSCE_PAT` secret to the repo, then use this workflow:

```yaml
# .github/workflows/publish-vscode.yml
name: Publish VS Code Extension

on:
  push:
    tags: ["v*"]
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
        env:
          PUPPETEER_SKIP_DOWNLOAD: "true"
      - run: npm run build --workspace @mdv/core
      - run: npm run build --workspace mdv-vscode
      - name: Publish
        working-directory: packages/mdv-vscode
        run: npx vsce publish --no-dependencies -p $VSCE_PAT
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

Tag a release and push to trigger:

```bash
git tag v0.1.0
git push --tags
```

## Troubleshooting

| Issue | Fix |
|---|---|
| `ERROR Missing publisher name` | The `publisher` field is missing in `package.json`. |
| `ERROR The publisher 'X' doesn't exist` | Register the publisher at <https://marketplace.visualstudio.com/manage> first. |
| `ERROR Access Denied` on publish | PAT scope is wrong. It must be **Marketplace: Manage** for **All accessible organizations**. |
| `ERROR invalid relative path` during package | Means vsce is traversing outside the extension folder. Ensure you run with `--no-dependencies` (esbuild already bundles everything). |
| Extension installs but commands don't appear | Reload the window (**Ctrl+R**) or check the Extension Host logs. |
| Icon isn't square | Must be at least 128×128. Regenerate via `node assets/build-icon.mjs`. |

## What's in the published bundle?

Only 10 files, 85 KB total:

```
extension/
├── dist/extension.js        (bundled core + extension host code)
├── package.json             (metadata, commands, language registration)
├── language-configuration.json
├── syntaxes/mdv.tmLanguage.json
├── assets/icon.png
├── readme.md
├── changelog.md
└── LICENSE.txt
```

Run `npx vsce ls` inside `packages/mdv-vscode/` to confirm.
