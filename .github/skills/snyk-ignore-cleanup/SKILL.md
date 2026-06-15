---
name: snyk-ignore-cleanup
description: Audit the .snyk ignore list against live Snyk vulnerability data and remove entries whose affected version ranges no longer cover the installed versions in yarn.lock.
---

# snyk-ignore-cleanup

Use this skill to audit `.snyk` and remove ignore entries for vulnerabilities that have already been fixed by current dependencies.

## Purpose

Over time, vulnerabilities get patched and dependencies get upgraded. Ignore entries in `.snyk` that were added as temporary workarounds should be removed once the installed version satisfies the fix threshold. This skill automates that audit and produces a clean `.snyk`.

## When to use

Use this skill when the user asks to:

- audit or review `.snyk` ignores
- remove fixed or resolved Snyk vulnerabilities
- clean up the `.snyk` file
- check which Snyk ignores are still needed

Trigger phrases include:

- "clean up .snyk"
- "remove fixed snyk ignores"
- "which snyk vulnerabilities have been fixed?"
- "audit our snyk ignore list"

## Required workflow

### 1. Parse `.snyk`

Read `.snyk` and extract the full list of ignored vulnerability IDs and their stated reasons.

### 2. Read installed versions from `yarn.lock`

For every ignored vulnerability ID, determine the affected package by fetching `https://security.snyk.io/vuln/<ID>` (done in step 3) and reading the package name from the page title or overview. Do not maintain a hardcoded list — derive the package name dynamically for every entry found in `.snyk`.

Once the package name is known, search `yarn.lock` for all resolved versions of that package. Note all resolved versions — some packages appear multiple times under different semver ranges.

If the package is not present in `yarn.lock` at all (e.g. Alpine OS packages, packages bundled inside npm itself), do not immediately classify it as **Cannot assess** — first attempt the npm-bundled package check in step 3.

### 3. Check npm-bundled packages (where applicable)

Some vulnerabilities (e.g. `minimatch`, `tar`, `picomatch`, `brace-expansion`, `pacote`) are flagged not against the app's own dependencies but against the copy of that package that npm ships internally. These do not appear in `yarn.lock`. To determine whether such an entry can be removed, trace the npm version that ships with the project's Docker image:

1. **Read the Dockerfile** — find the `FROM` line (e.g. `FROM node:25-alpine`) to determine the Node.js major version.
2. **Check the Node.js changelog** — fetch `https://github.com/nodejs/node/blob/v<major>.x/doc/changelogs/CHANGELOG_V<major>.md` and search for `upgrade npm to` entries to find the npm version shipped with the latest release of that Node major (e.g. Node 25.9.0 → npm 11.12.1).
3. **Check npm's bundled deps** — fetch `https://github.com/npm/cli/blob/v<npm-version>/package-lock.json` and search for the vulnerable package name to find its exact bundled version (look for `"inBundle": true` entries).
4. **Compare against the fix threshold** — if the bundled version is ≥ the fix threshold, the entry can be removed. If it is still in the vulnerable range, keep the entry.

If the Dockerfile uses a Node version that is no longer receiving releases (EOL), use the final release of that major to determine the npm version.

If the npm `package-lock.json` page is not reachable, classify the entry as **Cannot assess**.

### 4. Fetch fix thresholds from Snyk

For each ignored ID, fetch `https://security.snyk.io/vuln/<ID>` and extract:

- **Affected versions** (the vulnerable range)
- **Fix version** (the minimum safe version from the "How to fix?" section)

### 5. Classify each entry

For each ignore entry, determine:

- **Fixed**: every resolved version in `yarn.lock` is ≥ the fix threshold → safe to remove.
- **Partially fixed**: some resolved versions are fixed, others are not → keep with updated reason.
- **Still open**: all resolved versions remain in the vulnerable range → keep as-is.
- **Cannot assess** (e.g. Alpine OS packages, npm-bundled packages not in `yarn.lock`) → keep as-is, note the blocker.

An entry is only classified as **Fixed** if **all** resolved versions of that package (whether in `yarn.lock` or bundled in npm) satisfy the fix threshold. If any copy of the package is still in the vulnerable range, the entry must be kept.

### 6. Report findings

Present a summary table before making any changes:

| ID            | Package | Fix threshold | Installed version(s) | Status   |
| ------------- | ------- | ------------- | -------------------- | -------- |
| `SNYK-JS-...` | `qs`    | `>= 6.14.2`   | `6.15.1`             | ✅ Fixed |
| ...           | ...     | ...           | ...                  | ...      |

### 7. Apply changes

Remove only the entries classified as **Fixed**. Do not modify entries that are still open, partially fixed, or cannot be assessed.

Edit `.snyk` directly. Preserve the `version: v1.5.0` header and all remaining entries exactly as they appear — including whitespace and comments.

### 8. Verify

After editing, re-read `.snyk` and confirm:

- The removed entries are gone.
- All remaining entries are intact and valid YAML.
- The `version:` header is unchanged.

## Guardrails

- Never remove an entry unless the installed version is confirmed to be ≥ the fix threshold.
- Never remove entries for Alpine/OS-level CVEs — these cannot be verified from `yarn.lock`.
- For npm-bundled packages (minimatch, tar, picomatch, pacote, brace-expansion), always use the npm-bundled check in step 3 before classifying. Do not rely solely on `yarn.lock` — even if `yarn.lock` resolves a fixed version, the npm-bundled copy may still be vulnerable. Only remove these entries once the bundled version in the project's npm has been confirmed to be ≥ the fix threshold.
- If the Snyk page is unreachable for a given ID, skip that entry and note it in the report.
- Do not alter the `.snyk` structure, indentation, or YAML format beyond removing resolved blocks.
- Default operating mode is `guided` — present the findings table and wait for confirmation before editing the file, unless the user explicitly says to apply.
