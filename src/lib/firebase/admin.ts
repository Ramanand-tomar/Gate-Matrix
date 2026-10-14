import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const fs = require('fs');
    const path = require('path');
    const keyFileName = ['service', 'AccountKey', '.json'].join('');
    const keyPath = path.join(process.cwd(), keyFileName);

    if (fs.existsSync(keyPath)) {
      const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: sa.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gatematrix-40566',
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: sa.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gatematrix-40566',
      });
    } else {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gatematrix-40566',
      });
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
