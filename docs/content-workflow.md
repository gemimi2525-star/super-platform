# Content Management Workflow (Git-based CMS)

## Overview

SYNAPSE Trust Center uses a Git-based content management system powered by MDX files. Content lifecycle follows a **draft → review → published** workflow.

---

## File Structure

content/
├── pages/
│   ├── en/
│   │   └── {slug}.mdx
│   └── th/
│       └── {slug}.mdx
└── articles/
    ├── en/
    │   └── {YYYY-MM-DD}-{slug}.mdx
    └── th/
        └── {YYYY-MM-DD}-{slug}.mdx


---

## Naming Conventions

### Pages
- **Filename**: `{slug}.mdx`
- **Example**: `trust-home.mdx`, `trust-governance.mdx`
- **slug in frontmatter must match filename**

### Articles
- **Filename**: `{YYYY-MM-DD}-{slug}.mdx`
- **Example**: `2026-02-02-platform-launch.mdx`
- **Date prefix for chronological sorting**
- **slug in frontmatter is WITHOUT the date** (just `platform-launch`)

---

## Frontmatter Schema

### Required Fields (All Content)
```yaml
---
title: "Page/Article Title"
description: "SEO-friendly description"
slug: "url-slug"
locale: "en" # or "th"
status: "draft" # or "review" or "published"
updatedAt: "2026-02-02T15:00:00+07:00"
publishedAt: "2026-02-02T15:00:00+07:00" # optional, set when published
---
```

### Optional Fields

#### For All Content
- `ogImage`: OpenGraph image path (e.g., `/images/og-trust.jpg`)

#### For Articles Only
- `tags`: Array of tags (e.g., `["announcement", "governance"]`)

---

## Status Workflow

### Draft
- **Who**: Editors, Content AI
- **Action**: Create or update content
- **Visibility**: 
  - ✅ Visible in development mode
  - ❌ Hidden in production
  - ❌ Not in sitemap

### Review
- **Who**: Reviewers
- **Action**: Review draft content, request changes, or approve
- **Visibility**:
  - ✅ Visible in development mode
  - ❌ Hidden in production
  - ❌ Not in sitemap

### Published
- **Who**: Admins, Reviewers (with approval authority)
- **Action**: Set `status: published` + add `publishedAt` timestamp
- **Visibility**:
  - ✅ Visible in all modes
  - ✅ Listed publicly
  - ✅ Included in sitemap

---

## Role Permissions

### Admin
- Full access to all content
- Can create, edit, review, and publish
- Can change status from any status to any other status

### Reviewer
- Can view drafts and review content
- Can approve changes (set to `review`)
- Can publish content (set `status: published` + `publishedAt`)
- **Cannot** create new content

### Editor
- Can create and edit drafts
- Can update own content
- Can request review (set `status: review`)
- **Cannot** publish directly

### Content AI
- Can create draft content only
- **Cannot** review or publish

---

## Workflow Steps

### Step 1: Create Draft (Editor/AI)

1. Create new MDX file in correct location:
   - Pages: `content/pages/{locale}/{slug}.mdx`
   - Articles: `content/articles/{locale}/{YYYY-MM-DD}-{slug}.mdx`

2. Add frontmatter with `status: draft`

3. Write content in Markdown

4. Git commit: `git add content/ && git commit -m "draft: {title}"`

### Step 2: Request Review (Editor)

1. Update `status: review` in frontmatter

2. Git commit: `git commit -am "review: {title} ready for review"`

3. Notify reviewer (via Git PR, email, or platform notification)

### Step 3: Review (Reviewer)

1. Read content in development mode

2. If changes needed:
   - Leave comments in Git PR or document
   - Editor makes changes
   - Repeat Step 2

3. If approved:
   - Proceed to Step 4

### Step 4: Publish (Admin/Reviewer)

1. Update frontmatter:
   ```yaml
   status: "published"
   publishedAt: "2026-02-02T15:00:00+07:00" # current timestamp
   ```

2. Git commit: `git commit -am "publish: {title}"`

3. Content is now live on production!

---

## Content Updates

### Minor Edits (typos, formatting)
- Edit directly
- Update `updatedAt`
- No status change needed if already published

### Major Content Changes
- **Best practice**: Return to `draft` or `review`
- Update content
- Follow workflow again

---

## Development vs Production

### Development Mode (`NODE_ENV=development`)
- Shows ALL content (draft, review, published)
- Useful for preview and testing
- ⚠️ Does NOT reflect public visibility

### Production Mode (`NODE_ENV=production`)
- Shows ONLY `status: published` content
- Sitemap includes only published
- This is what users see!

---

## Testing Content

### Local Preview
```bash
npm run dev
# Visit: http://localhost:3000/{locale}/trust/news/{slug}
```

### Build Test
```bash
npm run build
# Ensures all content compiles correctly
```

### Check Sitemap
```bash
npm run build
# Visit: http://localhost:3000/sitemap.xml
# Verify only published content appears
```

---

## Best Practices

### ✅ DO
- Use descriptive slugs (`platform-launch` not `post1`)
- Keep frontmatter accurate (especially dates)
- Commit frequently with clear messages
- Test in development before publishing
- Use `updatedAt` when editing existing content

### ❌ DON'T
- Skip frontmatter fields
- Use special characters in slugs (stick to `a-z0-9-`)
- Forget to set `publishedAt` when publishing
- Publish without review (unless you're admin and confident)
- Delete content without archiving (use `status: draft` to hide instead)

---

## Future Improvements (Optional)

### Admin UI (Phase 3)
- Web-based MDX editor
- Visual frontmatter editor
- Preview mode
- One-click publish

### Advanced Features
- Scheduled publishing (`publishedAt` in future)
- Content versioning (Git already provides this!)
- Multi-author attribution
- Category hierarchies

---

## Examples

### Example: New Article

**File**: `content/articles/en/2026-02-05-new-feature.mdx`

```mdx
---
title: "Introducing Multi-Factor Approval"
description: "Enhanced security with multi-party approval for critical decisions"
slug: "new-feature-mfa"
locale: "en"
status: "draft"
updatedAt: "2026-02-05T10:00:00+07:00"
tags: ["features", "security"]
---

# Introducing Multi-Factor Approval

We're excited to announce a new security feature...

[content here]
```

**Workflow**:
1. Editor creates file, commits as draft
2. Editor requests review: changes `status: review`
3. Reviewer approves
4. Admin publishes: `status: published`, adds `publishedAt`
5. Article appears on `/en/trust/news/new-feature-mfa`

---

## Questions?

For technical setup questions, see the main README or contact the technical team.
