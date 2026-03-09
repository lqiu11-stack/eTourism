const Booking = require('../models/Booking');
const Refund = require('../models/Refund');

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
  // TODO
};

const getBookings = async (req, res) => {
  // TODO
};

const getBookingById = async (req, res) => {
  // TODO
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

    const visitorId = req.user?.id;
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

const refundBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Refund reason is required' });
    }

    const visitorId = req.user?.id;
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
  createReview,
  rescheduleBooking,
  refundBooking,
};