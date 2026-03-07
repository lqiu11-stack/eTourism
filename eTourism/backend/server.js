require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('./models/Payment');
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Stripe Webhook MUST use express.raw() and be placed BEFORE express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the webhook signature to ensure it actually came from Stripe
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout sessions
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Retrieve the metadata we passed in during createPaymentSession
    const bookingId = session.metadata.booking_id;
    const visitorId = session.metadata.visitor_id;
    
    // Stripe amounts are in cents, so divide by 100
    const amountTotal = session.amount_total / 100; 
    const transactionId = session.payment_intent;

    try {
      // 1. Create a payment record in our database
      await Payment.create({
        booking_id: bookingId,
        visitor_id: visitorId,
        amount: amountTotal,
        method: 'stripe',
        transaction_id: transactionId
      });

      // 2. Update the booking status to 'confirmed' or 'paid'
      await Booking.updateStatus(bookingId, 'confirmed');
      
      console.log(`Successfully processed payment for booking ID: ${bookingId}`);
    } catch (dbError) {
      console.error('Database error during webhook processing:', dbError);
    }
  }

  // Acknowledge receipt of the event
  res.json({ received: true });
});

// Middleware for parsing JSON bodies for all other routes
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});