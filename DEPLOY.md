# FLOW — Deployment Guide

## Prerequisites

- Node.js 16+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project: `flow-8eacb`

## Deploy Steps

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Authenticate with Firebase:
   ```bash
   firebase login
   ```

3. Deploy hosting + Firestore rules:
   ```bash
   npm run deploy
   ```

   This will:
   - Run `ng build --configuration production`
   - Deploy the `dist/flow` output to Firebase Hosting
   - Deploy `firestore.rules` to Cloud Firestore

## Individual Deploys

```bash
# Hosting only
firebase deploy --only hosting

# Firestore rules only
firebase deploy --only firestore:rules

# Production build without deploying
npm run build:prod
```

## Bundle Analysis

```bash
npm run analyze
```

This generates a `stats.json` and opens the webpack bundle analyzer in your browser.

## Manual Steps (Post-Deploy)

- **Rotate Firebase API keys** if they were exposed in old git commits
- **Enable Firebase App Check** in the Firebase Console for production
- **Configure Firebase Authentication email templates** (verification, password reset)
- **Set up custom domain** in Firebase Hosting settings if needed
- **Enable Firestore backups** for production data
