import admin from 'firebase-admin';
import { config } from '@/config';

export let initError: any = null;
export let initSuccess: boolean = false;
export let missingVars: string[] = [];

if (!admin.apps.length) {
  // Strip wrapping quotes (single or double) from cPanel / environment variables
  const cleanStr = (str: string | undefined) => {
    if (!str) return '';
    let val = str.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).trim();
    }
    return val;
  };

  const projectId = cleanStr(config.firebaseAdmin.projectId);
  const rawPrivateKey = cleanStr(config.firebaseAdmin.privateKey);
  const clientEmail = cleanStr(config.firebaseAdmin.clientEmail);

  if (!projectId || !rawPrivateKey || !clientEmail) {
    missingVars = [
      !projectId && 'projectId',
      !rawPrivateKey && 'privateKey',
      !clientEmail && 'clientEmail'
    ].filter((x): x is string => typeof x === 'string');
    console.error(`⚠️ Critical Warning: Firebase Admin credentials are not set in the configuration. Missing: ${missingVars.join(', ')}`);
  } else {
    try {
      const privateKey = (() => {
        let formattedKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/\r/g, '');
        const lines = formattedKey.split('\n');
        const cleanedLines = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('-----BEGIN') || trimmed.startsWith('-----END')) {
            return trimmed;
          }
          return trimmed.replace(/\s+/g, '');
        });
        return cleanedLines.filter(line => line.length > 0).join('\n');
      })();

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
      console.log('✅ Firebase Admin successfully initialized.');
      initSuccess = true;
    } catch (error: any) {
      initError = {
        message: error.message,
        stack: error.stack,
      };
      console.error('❌ Failed to initialize Firebase Admin:', error);
    }
  }
}

export { admin };
export default admin;
