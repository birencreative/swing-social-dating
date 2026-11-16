import paypal from '@paypal/payouts-sdk';
import { config } from '@/config';

const getPaypalEnvironment = () => {
  const { clientId, clientSecret, mode } = config.paypal;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal API credentials are missing from your configuration.');
  }

  return mode === 'live'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
};

export const paypalClient = new paypal.core.PayPalHttpClient(getPaypalEnvironment());

export default paypalClient;
