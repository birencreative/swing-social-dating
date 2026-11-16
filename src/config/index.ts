/**
 * Centralized, validated environment configuration for Swing-Social-Website.
 * Always import from this file instead of accessing process.env directly.
 */

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value && process.env.NODE_ENV === 'production') {
    const isDbCritical = key.startsWith('DB_');
    if (isDbCritical) {
      throw new Error(`CRITICAL CONFIGURATION ERROR: The environment variable "${key}" is required but not set!`);
    } else {
      console.error(`WARNING: The environment variable "${key}" is required in production but is not set. Some features may fail.`);
    }
  }
  return value || '';
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Database Connection Configuration
  db: {
    user: getEnv('DB_USER'),
    host: getEnv('DB_HOST'),
    name: getEnv('DB_NAME'),
    password: getEnv('DB_PASSWORD'),
    port: Number(getEnv('DB_PORT', '5432')),
  },

  // AWS Rekognition & S3 Configuration
  aws: {
    region: getEnv('AWS_REGION', 'us-east-1'),
    accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
    s3BucketName: getEnv('S3_BUCKET_NAME'),
  },

  // Azure Storage Configuration
  azure: {
    connectionString: getEnv('AZURE_STORAGE_CONNECTION_STRING'),
  },

  // Payment Gateways
  stripe: {
    secretKey: getEnv('STRIPE_SECRET_KEY'),
    apiVersion: '2026-03-25.dahlia' as const,
  },

  paypal: {
    clientId: getEnv('PAYPAL_CLIENT_ID'),
    clientSecret: getEnv('PAYPAL_CLIENT_SECRET'),
    mode: getEnv('PAYPAL_MODE', 'sandbox'), // sandbox or live
  },

  // Other third-party services
  googleMaps: {
    apiKey: getEnv('GOOGLE_MAPS_API_KEY'),
  },

  openai: {
    apiKey: getEnv('OPENAI_API_KEY'),
  },

  sightengine: {
    apiUser: getEnv('NEXT_PUBLIC_SIGHTENGINE_API_USER'),
    apiSecret: getEnv('NEXT_PUBLIC_SIGHTENGINE_API_SECRET'),
  },

  turnstile: {
    siteKey: getEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY'),
    secretKey: getEnv('TURNSTILE_SECRET_KEY'),
  },

  firebaseAdmin: {
    projectId: getEnv('FIREBASE_PROJECT_ID'),
    privateKey: getEnv('FIREBASE_PRIVATE_KEY'),
    clientEmail: getEnv('FIREBASE_CLIENT_EMAIL'),
  },

  authorizenet: {
    apiLoginId: getEnv('AUTHORIZENET_API_LOGIN_ID'),
    transactionKey: getEnv('AUTHORIZENET_TRANSACTION_KEY'),
  },
} as const;

export type AppConfig = typeof config;
export default config;
