# TC-1.2 Operations Runbook

**Version**: 1.0  
**Last Updated**: February 2, 2026  
**Audience**: Operations team, Content editors

---

## 1. Publishing Content (3 Steps)

### Step 1: Create/Edit MDX File
```bash
# Pages
content/pages/{en|th}/{slug}.mdx

# Articles (with date prefix)
content/articles/{en|th}/YYYY-MM-DD-{slug}.mdx
```

### Step 2: Update Frontmatter Status
```yaml
status: "published"           # Change from draft/review
publishedAt: "2026-02-02T16:00:00+07:00"  # ADD THIS (required!)
```

### Step 3: Commit & Deploy
```bash
git add content/
git commit -m "publish: article-name"
git push origin main
# Vercel auto-deploys (~2-3 min)
```

---

## 2. Fixing Content Validation Errors

### Error: Missing required field
**Symptom**: `Missing required field: publishedAt`  
**Fix**: Add field to frontmatter
```yaml
publishedAt: "2026-02-02T16:00:00+07:00"
```

### Error: Slug does not match filename
**Symptom**: `Slug "my-page" does not match filename "other-page"`  
**Fix**: Rename file OR change slug
```bash
# Option 1: Rename file
mv content/pages/en/other-page.mdx content/pages/en/my-page.mdx

# Option 2: Change slug in frontmatter
slug: "other-page"
```

### Error: Invalid status
**Symptom**: `Invalid status: "pending"`  
**Fix**: Use only: `draft`, `review`, or `published`

### Error: Duplicate slug
**Symptom**: `Duplicate slug "about" found`  
**Fix**: Change one slug to be unique

### Where to Look
1. **Terminal/Build logs**: Shows exact file + line
2. **Run locally**: `npm run content:check`
3. **Check docs**: `docs/content-contract.md`

---

## 3. Verifying SEO & Sitemap

### Check Sitemap
```bash
# Production
curl https://www.apicoredata.com/sitemap.xml

# Local
npm run build
curl http://localhost:3000/sitemap.xml
```

**Expected**:
- 14+ URL entries
- Alternates (en/th) present
- Only published content

### Check Page Metadata
```bash
# View source on any page
curl -s https://www.apicoredata.com/en/trust | grep -E "<title|<meta"
```

**Expected**:
- `<title>` from frontmatter
- `<meta name="description">` from frontmatter
- `<meta property="og:...">` tags
- `<link rel="alternate" hreflang=...>` tags

### Google Search Console
1. Go to: https://search.google.com/search-console
2. Select: `www.apicoredata.com`
3. Check:
   - **Sitemaps**: Status should be "Success"
   - **Pages**: No critical errors
   - **Coverage**: Indexed pages increasing

---

## 4. Quick Rollback (if needed)

### Recent Deploy Broke Something
```bash
# Find last working commit
git log --oneline | head -5

# Revert to it
git revert <commit-hash>
git push origin main

# Or hard reset (use with caution!)
git reset --hard <commit-hash>
git push -f origin main
```

**Vercel re-deploys automatically (~2-3 min)**

### Content Validation Failed Build
```bash
# Check what's wrong
npm run content:check

# Fix the errors (see Section 2)
# Then commit + push
git add content/
git commit -m "fix: content validation errors"
git push origin main
```

---

## 5. Monitoring Checklist (Daily/Weekly)

### Daily
- ✅ Check Vercel dashboard for build status
- ✅ No 404 spikes in Vercel Analytics
- ✅ Content:check passes on latest build

### Weekly
- ✅ GSC: Sitemap fetch status OK
- ✅ GSC: Pages indexed (should increase)
- ✅ GSC: No critical coverage errors
- ✅ Performance: LCP < 2.5s

---

## 6. Important Notes

### Legacy Routes (27 routes)
**Status**: ❌ Disabled intentionally  
**Why**: Emergency unblock for TC-1.2 focus  
**Plan**: Re-enable in Phase 5+ (future)

**Affected**: Platform v1 routes (`/organization/*`, `/user/*`)  
**Not Affected**: Trust Center, Platform v2, Auth

### Draft/Review Content
- **Development**: Visible for testing
- **Production**: Hidden automatically
- **Sitemap**: Excluded automatically

No manual filtering needed - handled by content loaders.

### Build Time
**Normal**: 2-3 minutes  
**If longer**: Check for:
- Large dependencies added
- Many MDX files (100+)
- Network issues

---

## 7. Common Commands

```bash
# Validate content locally
npm run content:check

# Build locally
npm run build

# Start production server
npm start

# View build logs (Vercel)
vercel logs <deployment-url>
```

---

## 8. Getting Help

### Documentation
- **Content Workflow**: `docs/content-workflow.md`
- **Content Schema**: `docs/content-contract.md`
- **Release Notes**: `tc12_release_notes.md`

### Support Channels
- **Build Failures**: Check Vercel logs
- **Content Errors**: See docs/content-contract.md
- **Indexing Issues**: Google Search Console help

### Emergency Contact
- Platform team lead
- DevOps on-call

---

**Last Review**: Feb 2, 2026  
**Next Review**: After first content publish cycle
