# Super Platform

Enterprise-grade multi-tenant platform built with Next.js + TypeScript + Firebase

## 🏗️ Structure

```
super-platform/
├── apps/
│   └── web/              # Main Next.js application
├── packages/
│   ├── core/            # Core platform (auth, RBAC, audit)
│   ├── ui/              # Shared UI components
│   ├── firebase/        # Firebase integration
│   ├── shared/          # Shared utilities
│   └── types/           # TypeScript types
└── modules/
    ├── seo/             # SEO module
    ├── crm/             # CRM module (future)
    └── ...              # Other modules
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📦 Packages

- `@platform/core` - Core platform functionality
- `@platform/ui` - Shared UI component library
- `@platform/firebase` - Firebase client & admin
- `@platform/shared` - Shared utilities & helpers
- `@platform/types` - TypeScript type definitions

## 🧩 Modules

- `@modules/seo` - SEO & Content Management

## 🔧 Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage)
- **State:** Zustand
- **Build:** Turborepo
