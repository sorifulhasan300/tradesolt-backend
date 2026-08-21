import Stripe from 'stripe';
import envVars from '../config/env.config.js';

export const stripe = new Stripe(envVars.STRIPE_SECRET_KEY, {
  apiVersion: '2026-07-29.dahlia',
  typescript: true,
});

export default stripe;
