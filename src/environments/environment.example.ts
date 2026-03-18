/**
 * Environment configuration template.
 *
 * Copy this file to environment.ts and environment.prod.ts,
 * then fill in your Firebase credentials from:
 * https://console.firebase.google.com → Project Settings → General → Your apps
 */
export const environment = {
  production: false, // set to true in environment.prod.ts
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT',
    storageBucket: 'YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID',
  },
};
