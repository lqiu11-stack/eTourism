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
  try {
    const experiences = await Experience.findAll({});
    return res.status(200).json(experiences);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getExperienceById = async (req, res) => {
  try {
    const experienceId = req.params.id;
    const experience = await Experience.findById(experienceId);

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    return res.status(200).json(experience);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
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

    let totalAmount = Number(((normalPrice * qty_normal) + (discountedPrice * qty_discounted)).toFixed(2));

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

const refundBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const visitor_id = req.userId;
    const { reason = '' } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.visitor_id !== visitor_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed bookings can be refunded' });
    }

    const existingRefund = await Refund.findByBookingId(bookingId);
    if (existingRefund) {
      return res.status(400).json({ message: 'Refund already requested for this booking' });
    }

    const experience = await Experience.findById(booking.experience_id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const payments = await Payment.findByBooking(bookingId);
    if (!payments || payments.length === 0) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const payment = payments[0];

    const eventDate = new Date(experience.date_time);
    const now = new Date();

    const diffMs = eventDate.getTime() - now.getTime();
    const days_before_event = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let refund_percentage = 0;

    if (days_before_event >= 14) {
      refund_percentage = 100;
    } else if (days_before_event >= 7) {
      refund_percentage = 50;
    } else {
      refund_percentage = 0;
    }

    const originalAmount = parseFloat(payment.amount || booking.amount_paid || 0);
    const refund_amount = Number((originalAmount * refund_percentage / 100).toFixed(2));

    if (refund_percentage === 0) {
      const refundRecord = await Refund.create({
        booking_id: bookingId,
        payment_id: payment.id,
        refund_amount: 0,
        refund_percentage: 0,
        days_before_event,
        status: 'rejected',
        reason: reason || 'Cancelled fewer than 7 days before the event',
        processed_at: new Date()
      });

      return res.status(200).json({
        message: 'No refund available because the cancellation is fewer than 7 days before the event',
        refund: refundRecord
      });
    }

    let gatewayRefundId = null;

    if (payment.method === 'stripe') {
      if (!payment.transaction_id) {
        return res.status(400).json({ message: 'Stripe transaction_id is missing' });
      }

      const stripeRefund = await stripe.refunds.create({
        payment_intent: payment.transaction_id,
        amount: Math.round(refund_amount * 100)
      });

      gatewayRefundId = stripeRefund.id;
    } else if (payment.method === 'paypal') {
      if (!payment.transaction_id) {
        return res.status(400).json({ message: 'PayPal transaction_id is missing' });
      }

      const client = getPayPalClient();

      const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(
        payment.transaction_id
      );

      request.requestBody({
        amount: {
          currency_code: 'GBP',
          value: refund_amount.toFixed(2)
        }
      });

      const response = await client.execute(request);

      gatewayRefundId = response.result.id;
    } else {
      return res.status(400).json({
        message: `Unsupported payment method: ${payment.method}`
      });
    }

    const refundRecord = await Refund.create({
      booking_id: bookingId,
      payment_id: payment.id,
      refund_amount,
      refund_percentage,
      days_before_event,
      status: 'approved',
      reason: reason || 'Visitor requested refund',
      processed_at: new Date()
    });

    await Booking.updateStatus(bookingId, 'refunded');

    return res.status(200).json({
      message: 'Refund processed successfully',
      refund: refundRecord,
      payment_method: payment.method,
      gateway_refund_id: gatewayRefundId
    });
  } catch (err) {
    console.error('Refund Error:', err);
    return res.status(500).json({ message: 'Refund Error', error: String(err) });
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
            currency: 'GBP',
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
      application_context: {
        brand_name: 'eTourism',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',       
        shipping_preference: 'NO_SHIPPING', 
        return_url: `${process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5173'}/payment-success`,
        cancel_url: `${process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5173'}/payment-cancel`
      },
      purchase_units: [{
        amount: {
          currency_code: 'GBP',
          value: Number(booking.amount_paid).toFixed(2)
        },
        reference_id: booking.id.toString()
      }]
    });


    const response = await client.execute(request);
    return res.status(200).json({
     id: response.result.id,
     status: response.result.status,
     links: response.result.links
   });
   
  } catch (err) {
    console.error("PayPal Create Order Error:", err);
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
      
      const amount = Number((session.amount_total / 100).toFixed(2));
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
  refundBooking,
  captureStripePayment
};
