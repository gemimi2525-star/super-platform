# Vercel Build Isolation — Runbook

## Architecture

Single Next.js app at root with **3 Vercel projects** sharing the same codebase via domain routing:

| Vercel Project | Domain | Purpose |
|:---|:---|:---|
| apicoredata-core-os | www.apicoredata.com | Core OS platform |
| synapsegovernance | synapsegovernance.com | Governance portal |
| synapsegovernance-trust | trust domain | Trust Center |

## How It Works

Each project uses **Ignored Build Step** → `scripts/vercel/should-build.sh` with project-specific path scopes.

- Exit 0 = **SKIP** (no relevant changes)
- Exit 1 = **BUILD** (changes detected)

## Scope Map

### core-os
```
app/os  app/system  app/core  app/ops  coreos  components/os-shell  worker  scripts
```

### governance + trust (shared scope)
```
app/[locale]  app/api/trust  packages/synapse  packages/synapse-web  vendor/synapse-core  governance
```

### Always-build (triggers ALL projects)
```
package.json  package-lock.json  next.config.ts  tsconfig.json
middleware.ts  vercel.json  eslint.config.mjs  postcss.config.mjs  jest.config.js
public/  lib/  styles/
```

## Expected Behavior

| Change Location | core-os | governance | trust |
|:---|:---:|:---:|:---:|
| `coreos/**` | BUILD | skip | skip |
| `governance/**` | skip | BUILD | BUILD |
| `app/api/trust/**` | skip | BUILD | BUILD |
| `package.json` | BUILD | BUILD | BUILD |
| `middleware.ts` | BUILD | BUILD | BUILD |
| `lib/**` | BUILD | BUILD | BUILD |

## Test Plan (Negative Tests)

1. **Always-build file** → all 3 projects must BUILD
   ```bash
   # Local: should exit 1 for ALL scopes
   echo "// test" >> middleware.ts
   git add middleware.ts && git commit -m "test"
   scripts/vercel/should-build.sh app/os  # expect exit=1
   scripts/vercel/should-build.sh governance  # expect exit=1
   git reset --hard HEAD^
   ```

2. **Core-os scope only** → core-os BUILD, gov+trust SKIP
   ```bash
   echo "// test" >> coreos/calm-detector.ts
   git add -A && git commit -m "test"
   scripts/vercel/should-build.sh app/os coreos  # expect exit=1
   scripts/vercel/should-build.sh governance  # expect exit=0
   git reset --hard HEAD^
   ```

3. **Governance scope only** → gov+trust BUILD, core-os SKIP
   ```bash
   echo "test" >> governance/guard-proof.txt
   git add -A && git commit -m "test"
   scripts/vercel/should-build.sh governance  # expect exit=1
   scripts/vercel/should-build.sh app/os coreos  # expect exit=0
   git reset --hard HEAD^
   ```

## Guard Script Location

`scripts/vercel/should-build.sh`

## Troubleshooting

- **All builds skipped**: Check that guard script exists and is executable (`chmod +x`)
- **All builds triggered**: A shared file (package.json, middleware.ts, etc.) was changed
- **Wrong project built**: Check scope paths match the Vercel project settings
