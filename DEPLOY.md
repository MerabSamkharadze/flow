# FLOW — Deployment Guide

## Prerequisites
- Node.js 16+
- Firebase CLI: `npm install -g firebase-tools`

## First Time Setup
1. `firebase login`
2. `firebase use flow-8eacb`

## Deploy
```bash
npm run deploy
```

This runs `build:prod` automatically (via `predeploy`), then deploys hosting, Firestore rules, and Storage rules.

## Individual Deploys
```bash
# Hosting only
firebase deploy --only hosting

# Firestore rules only
firebase deploy --only firestore:rules

# Storage rules only
firebase deploy --only storage

# Production build without deploying
npm run build:prod
```

## Bundle Analysis
```bash
npm run analyze
```

## Manual Steps (one-time)
- Enable **Firebase Authentication** (Email/Password) in Firebase Console
- Set Firestore to **production mode** (rules are in `firestore.rules`)
- Enable **Firebase Storage**
- Rotate API keys if they were ever committed to git
- Configure Firebase Authentication email templates (verification, password reset)
- Set up custom domain in Firebase Hosting settings if needed

## Environment Files
```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.prod.ts
```

Fill in your Firebase config in both files. Set `production: true` in `environment.prod.ts`.

**Never commit environment.ts files** — they are in `.gitignore`.
