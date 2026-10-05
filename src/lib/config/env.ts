/**
 * Environment configuration validator for GATEPrep Studio
 */
export interface EnvConfig {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  razorpayKeyId: string;
  isProduction: boolean;
}

export function validateEnvConfig(): EnvConfig {
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
  const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gatematrix-40566.firebaseapp.com';
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gatematrix-40566';
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const isProduction = process.env.NODE_ENV === 'production';

  const missingClientVars: string[] = [];
  if (!firebaseApiKey) missingClientVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!razorpayKeyId && isProduction) missingClientVars.push('NEXT_PUBLIC_RAZORPAY_KEY_ID');

  if (missingClientVars.length > 0 && typeof window !== 'undefined') {
    console.warn(`[Env Validation Warning] Missing recommended client variables: ${missingClientVars.join(', ')}`);
  }

  return {
    firebaseApiKey,
    firebaseAuthDomain,
    firebaseProjectId,
    razorpayKeyId,
    isProduction,
  };
}
