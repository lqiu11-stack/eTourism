const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const ExperienceMeetingLink = require('../models/ExperienceMeetingLink');

const getPayPalClient = () => {

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  const environment = new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment);
};

const getMe = async (req, res) => {
};

const getExperiences = async (req, res) => {
};

const getExperienceById = async (req, res) => {
};

const createBooking = async (req, res) => {
  try {
  
    const { 
      experience_id, 
      qty_normal = 0, 
      qty_discounted = 0, 
      contact_name, 
      contact_email,
      agreed_to_terms,
      meeting_link = '' 
    } = req.body;
    
    const visitor_id = req.userId;

    if (agreed_to_terms !== true) {
      return res.status(400).json({ message: 'You must agree to the Terms and Conditions.' });
    }
    if (!experience_id) {
      return res.status(400).json({ message: 'experience_id is required' });
    }

    const experience = await Experience.findById(experience_id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const totalTickets = qty_normal + qty_discounted;
    if (totalTickets > experience.max_visitors) {
      return res.status(400).json({ message: `Sold out! Only ${experience.max_visitors} spots available.` });
    }

    const normalPrice = parseFloat(experience.price || 0);
    
    const discountedPrice = experience.price_discounted 
      ? parseFloat(experience.price_discounted) 
      : Math.max(0, normalPrice - 10);

    let totalAmount = (normalPrice * qty_normal) + (discountedPrice * qty_discounted);

    const newBooking = await Booking.create({
      visitor_id,
      experience_id,
      amount_paid: totalAmount,      
      booking_type: 'online', 
      meeting_link,
      qty_normal,            
      qty_discounted,        
      contact_name,          
      contact_email          
    });

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking
    });
  } catch (err) {
    console.error("Booking Error:", err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};


const getBookings = async (req, res) => {
  try {
    const visitor_id = req.userId;
    const bookings = await Booking.findByVisitor(visitor_id);
    return res.status(200).json(bookings);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.visitor_id !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.status(200).json(booking);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getBookingMeetingLink = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.visitor_id !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(403).json({ message: 'Meeting link is only available for successfully booked experiences' });
    }

    const config = await ExperienceMeetingLink.findByExperienceId(booking.experience_id);
    if (!config) {
      return res.status(404).json({ message: 'Meeting link is not configured yet' });
    }

    return res.status(200).json({
      platform: config.platform,
      meeting_url: config.meeting_url,
      meeting_password: config.meeting_password,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const createReview = async (req, res) => {
};

const rescheduleBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { new_experience_id } = req.body;

    if (!new_experience_id) {
      return res.status(400).json({ message: 'new_experience_id is required' });
    }

    const visitorId = req.userId;
    if (!visitorId) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    const updated = await Booking.reschedule({
      booking_id: bookingId,
      visitor_id: visitorId,
      new_experience_id,
      new_status: 'rescheduled',
    });

    if (!updated) {
      return res.status(404).json({ message: 'Booking not found or not yours' });
    }

    return res.status(200).json({
      message: 'Booking rescheduled successfully',
      booking: updated,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const createPaymentSession = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const visitor_id = req.userId;

    if (!booking_id) {
      return res.status(400).json({ message: 'booking_id is required' });
    }

    const booking = await Booking.findById(booking_id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.visitor_id !== visitor_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const experience = await Experience.findById(booking.experience_id);
    
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: experience.title,
            },
            unit_amount: Math.round(booking.amount_paid * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5173'}/payment-cancel`,
      metadata: {
        booking_id: booking.id,
        visitor_id: visitor_id
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const createPayPalOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const visitor_id = req.userId;

    const booking = await Booking.findById(booking_id);

    if (!booking || booking.visitor_id !== visitor_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const client = getPayPalClient();
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: booking.amount_paid.toString()
        },
        reference_id: booking.id.toString()
      }]
    });

    const response = await client.execute(request);
    return res.status(200).json({ id: response.result.id });
  } catch (err) {
    return res.status(500).json({ message: 'PayPal Order Error', error: String(err) });
  }
};

const captureStripePayment = async (req, res) => {
  try {
    const { session_id } = req.body;
    const visitor_id = req.userId;

    if (!session_id) {
      return res.status(400).json({ message: 'session_id is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {

      const booking_id = session.metadata.booking_id;
      
      const amount = session.amount_total / 100;
      const transaction_id = session.payment_intent; 

      const existingPayments = await Payment.findByBooking(booking_id); //
      if (existingPayments.length > 0) {
        return res.status(200).json({ message: 'Payment already captured', status: 'success' });
      }

      await Payment.create({
        booking_id,
        visitor_id,
        amount,
        method: 'stripe',
        transaction_id
      });

      await Booking.updateStatus(booking_id, 'confirmed');

      return res.status(200).json({ message: 'Stripe payment successful and recorded', status: 'success' });
    } else {
      return res.status(400).json({ message: 'Payment not completed yet' });
    }
  } catch (err) {
    console.error("Stripe Capture Error:", err);
    return res.status(500).json({ message: 'Stripe Capture Error', error: String(err) });
  }
};

const capturePayPalOrder = async (req, res) => {
  try {
    const { orderID, booking_id } = req.body;
    const visitor_id = req.userId;

    const client = getPayPalClient();
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const response = await client.execute(request);

    if (response.result.status === 'COMPLETED') {
      const capture = response.result.purchase_units[0].payments.captures[0];
      
      await Payment.create({
        booking_id,
        visitor_id,
        amount: capture.amount.value,
        method: 'paypal',
        transaction_id: capture.id
      });

      await Booking.updateStatus(booking_id, 'confirmed');

      return res.status(200).json({ status: 'success' });
    }
    return res.status(400).json({ message: 'Payment incomplete' });
  } catch (err) {
    return res.status(500).json({ message: 'PayPal Capture Error', error: String(err) });
  }
};

const refundBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Refund reason is required' });
    }

    const visitorId = req.userId;
    if (!visitorId) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    const booking = await Booking.getRefundContext(bookingId, visitorId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or not yours' });
    }

    const existingRefund = await Refund.findByBookingId(bookingId);
    if (existingRefund) {
      return res.status(400).json({ message: 'Refund request already exists for this booking' });
    }

    const now = new Date();
    const eventDate = new Date(booking.date_time);
    const diffMs = eventDate - now;
    const daysBeforeEvent = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let refundPercentage = 0;
    let refundAmount = 0;
    let refundStatus = 'rejected';
    let processedAt = new Date();

    if (daysBeforeEvent >= 14) {
      refundPercentage = 100;
      refundAmount = Number(booking.amount_paid);
      refundStatus = 'pending';
      processedAt = null;
    } else if (daysBeforeEvent >= 7) {
      refundPercentage = 50;
      refundAmount = Number(booking.amount_paid) * 0.5;
      refundStatus = 'pending';
      processedAt = null;
    }

    const refund = await Refund.create({
      booking_id: booking.booking_id,
      payment_id: booking.payment_id,
      refund_amount: refundAmount,
      refund_percentage: refundPercentage,
      days_before_event: daysBeforeEvent,
      status: refundStatus,
      reason: reason.trim(),
      processed_at: processedAt,
    });

    if (refundStatus === 'pending') {
      await Booking.updateStatus(booking.booking_id, 'refund_pending');
    } else {
      await Booking.updateStatus(booking.booking_id, 'cancelled');
    }

    return res.status(200).json({
      message:
        refundStatus === 'pending'
          ? 'Refund request submitted successfully'
          : 'This booking is not refundable',
      refund: {
        id: refund.id,
        booking_id: refund.booking_id,
        refund_amount: refund.refund_amount,
        refund_percentage: refund.refund_percentage,
        days_before_event: refund.days_before_event,
        status: refund.status,
        reason: refund.reason,
      },
      payment_method: booking.payment_method,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error',
      error: String(err),
    });
  }
};

module.exports = {
  getMe,
  getExperiences,
  getExperienceById,
  createBooking,
  getBookings,
  getBookingById,
  getBookingMeetingLink,
  createReview,
  rescheduleBooking,
  createPaymentSession,
  createPayPalOrder,
  capturePayPalOrder,
  captureStripePayment,
  refundBooking
};
