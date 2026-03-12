/**
 * Development environment configuration.
 *
 * Replace the firebase placeholder values with your actual
 * Firebase project credentials from the Firebase Console:
 * https://console.firebase.google.com → Project Settings → General → Your apps
 */
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
