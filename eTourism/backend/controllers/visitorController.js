const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const pool = require('../config/db');
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Review = require('../models/Review');

const normalizeGenderPreference = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'any';
  }
  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases = {
    any: 'any',
    all: 'any',
    everyone: 'any',
    female: 'female_only',
    women: 'female_only',
    women_only: 'female_only',
    female_only: 'female_only',
    male: 'male_only',
    men: 'male_only',
    men_only: 'male_only',
    male_only: 'male_only',
    no_all_male: 'no_all_male_groups',
    no_all_male_group: 'no_all_male_groups',
    no_all_male_groups: 'no_all_male_groups',
    no_all_female: 'no_all_female_groups',
    no_all_female_group: 'no_all_female_groups',
    no_all_female_groups: 'no_all_female_groups',
  };
  return aliases[normalized] || null;
};

const normalizeGroupGenderType = (value) => {
  if (!value) {
    return null;
  }
  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases = {
    all_male: 'all_male',
    male_only: 'all_male',
    men_only: 'all_male',
    all_female: 'all_female',
    female_only: 'all_female',
    women_only: 'all_female',
    mixed: 'mixed',
    mixed_group: 'mixed',
  };
  return aliases[normalized] || null;
};

const resolveGroupGenderType = (payload = {}) => {
  const fromType = normalizeGroupGenderType(payload.group_gender_type);
  if (fromType) {
    return fromType;
  }
  const profile = payload.group_gender_profile;
  if (!profile || typeof profile !== 'object') {
    return null;
  }
  const male = Number(profile.male_count || 0);
  const female = Number(profile.female_count || 0);
  const other = Number(profile.other_count || 0);
  if (![male, female, other].every((count) => Number.isInteger(count) && count >= 0)) {
    return 'invalid';
  }
  const total = male + female + other;
  if (total <= 0) {
    return 'invalid';
  }
  if (male > 0 && female === 0 && other === 0) {
    return 'all_male';
  }
  if (female > 0 && male === 0 && other === 0) {
    return 'all_female';
  }
  return 'mixed';
};

const validateBookingPreference = (experience, payload = {}) => {
  const normalizedPreference = normalizeGenderPreference(experience.gender_preference);
  if (!normalizedPreference || normalizedPreference === 'any') {
    return null;
  }
  const groupGenderType = resolveGroupGenderType(payload);
  if (!groupGenderType) {
    return 'This experience requires group gender information. Please provide group_gender_type or group_gender_profile.';
  }
  if (groupGenderType === 'invalid') {
    return 'Invalid group gender profile. Please provide non-negative integer counts.';
  }
  if (normalizedPreference === 'female_only' && groupGenderType !== 'all_female') {
    return 'This experience accepts female-only groups.';
  }
  if (normalizedPreference === 'male_only' && groupGenderType !== 'all_male') {
    return 'This experience accepts male-only groups.';
  }
  if (normalizedPreference === 'no_all_male_groups' && groupGenderType === 'all_male') {
    return 'All-male groups are not accepted for this experience.';
  }
  if (normalizedPreference === 'no_all_female_groups' && groupGenderType === 'all_female') {
    return 'All-female groups are not accepted for this experience.';
  }
  return null;
};

const toMeetingConfig = (meetingLink) => {
  if (!meetingLink) {
    return null;
  }
  try {
    const parsed = JSON.parse(meetingLink);
    if (parsed && typeof parsed === 'object' && parsed.link) {
      return {
        platform: parsed.platform || 'Custom',
        link: parsed.link,
        password: parsed.password || null,
      };
    }
  } catch (error) {}
  return {
    platform: 'Custom',
    link: meetingLink,
    password: null,
  };
};

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
    const { category, country, continent, language, price_min, price_max, search } = req.query;
    const experiences = await Experience.findAll({
      status: 'approved',
      category:  category  || undefined,
      country:   country   || undefined,
      continent: continent || undefined,
      language:  language  || undefined,
      price_min: price_min || undefined,
      price_max: price_max || undefined,
      search:    search    || undefined,
    });
    return res.status(200).json(experiences);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getExperienceById = async (req, res) => {
  try {
    const experience = await Experience.findByIdWithHost(req.params.id);
    if (!experience) return res.status(404).json({ message: 'Experience not found' });
    return res.status(200).json(experience);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getReviews = async (req, res) => {
  try {
    const { experience_id } = req.query;
    if (!experience_id) {
      return res.status(400).json({ message: 'experience_id query param is required' });
    }
    const reviews = await Review.findByExperience(experience_id);
    return res.status(200).json(reviews);
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
      agreed_to_terms
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
    if (experience.status && experience.status !== 'approved') {
      return res.status(400).json({ message: 'This time slot is not available for booking.' });
    }
    if (!experience.date_time) {
      return res.status(400).json({ message: 'This experience has no available time slot.' });
    }

    const qtyNormal = Number(qty_normal);
    const qtyDiscounted = Number(qty_discounted);
    if (!Number.isInteger(qtyNormal) || !Number.isInteger(qtyDiscounted) || qtyNormal < 0 || qtyDiscounted < 0) {
      return res.status(400).json({ message: 'qty_normal and qty_discounted must be non-negative integers.' });
    }

    const totalTickets = qtyNormal + qtyDiscounted;
    if (totalTickets <= 0) {
      return res.status(400).json({ message: 'At least one ticket is required.' });
    }
    if (totalTickets > experience.max_visitors) {
      return res.status(400).json({ message: `Sold out! Only ${experience.max_visitors} spots available.` });
    }

    if (experience.date_time && new Date(experience.date_time).getTime() <= Date.now()) {
      return res.status(400).json({ message: 'Booking is closed because the experience has already started.' });
    }

    const preferenceError = validateBookingPreference(experience, req.body);
    if (preferenceError) {
      return res.status(400).json({ message: preferenceError });
    }

    const normalPrice = parseFloat(experience.price || 0);
    
    const discountedPrice = experience.price_discounted 
      ? parseFloat(experience.price_discounted) 
      : Math.max(0, normalPrice - 10);

    let totalAmount = Number(((normalPrice * qtyNormal) + (discountedPrice * qtyDiscounted)).toFixed(2));

    const newBooking = await Booking.create({
      visitor_id,
      experience_id,
      amount_paid: totalAmount,      
      booking_type: 'online', 
      meeting_link: '',
      qty_normal: qtyNormal,
      qty_discounted: qtyDiscounted,
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
    const mappedBookings = bookings.map((booking) => {
      const meetingConfig = booking.status === 'confirmed'
        ? toMeetingConfig(booking.meeting_link)
        : null;
      return {
        ...booking,
        meeting_link: meetingConfig ? meetingConfig.link : null,
        meeting_config: meetingConfig,
      };
    });
    return res.status(200).json(mappedBookings);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const visitor_id = req.userId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.visitor_id !== visitor_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const refund = await Refund.findByBookingId(bookingId);
    const payments = await Payment.findByBooking(bookingId);
    const payment = payments && payments.length > 0 ? payments[0] : null;

    const meetingConfig = booking.status === 'confirmed'
      ? toMeetingConfig(booking.meeting_link)
      : null;

    return res.status(200).json({
      ...booking,
      meeting_link: meetingConfig ? meetingConfig.link : null,
      meeting_config: meetingConfig,
      refund: refund
        ? {
            id: refund.id,
            status: refund.status,
            refund_amount: refund.refund_amount,
            refund_percentage: refund.refund_percentage,
            days_before_event: refund.days_before_event,
            reason: refund.reason,
            processed_at: refund.processed_at,
            payment_method: payment ? payment.method : null
          }
        : null
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getRefundStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const visitor_id = req.userId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.visitor_id !== visitor_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const refund = await Refund.findByBookingId(bookingId);
    const payments = await Payment.findByBooking(bookingId);
    const payment = payments && payments.length > 0 ? payments[0] : null;

    if (!refund) {
      return res.status(200).json({
        booking_id: booking.id,
        booking_status: booking.status,
        has_refund: false,
        message: 'No refund record found for this booking'
      });
    }

    return res.status(200).json({
      booking_id: booking.id,
      booking_status: booking.status,
      has_refund: true,
      refund_status: refund.status,
      refund_amount: refund.refund_amount,
      refund_percentage: refund.refund_percentage,
      days_before_event: refund.days_before_event,
      reason: refund.reason,
      processed_at: refund.processed_at,
      payment_method: payment ? payment.method : null
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const refundBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const visitor_id = req.userId;
    const { reason = '' } = req.body;

    if (!visitor_id) {
      return res.status(401).json({ message: 'Unauthorised' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason is required' });
    }

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
        reason: 'No refund available — cancellation is fewer than 7 days before the event',
        processed_at: new Date(),
      });
      return res.status(200).json({
        message: 'No refund available because the cancellation is fewer than 7 days before the event',
        refund: refundRecord,
      });
    }

    // Create a pending refund for admin to review — gateway is NOT charged yet
    const refundRecord = await Refund.create({
      booking_id: bookingId,
      payment_id: payment.id,
      refund_amount,
      refund_percentage,
      days_before_event,
      status: 'pending',
      reason: reason.trim(),
      processed_at: null,
    });

    await Booking.updateStatus(bookingId, 'refund_pending');

    return res.status(200).json({
      message: 'Refund request submitted. An admin will review it shortly.',
      refund: refundRecord,
    });
  } catch (err) {
    console.error('Refund Error:', err);
    return res.status(500).json({ message: 'Refund Error', error: String(err) });
  }
};

const createReview = async (req, res) => {
  try {
    const { experience_id, rating, comment } = req.body;
    const visitor_id = req.userId;

    if (!experience_id) {
      return res.status(400).json({ message: 'experience_id is required' });
    }
    const ratingInt = Number(rating);
    if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ message: 'rating must be an integer between 1 and 5' });
    }
    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

    const { rows: eligible } = await pool.query(
      `SELECT b.id
         FROM bookings b
         JOIN experiences e ON e.id = b.experience_id
        WHERE b.visitor_id = $1
          AND b.experience_id = $2
          AND b.status = 'confirmed'
          AND e.date_time < NOW()
        LIMIT 1`,
      [visitor_id, experience_id]
    );
    if (eligible.length === 0) {
      return res.status(403).json({
        message: 'You can only review experiences you have attended.',
      });
    }

    const { rows: existing } = await pool.query(
      `SELECT id FROM reviews WHERE visitor_id = $1 AND experience_id = $2 LIMIT 1`,
      [visitor_id, experience_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'You have already reviewed this experience.' });
    }

    const review = await Review.create({
      visitor_id,
      experience_id,
      rating: ratingInt,
      comment: trimmedComment,
    });
    return res.status(201).json(review);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
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

      const existingPayments = await Payment.findByBooking(booking_id);
      if (existingPayments.length > 0) {
        const booking = await Booking.findById(booking_id);
        const experience = await Experience.findById(booking.experience_id);
        return res.status(200).json({ status: 'success', booking, experience });
      }

      await Payment.create({
        booking_id,
        visitor_id,
        amount,
        method: 'stripe',
        transaction_id
      });

      await Booking.updateStatus(booking_id, 'confirmed');

      const booking = await Booking.findById(booking_id);
      const experience = await Experience.findById(booking.experience_id);

      return res.status(200).json({ status: 'success', booking, experience });
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
  getRefundStatus,
  createReview,
  rescheduleBooking,
  createPaymentSession,
  createPayPalOrder,
  capturePayPalOrder,
  refundBooking,
  captureStripePayment,
  getReviews
};
