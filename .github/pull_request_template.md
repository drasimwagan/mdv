## What does this change?

<!-- Short description. What's different after this PR? Why is it useful? -->

## Related

<!-- Link any issue this closes, e.g. `Closes #12`. Maintainer feature work: name the roadmap phase, e.g. `Roadmap Phase 7: Chart sizing`. -->

## Target branch

<!-- Base on `dev` for everything except `hotfix/*` branches and `release: vX.Y.Z` PRs, which target `main`. See CONTRIBUTING.md. -->

- [ ] Based on `dev`, or on `main` because this is a hotfix or release PR

## Testing

<!-- How was this verified? Tick the ones that apply. -->

- [ ] `npm test` passes
- [ ] `npm run build` passes from a clean install (`npm ci`)
- [ ] Rendered every `examples/*.mdv` before and after; any output differences are intended and explained above
- [ ] CI is green

## Security

<!-- Required checks: CodeQL, Dependency review, CI. Never merge around a failing security check. See CONTRIBUTING.md#security-checks-on-pull-requests -->

- [ ] No new CodeQL alerts, or each one is fixed or dismissed by a maintainer with a written justification
- [ ] Dependency review is green; any new dependency is justified above (runtime dependencies need prior discussion)
- [ ] No secrets, tokens, or private paths in code, fixtures, or examples
- [ ] Untrusted input considered: `.mdv` content, front-matter, data files, and CLI arguments can't inject HTML/CSS, escape the document directory, or hang the parser
- [ ] This PR does **not** disclose an unfixed vulnerability (those go through SECURITY.md)

## Checklist

- [ ] Respects the Core Product Decisions in `CLAUDE.md`; any deviation is called out in the description
- [ ] Maintainer feature work only: the phase's `validation.md` checks pass and the roadmap phase is ticked
- [ ] Documentation (`docs/`) updated if behavior or surface changed, and no doc describes unbuilt behavior
- [ ] `CHANGELOG.md` `[Unreleased]` updated for user-facing changes
