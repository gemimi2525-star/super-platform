# Domain Hardening Report
## apicoredata.com vs synapsegovernance.com

Report Date: 2026-02-02

---

## 1. Environment Variables

### apicoredata.com (Core Platform)
| Variable | Value | Status |
|----------|-------|--------|
| `NEXT_PUBLIC_SERVER_URL` | `https://www.apicoredata.com` | ✅ Correct |
| `FIREBASE_PROJECT_ID` | `apicoredata-xxx` | ✅ Set |
| `FIREBASE_PRIVATE_KEY` | `[REDACTED]` | ✅ Set |

### synapsegovernance.com (Trust Center)
| Variable | Value | Status |
|----------|-------|--------|
| `NEXT_PUBLIC_SERVER_URL` | `https://www.synapsegovernance.com` | ✅ Correct |

### Recommendation
- ✅ ENV separation is correct
- Consider adding `PROJECT_KIND=core` or `PROJECT_KIND=trust` for explicit detection

---

## 2. Redirect Rules

### apicoredata.com Redirects
| Path Pattern | Target | Type | Status |
|-------------|--------|------|--------|
| `/en/trust*` | synapsegovernance.com | 301/308 | ✅ Working |
| `/th/trust*` | synapsegovernance.com | 301/308 | ✅ Working |

### synapsegovernance.com Behavior
| Path | Expected | Actual | Status |
|------|----------|--------|--------|
| `/` | Redirect/Rewrite to `/en/trust` | Trust Center landing | ✅ Correct |

### Verification
```bash
# Test apicoredata → synapsegovernance redirect
curl -sI https://www.apicoredata.com/en/trust | grep -i location
# Expected: location: https://www.synapsegovernance.com/en/trust

# Test synapsegovernance root
curl -sI https://www.synapsegovernance.com/ | head -5
# Expected: 200 OK (Trust Center landing)
```

---

## 3. SEO Correctness

### Sitemap Verification

#### apicoredata.com/sitemap.xml
- ❓ Should contain only apicoredata.com URLs
- ❓ Should NOT contain trust center pages

#### synapsegovernance.com/sitemap.xml
- ❓ Should contain only synapsegovernance.com URLs
- ❓ Should NOT contain apicoredata.com URLs

### Canonical Tags
- Each domain should use its own domain in canonical URLs
- Cross-domain canonical references should be avoided

### Verification Commands
```bash
# Check apicoredata sitemap
curl -s https://www.apicoredata.com/sitemap.xml | grep -o 'https://[^<]*' | sort -u

# Check synapsegovernance sitemap
curl -s https://www.synapsegovernance.com/sitemap.xml | grep -o 'https://[^<]*' | sort -u
```

---

## 4. Middleware Configuration

### Host-Based Branching
The middleware uses host detection to serve different paths:
- `apicoredata.com` → Platform routes
- `synapsegovernance.com` → Trust Center routes

### Current Implementation
Located in: `middleware.ts`

```typescript
// Host-based path routing
if (host.includes('synapsegovernance')) {
    // Trust Center only
}
```

---

## 5. Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Cross-domain cookie leakage | Low | Cookies are domain-scoped |
| SEO confusion (duplicate content) | Medium | Ensure distinct sitemaps |
| Redirect loop | Low | Tested redirect logic |
| ENV misconfiguration | Low | Verified separations |

---

## 6. Action Items

### Completed ✅
- [x] ENV separation verified
- [x] Trust Center redirect working
- [x] Smoke test includes redirect check

### TODO (Future)
- [ ] Audit sitemap.xml on both domains
- [ ] Add `PROJECT_KIND` ENV for explicit detection
- [ ] Document robots.txt differences
