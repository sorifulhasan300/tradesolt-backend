import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import prisma from '../../../lib/prisma.js';
import stripe from '../../../lib/stripe.js';
import ApiError from '../../../errors/ApiError.js';
import envVars from '../../../config/env.config.js';
import QueryBuilder from '../../../utils/queryBuilder.js';

/**
 * Creates a Stripe Connect Express account for a trader and returns an onboarding link.
 * If the trader already has a Stripe account, it reuses the existing one.
 */
const createStripeConnectAccount = async (userId: string) => {
  const traderProfile = await prisma.traderProfile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!traderProfile) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Trader profile not found for this user',
    );
  }

  let stripeAccountId = traderProfile.stripeAccountId;

  // Create a new Stripe Connect account via the v2 API if one doesn't exist
  if (!stripeAccountId) {
    const account = await stripe.v2.core.accounts.create({
      dashboard: 'express',
      contact_email: traderProfile.user.email,
      identity: {
        country: 'GB',
      },
      configuration: {
        merchant: {
          capabilities: {
            card_payments: { requested: true },
          },
        },
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      defaults: {
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application',
        },
      },
    });

    // Save the Stripe account ID to the trader profile
    await prisma.traderProfile.update({
      where: { userId },
      data: { stripeAccountId: account.id },
    });

    stripeAccountId = account.id;
  } else {
    // Ensure existing account has recipient capabilities enabled
    try {
      await stripe.v2.core.accounts.update(stripeAccountId, {
        contact_email: traderProfile.user.email,
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
      });
    } catch {
      // Ignore if account was created via Accounts v1 or already updated
    }
  }

  // Generate an onboarding link via the v2 Account Links API
  const accountLink = await stripe.v2.core.accountLinks.create({
    account: stripeAccountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        configurations: ['merchant', 'recipient'],
        refresh_url: `${envVars.CLIENT_URL}/stripe/refresh`,
        return_url: `${envVars.CLIENT_URL}/stripe/return`,
      },
    },
  });

  return { accountId: stripeAccountId, onboardingUrl: accountLink.url };
};

/**
 * Creates a Stripe PaymentIntent for a confirmed booking with platform fee splitting.
 * The platform fee is deducted and the remainder is transferred to the trader's connected account.
 */
const createPaymentIntentForBooking = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trader: true, payment: true },
  });

  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Booking not found');
  }

  if (booking.payment) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Payment already exists for this booking',
    );
  }

  if (booking.status !== 'CONFIRMED') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Booking must be confirmed before payment',
    );
  }

  if (!booking.trader.stripeAccountId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Trader has not completed Stripe onboarding',
    );
  }

  // Ensure the destination account has transfers capability enabled for destination charges
  try {
    await stripe.accounts.update(booking.trader.stripeAccountId, {
      capabilities: {
        transfers: { requested: true },
      },
    });
  } catch {
    try {
      await stripe.v2.core.accounts.update(booking.trader.stripeAccountId, {
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
      });
    } catch {
      // Ignore if capability update is restricted or already present
    }
  }

  // Calculate platform fee and trader payout (all amounts in pence)
  const platformFee = Math.round(
    booking.totalAmount * (envVars.STRIPE_PLATFORM_FEE_PERCENT / 100),
  );
  const traderPayout = booking.totalAmount - platformFee;

  // Create Stripe PaymentIntent with destination charge
  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.totalAmount,
    currency: 'gbp',
    application_fee_amount: platformFee,
    transfer_data: {
      destination: booking.trader.stripeAccountId,
    },
    metadata: {
      bookingId: booking.id,
      traderId: booking.traderId,
    },
  });

  // Create Payment record in database
  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      stripePaymentIntentId: paymentIntent.id,
      amountTotal: booking.totalAmount,
      platformFee,
      traderPayoutAmount: traderPayout,
      status: 'PENDING',
    },
  });

  return { payment, clientSecret: paymentIntent.client_secret };
};

/**
 * Handles incoming Stripe webhook events for payment lifecycle updates.
 * Updates Payment and Booking records based on event type.
 */
const handleStripeWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!payment) {
        console.warn(
          `Payment not found for PaymentIntent: ${paymentIntent.id}`,
        );
        return;
      }

      // Update payment status and optionally store charge ID
      await prisma.payment.update({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: 'SUCCEEDED',
          stripeChargeId:
            typeof paymentIntent.latest_charge === 'string'
              ? paymentIntent.latest_charge
              : null,
        },
      });

      // Mark the associated booking as completed
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'COMPLETED' },
      });

      console.log(`Payment succeeded for booking: ${payment.bookingId}`);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!payment) {
        console.warn(
          `Payment not found for failed PaymentIntent: ${paymentIntent.id}`,
        );
        return;
      }

      await prisma.payment.update({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: 'FAILED' },
      });

      console.log(`Payment failed for booking: ${payment.bookingId}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return;
  }
};

/**
 * Generates a Stripe Express dashboard login link for a trader.
 */
const getStripeConnectDashboardLink = async (userId: string) => {
  const traderProfile = await prisma.traderProfile.findUnique({
    where: { userId },
  });

  if (!traderProfile) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Trader profile not found for this user',
    );
  }

  if (!traderProfile.stripeAccountId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No Stripe account found');
  }

  const loginLink = await stripe.accounts.createLoginLink(
    traderProfile.stripeAccountId,
  );

  return { url: loginLink.url };
};

/**
 * Fetches paginated payments list with search, filter, date range, and sorting.
 */
const getAllPaymentsFromDB = async (
  query: Record<string, unknown> = {},
  user?: { id?: string; role?: string },
) => {
  const queryBuilder = new QueryBuilder(query)
    .search([
      'stripePaymentIntentId',
      'stripeChargeId',
      'stripeTransferId',
      'booking.customerName',
      'booking.customerEmail',
    ])
    .filter(['status', 'bookingId'])
    .dateRange('createdAt', 'startDate', 'endDate')
    .numericRange('amountTotal', 'minAmount', 'maxAmount')
    .sort('createdAt', 'desc')
    .paginate();

  // If user is a TRADER, restrict to payments for their bookings
  if (user && user.id && user.role === 'TRADER') {
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });
    if (traderProfile) {
      queryBuilder.addWhereCondition({
        booking: { traderId: traderProfile.id },
      });
    }
  }

  const where = queryBuilder.getWhere();
  const orderBy = queryBuilder.getOrderBy();
  const { skip, take } = queryBuilder.getPaginationParams();

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        booking: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  const meta = queryBuilder.getMeta(total);

  return { meta, data };
};

const getTraderStripeAccountStatus = async (traderIdInput?: string) => {
  if (!traderIdInput) {
    return {
      accountId: null,
      isOnboarded: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  }

  let traderProfile = await prisma.traderProfile.findUnique({
    where: { id: traderIdInput },
  });

  if (!traderProfile) {
    traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: traderIdInput },
    });
  }

  if (!traderProfile || !traderProfile.stripeAccountId) {
    return {
      accountId: null,
      isOnboarded: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  }

  return {
    accountId: traderProfile.stripeAccountId,
    isOnboarded: true,
    chargesEnabled: true,
    payoutsEnabled: true,
    detailsSubmitted: true,
  };
};

export const paymentService = {
  createStripeConnectAccount,
  createPaymentIntentForBooking,
  handleStripeWebhook,
  getStripeConnectDashboardLink,
  getAllPaymentsFromDB,
  getTraderStripeAccountStatus,
};

export default paymentService;

