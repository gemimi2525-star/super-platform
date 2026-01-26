# Super Platform Control Panel

A simplified, standalone Next.js application for the Super Platform Control Panel.

## Structure

This project has been migrated from a monorepo setup to a flattened structure:

```
.
├── app/                  # Next.js App Router pages
│   ├── [locale]/        # Localized routes (en, th, zh)
│   │   ├── (platform)/  # Protected Platform pages
│   │   └── (public)/    # Public pages (Login)
├── components/           # Shared components
│   ├── ui/              # Base UI Kit (formerly packages/ui-kit)
│   └── ...
├── lib/                  # Utilities and Logic
│   ├── auth/            # Authentication logic
│   ├── core/            # Business logic (formerly packages/core)
│   ├── firebase/        # Firebase client setup
│   ├── firebase-admin/  # Firebase Admin setup
│   └── i18n/            # Custom i18n system
├── locales/              # Translation files
├── modules/              # Feature Modules
│   ├── dashboard/
│   ├── users/
│   ├── roles/
│   └── audit/
└── public/               # Static assets
```

## Getting Started

### 1. Environment Setup

Copy the example environment file and configure your values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in your Firebase credentials:

```bash
# Firebase Client (Get from Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... (see .env.example for all required variables)

# Firebase Admin SDK (Get from Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

⚠️ **Security Notes:**
- Never commit `.env.local` to git (it's already in `.gitignore`)
- For production, set these in your hosting platform's environment variables
- See `.env.example` for detailed documentation

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 4. Build for Production

```bash
npm run build
npm start
```

## Features

- 🌍 **Multilingual**: Supports English, Thai, and Chinese
- 🔐 **Authentication**: Firebase Auth with session management
- 👥 **RBAC**: Role-Based Access Control system
- 🏢 **Multi-tenant**: Organization/tenant management
- 📊 **Audit Logs**: Track all important activities
- 🎨 **Modern UI**: Built with Next.js 16 + Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **i18n**: Custom implementation

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for a complete list of required environment variables.

**Critical variables for production:**
- All `NEXT_PUBLIC_FIREBASE_*` variables
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `CRON_SECRET` (generate with: `openssl rand -base64 32`)

⚠️ **Before deploying to production**, ensure:
- `AUTH_DEV_BYPASS` is removed or set to `false`
- All secrets are regenerated with secure random values
- Firebase security rules are properly configured

## License

Private - All Rights Reserved
