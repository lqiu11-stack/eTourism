const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const Payment = require('../models/Payment');

const getMe = async (req, res) => {
  // TODO
};

const getExperiences = async (req, res) => {
  // TODO
};

const getExperienceById = async (req, res) => {
  // TODO
};

const createBooking = async (req, res) => {
  try {
    const { experience_id, booking_type = 'full', meeting_link = '' } = req.body;
    const visitor_id = req.userId;

    if (!experience_id) {
      return res.status(400).json({ message: 'experience_id is required' });
    }

    const experience = await Experience.findById(experience_id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const amount_paid = experience.price;

    const newBooking = await Booking.create({
      visitor_id,
      experience_id,
      amount_paid,
      booking_type,
      meeting_link
    });

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking
    });
  } catch (err) {
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

const createReview = async (req, res) => {
  // TODO
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

module.exports = {
  getMe,
  getExperiences,
  getExperienceById,
  createBooking,
  getBookings,
  getBookingById,
  createReview,
  rescheduleBooking,
  createPaymentSession,
};