# Local vs Production UI Parity Runbook

## Purpose
Compare local development OS and production OS from a **clean state**
to verify they render identically (same dock, topbar, layout).

## Quick Reset

### Local
```
http://localhost:3000/os?reset=1
```
This clears all `apicoredata:coreos:*` keys from localStorage,
unregisters service workers, and redirects to `/os`.

### Production
Open in **Incognito/Private window**:
```
https://www.apicoredata.com/os
```
Or use the same reset param:
```
https://www.apicoredata.com/os?reset=1
```

## Step-by-Step Comparison

1. **Local**: Open `http://localhost:3000/os?reset=1`
2. **Production**: Open `https://www.apicoredata.com/os` in Incognito
3. Login with the same user on both
4. **Check Dock**: Default icons should be identical (same manifests)
5. **Check TopBar**: Should show same default app name (e.g. "Finder")
6. **Open System Hub** on both → layout should match

## Hard Refresh + Clear SW (Manual)

If `?reset=1` isn't enough:

1. **Chrome DevTools** → Application tab
2. Service Workers → "Unregister" all
3. Storage → "Clear site data" for the domain
4. Hard refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Win)

## Integrity API Check

```bash
# Local
curl -s http://localhost:3000/api/platform/integrity | jq .

# Production
curl -s https://www.apicoredata.com/api/platform/integrity | jq .
```

Both should report matching `build.sha`, `version`, and `phase`.
