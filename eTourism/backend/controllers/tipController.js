const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const Tip = require('../models/Tip');
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const User = require('../models/User');

const TIP_MIN = 1;
const TIP_MAX = 500;

const getPayPalClient = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  const environment = new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment);
};

const frontendBase = () =>
  (process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5173');

// Validates the request body, looks up the eHost, and (if booking_id is provided)
// confirms the booking belongs to the visitor, is completed, and was for an
// experience hosted by the same eHost. Returns { error } or { ehost, booking, amount, message }.
const validateTipRequest = async ({ visitor_id, ehost_id, amount, booking_id, message }) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < TIP_MIN || numericAmount > TIP_MAX) {
    return { error: `amount must be a number between ${TIP_MIN} and ${TIP_MAX}` };
  }
  const roundedAmount = Math.round(numericAmount * 100) / 100;

  const ehostIdNum = Number(ehost_id);
  if (!Number.isInteger(ehostIdNum) || ehostIdNum <= 0) {
    return { error: 'ehost_id is required' };
  }
  const ehost = await User.findById(ehostIdNum);
  if (!ehost || ehost.role !== 'ehost') {
    return { error: 'eHost not found' };
  }

  let booking = null;
  if (booking_id !== undefined && booking_id !== null && booking_id !== '') {
    const bookingIdNum = Number(booking_id);
    if (!Number.isInteger(bookingIdNum) || bookingIdNum <= 0) {
      return { error: 'booking_id must be a positive integer' };
    }
    booking = await Booking.findById(bookingIdNum);
    if (!booking || booking.visitor_id !== visitor_id) {
      return { error: 'Booking not found or not yours' };
    }
    if (['cancelled', 'refunded', 'refund_pending'].includes(booking.status)) {
      return { error: 'Cannot tip on a cancelled or refunded booking' };
    }
    const experience = await Experience.findById(booking.experience_id);
    if (!experience || experience.ehost_id !== ehostIdNum) {
      return { error: 'Booking does not belong to this eHost' };
    }
    // Brief calls for *post*-experience tipping. Gate on the experience start time
    // having passed, since the schema has no 'completed' booking status.
    if (!experience.date_time || new Date(experience.date_time) > new Date()) {
      return { error: 'You can only tip after the experience has started' };
    }
  }

  const trimmedMessage = typeof message === 'string' ? message.trim().slice(0, 500) : null;

  return {
    ehost,
    booking,
    amount: roundedAmount,
    message: trimmedMessage || null,
  };
};

const createStripeTipSession = async (req, res) => {
  try {
    const visitor_id = req.userId;
    const { ehost_id, amount, booking_id, message } = req.body;

    const validation = await validateTipRequest({ visitor_id, ehost_id, amount, booking_id, message });
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const tip = await Tip.create({
      visitor_id,
      ehost_id: validation.ehost.id,
      booking_id: validation.booking ? validation.booking.id : null,
      amount: validation.amount,
      method: 'stripe',
      message: validation.message,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'GBP',
          product_data: { name: `Tip for ${validation.ehost.display_name || validation.ehost.first_name}` },
          unit_amount: Math.round(validation.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${frontendBase()}/tip-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBase()}/payment-cancel`,
      metadata: { tip_id: tip.id, visitor_id, ehost_id: validation.ehost.id },
    });

    return res.status(200).json({ url: session.url, tip_id: tip.id });
  } catch (err) {
    console.error('Stripe tip session error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const captureStripeTip = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ message: 'session_id is required' });
    }
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const tip_id = session.metadata?.tip_id;
    if (!tip_id) {
      return res.status(400).json({ message: 'Session is not a tip' });
    }
    const tip = await Tip.findById(tip_id);
    if (!tip || tip.visitor_id !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (tip.status === 'paid') {
      return res.status(200).json({ status: 'success', tip });
    }
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed yet' });
    }
    const updated = await Tip.markPaid(tip.id, session.payment_intent);
    return res.status(200).json({ status: 'success', tip: updated });
  } catch (err) {
    console.error('Stripe tip capture error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const createPayPalTipOrder = async (req, res) => {
  try {
    const visitor_id = req.userId;
    const { ehost_id, amount, booking_id, message } = req.body;

    const validation = await validateTipRequest({ visitor_id, ehost_id, amount, booking_id, message });
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const tip = await Tip.create({
      visitor_id,
      ehost_id: validation.ehost.id,
      booking_id: validation.booking ? validation.booking.id : null,
      amount: validation.amount,
      method: 'paypal',
      message: validation.message,
    });

    const client = getPayPalClient();
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      application_context: {
        brand_name: 'eTourism',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${frontendBase()}/tip-success`,
        cancel_url: `${frontendBase()}/payment-cancel`,
      },
      purchase_units: [{
        amount: { currency_code: 'GBP', value: validation.amount.toFixed(2) },
        reference_id: `tip-${tip.id}`,
      }],
    });

    const response = await client.execute(request);
    return res.status(200).json({
      id: response.result.id,
      status: response.result.status,
      links: response.result.links,
      tip_id: tip.id,
    });
  } catch (err) {
    console.error('PayPal tip order error:', err);
    return res.status(500).json({ message: 'PayPal Order Error', error: String(err) });
  }
};

const capturePayPalTip = async (req, res) => {
  try {
    const { orderID, tip_id } = req.body;
    if (!orderID || !tip_id) {
      return res.status(400).json({ message: 'orderID and tip_id are required' });
    }
    const tip = await Tip.findById(tip_id);
    if (!tip || tip.visitor_id !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (tip.status === 'paid') {
      return res.status(200).json({ status: 'success', tip });
    }

    const client = getPayPalClient();
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const response = await client.execute(request);

    if (response.result.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Payment incomplete' });
    }
    const capture = response.result.purchase_units[0].payments.captures[0];
    const updated = await Tip.markPaid(tip.id, capture.id);
    return res.status(200).json({ status: 'success', tip: updated });
  } catch (err) {
    console.error('PayPal tip capture error:', err);
    return res.status(500).json({ message: 'PayPal Capture Error', error: String(err) });
  }
};

// eHost-side: list tips received and total.
const listMyTips = async (req, res) => {
  try {
    const ehost_id = req.userId;
    const [tips, total] = await Promise.all([
      Tip.listForEhost(ehost_id),
      Tip.sumForEhost(ehost_id),
    ]);
    return res.status(200).json({ tips, total });
  } catch (err) {
    console.error('List tips error:', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

module.exports = {
  createStripeTipSession,
  captureStripeTip,
  createPayPalTipOrder,
  capturePayPalTip,
  listMyTips,
};
