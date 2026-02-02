# Content Contract for MDX Git-CMS

## Purpose
This document defines the strict schema and rules for all MDX content in the `content/` directory. **Violations will cause build failures**.

---

## Frontmatter Schema

### Required Fields (All Content)
```yaml
title: "Page or Article Title"           # String, non-empty
description: "SEO-friendly description"   # String, non-empty
slug: "url-safe-slug"                     # String, matches filename rules
locale: "en" | "th"                       # MUST be "en" or "th"
status: "draft" | "review" | "published"  # MUST be one of these three
updatedAt: "2026-02-02T15:00:00+07:00"   # ISO 8601 timestamp
```

### Conditional Fields
```yaml
publishedAt: "2026-02-02T15:00:00+07:00" # REQUIRED if status="published"
```

### Optional Fields
```yaml
ogImage: "/images/og-image.jpg"          # For SEO (pages/articles)
tags: ["tag1", "tag2"]                   # Array of strings (articles only)
```

---

## File Naming Rules

### Pages
**Format**: `content/pages/{locale}/{slug}.mdx`

**Rule**: Filename MUST exactly match `slug` field.

**Examples**:
- ✅ `content/pages/en/trust-home.mdx` → `slug: "trust-home"`
- ❌ `content/pages/en/home.mdx` → `slug: "trust-home"` (mismatch!)

### Articles
**Format**: `content/articles/{locale}/{YYYY-MM-DD}-{slug}.mdx`

**Rule**: Filename MUST end with `-{slug}.mdx` where `slug` matches frontmatter.

**Examples**:
- ✅ `content/articles/en/2026-02-02-platform-launch.mdx` → `slug: "platform-launch"`
- ❌ `content/articles/en/2026-02-02-launch.mdx` → `slug: "platform-launch"` (mismatch!)

---

## Status Workflow

### Draft
- **Who Can Set**: Editors, Content AI
- **When**: Creating new content
- **Visibility**: Dev only, NOT in production or sitemap
- **Requirements**: None

### Review
- **Who Can Set**: Editors (requesting review)
- **When**: Content ready for review
- **Visibility**: Dev only, NOT in production or sitemap
- **Requirements**: None

### Published
- **Who Can Set**: Admins, Reviewers (with authority)
- **When**: Content approved and ready to go live
- **Visibility**: All modes, included in sitemap
- **Requirements**: **MUST have `publishedAt` field** (ISO timestamp)

**Critical Rule**: You CANNOT set `status: "published"` without adding `publishedAt`.

---

## Locale Rules

### Required Locales
- `en` (English)
- `th` (Thai)

### i18n Parity (Best Practice)
For **important pages** (e.g., trust-home, trust-governance), create both `en` and `th` versions with matching slugs.

**Example**:
```
content/pages/en/trust-home.mdx  (slug: trust-home)
content/pages/th/trust-home.mdx  (slug: trust-home)
```

For articles, i18n parity is optional but recommended.

---

## Slug Rules

### Format
- Lowercase letters (`a-z`)
- Numbers (`0-9`)
- Hyphens (`-`)
- **NO spaces, underscores, or special characters**

### Uniqueness
**Within the same locale and content type** (pages/articles), slugs MUST be unique.

**Examples**:
- ✅ `en/trust-home.mdx` + `th/trust-home.mdx` (OK, different locales)
- ✅ `pages/en/about.mdx` + `articles/en/about.mdx` (OK, different types)
- ❌ `pages/en/about.mdx` + `pages/en/about-us.mdx` where both have `slug: "about"` (DUPLICATE!)

---

## Security Rules

### ❌ NEVER Include:
- API keys
- Secrets
- Passwords
- Private tokens
- Internal URLs with credentials

### ✅ Safe to Include:
- Public documentation
- Marketing copy
- Blog posts
- Public announcements

If you need to reference internal systems, use **public URLs only**.

---

## How to Add New Content (5 Steps)

### Step 1: Choose Type and Locale
- **Page**: Persistent content (e.g., governance, about)
- **Article**: Time-sensitive content (e.g., news, announcements)
- **Locale**: `en` or `th`

### Step 2: Create File
```bash
# Pages
touch content/pages/en/my-page.mdx

# Articles (with date prefix)
touch content/articles/en/2026-02-02-my-article.mdx
```

### Step 3: Add Frontmatter
```yaml
---
title: "My Page Title"
description: "Brief description for SEO"
slug: "my-page"  # MUST match filename!
locale: "en"
status: "draft"
updatedAt: "2026-02-02T15:00:00+07:00"
---
```

### Step 4: Write Content (Markdown)
```markdown
# My Page Title

Your content here...
```

### Step 5: Validate Before Commit
```bash
npm run content:check  # MUST pass!
```

---

## Publish Workflow

### From Draft to Published

1. **Create** (Editor):
   ```yaml
   status: "draft"
   ```

2. **Request Review** (Editor):
   ```yaml
   status: "review"
   ```

3. **Publish** (Admin/Reviewer):
   ```yaml
   status: "published"
   publishedAt: "2026-02-02T16:00:00+07:00"  # ← ADD THIS!
   ```

4. **Commit**:
   ```bash
   git add content/
   git commit -m "publish: my-page"
   git push
   ```

5. **Deploy**:
   - Trigger build (CI/CD or manual `npm run build`)
   - Content goes live!

---

## Validation Errors (Common Issues)

### Error: Missing required field
```
Missing required field: publishedAt
```
**Fix**: Add `publishedAt` to frontmatter (if status is `published`).

### Error: Slug does not match filename
```
Slug "my-page" does not match filename "my-other-page"
```
**Fix**: Rename file OR change slug to match.

### Error: Invalid status
```
Invalid status: "pending". Must be "draft", "review", or "published"
```
**Fix**: Use only allowed status values.

### Error: Duplicate slug
```
Duplicate slug "about" found in files: pages/en/about.mdx, pages/en/about-us.mdx
```
**Fix**: Change one of the slugs to be unique.

---

## Enforcement

### Pre-build Hook
Every build runs `npm run content:check` automatically via `prebuild` script.

**If validation fails**:
- Build stops with exit code 1
- Errors displayed in console
- Fix errors and retry

### Manual Check
```bash
npm run content:check
```

Run this before committing to catch issues early!

---

## Next Steps After Adding Content

### New Page
1. Content auto-included in sitemap
2. Accessible at `/{locale}/{path}`
3. SEO metadata auto-generated

### New Article
1. Content auto-included in sitemap
2. Listed at `/{locale}/trust/news`
3. Detail at `/{locale}/trust/news/{slug}`

No code changes needed! Just create MDX file with valid frontmatter.

---

## Questions?

See full workflow documentation: [`docs/content-workflow.md`](./content-workflow.md)

For technical details: Contact the platform team.
