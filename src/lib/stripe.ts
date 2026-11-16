import Stripe from 'stripe';
import { config } from '@/config';

if (!config.stripe.secretKey) {
  console.warn('⚠️ Warning: Stripe secret key is not set. Payments will fail.');
}

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: config.stripe.apiVersion,
  typescript: true,
});

export default stripe;
