'use strict';

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Replaces ../models/Booking.js so no real DB calls are made.
// Covers all Booking methods used by visitorController:
//   create         – insert a new booking row
//   findByVisitor  – list all bookings belonging to a visitor
//   findById       – look up a single booking by its primary key
//   reschedule     – move a booking to a different experience
//   updateStatus   – set booking.status (e.g. confirmed, cancelled, refund_pending)
//   getRefundContext – fetch booking + payment info needed to evaluate a refund
const mockBooking = {
  create: mock.fn(),
  findByVisitor: mock.fn(),
  findById: mock.fn(),
  reschedule: mock.fn(),
  updateStatus: mock.fn(),
  getRefundContext: mock.fn(),
};
require.cache[path.resolve(__dirname, '../models/Booking.js')] = {
  id: path.resolve(__dirname, '../models/Booking.js'),
  filename: path.resolve(__dirname, '../models/Booking.js'),
  loaded: true,
  exports: mockBooking,
  children: [],
  paths: [],
};

// Replaces ../models/Experience.js so no real DB calls are made.
// findById – look up an experience by id (used to validate bookings and build Stripe line items)
const mockExperience = { findById: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Experience.js')] = {
  id: path.resolve(__dirname, '../models/Experience.js'),
  filename: path.resolve(__dirname, '../models/Experience.js'),
  loaded: true,
  exports: mockExperience,
  children: [],
  paths: [],
};

// Replaces ../models/Payment.js so no real DB calls are made.
// create        – record a successful payment (Stripe or PayPal)
// findByBooking – check whether a payment already exists for a booking (idempotency guard)
const mockPayment = { create: mock.fn(), findByBooking: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Payment.js')] = {
  id: path.resolve(__dirname, '../models/Payment.js'),
  filename: path.resolve(__dirname, '../models/Payment.js'),
  loaded: true,
  exports: mockPayment,
  children: [],
  paths: [],
};

// Replaces ../models/Refund.js so no real DB calls are made.
// create          – insert a new refund record with amount and status
// findByBookingId – check whether a refund already exists for a booking (idempotency guard)
const mockRefund = { create: mock.fn(), findByBookingId: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Refund.js')] = {
  id: path.resolve(__dirname, '../models/Refund.js'),
  filename: path.resolve(__dirname, '../models/Refund.js'),
  loaded: true,
  exports: mockRefund,
  children: [],
  paths: [],
};

// Replaces the 'stripe' npm package so no real Stripe API calls are made.
// fakeStripeClient simulates the object returned by stripe(secretKey):
//   checkout.sessions.create   – create a hosted Stripe Checkout session
//   checkout.sessions.retrieve – fetch a session to verify payment_status after redirect
// fakeStripe is the factory function (stripe is exported as a function, not an object)
const fakeStripeClient = {
  checkout: {
    sessions: {
      create: mock.fn(),
      retrieve: mock.fn(),
    },
  },
};
const fakeStripe = mock.fn(() => fakeStripeClient);
require.cache[require.resolve('stripe')] = {
  id: require.resolve('stripe'),
  filename: require.resolve('stripe'),
  loaded: true,
  exports: fakeStripe,
  children: [],
  paths: [],
};

// Replaces '@paypal/checkout-server-sdk' so no real PayPal API calls are made.
// fakePayPalClient.execute – sends any PayPal HTTP request (create order, capture order)
// core.SandboxEnvironment  – constructor for the PayPal sandbox credentials object
// core.PayPalHttpClient    – constructor that wraps the environment; returns fakePayPalClient
// orders.OrdersCreateRequest  – request builder for POST /v2/checkout/orders
// orders.OrdersCaptureRequest – request builder for POST /v2/checkout/orders/:id/capture
const fakePayPalClient = { execute: mock.fn() };
const fakePayPal = {
  core: {
    SandboxEnvironment: mock.fn(),
    PayPalHttpClient: mock.fn(() => fakePayPalClient),
  },
  orders: {
    OrdersCreateRequest: mock.fn(() => ({
      prefer: mock.fn(),
      requestBody: mock.fn(),
    })),
    OrdersCaptureRequest: mock.fn(() => ({
      requestBody: mock.fn(),
    })),
  },
};
require.cache[require.resolve('@paypal/checkout-server-sdk')] = {
  id: require.resolve('@paypal/checkout-server-sdk'),
  filename: require.resolve('@paypal/checkout-server-sdk'),
  loaded: true,
  exports: fakePayPal,
  children: [],
  paths: [],
};

const {
  getMe,
  getExperiences,
  getExperienceById,
  createBooking,
  getBookings,
  getBookingById,
  createReview,
  rescheduleBooking,
  createPaymentSession,
  createPayPalOrder,
  capturePayPalOrder,
  captureStripePayment,
  refundBooking,
} = require('../controllers/visitorController');

function makeRes() {
  const res = {};
  res.status = mock.fn(() => res);
  res.json = mock.fn(() => res);
  return res;
}

function makeReq(body = {}, params = {}, query = {}, userId = null) {
  return { body, params, query, userId };
}

function resetMocks() {
  mockBooking.create.mock.resetCalls();
  mockBooking.findByVisitor.mock.resetCalls();
  mockBooking.findById.mock.resetCalls();
  mockBooking.reschedule.mock.resetCalls();
  mockBooking.updateStatus.mock.resetCalls();
  mockBooking.getRefundContext.mock.resetCalls();
  mockExperience.findById.mock.resetCalls();
  mockPayment.create.mock.resetCalls();
  mockPayment.findByBooking.mock.resetCalls();
  mockRefund.create.mock.resetCalls();
  mockRefund.findByBookingId.mock.resetCalls();
  fakeStripeClient.checkout.sessions.create.mock.resetCalls();
  fakeStripeClient.checkout.sessions.retrieve.mock.resetCalls();
  fakePayPalClient.execute.mock.resetCalls();
}

describe('createBooking()', () => {
  beforeEach(resetMocks);

  it('201 : creates a booking successfully', async () => {
    // TODO
  });

  it('400 : agreed_to_terms is not true', async () => {
    // TODO
  });

  it('400 : missing experience_id', async () => {
    // TODO
  });

  it('400 : total tickets exceed max_visitors', async () => {
    // TODO
  });

  it('404 : experience not found', async () => {
    // TODO
  });

  it('500 : database error on booking create', async () => {
    // TODO
  });
});

describe('getBookings()', () => {
  beforeEach(resetMocks);

  it('200 : returns all bookings for visitor', async () => {
    // TODO
  });

  it('500 : database error', async () => {
    // TODO
  });
});

describe('getBookingById()', () => {
  beforeEach(resetMocks);

  it('200 : returns booking when found and owned by visitor', async () => {
    // TODO
  });

  it('403 : booking belongs to a different visitor', async () => {
    // TODO
  });

  it('404 : booking not found', async () => {
    // TODO
  });

  it('500 : database error', async () => {
    // TODO
  });
});

describe('rescheduleBooking()', () => {
  beforeEach(resetMocks);

  it('200 : reschedules booking successfully', async () => {
    // TODO
  });

  it('400 : missing new_experience_id', async () => {
    // TODO
  });

  it('401 : no visitor id on request', async () => {
    // TODO
  });

  it('404 : booking not found or not owned by visitor', async () => {
    // TODO
  });

  it('500 : database error', async () => {
    // TODO
  });
});

describe('createPaymentSession()', () => {
  beforeEach(resetMocks);

  it('200 : returns stripe checkout session url', async () => {
    // TODO
  });

  it('400 : missing booking_id', async () => {
    // TODO
  });

  it('403 : booking belongs to a different visitor', async () => {
    // TODO
  });

  it('404 : booking not found', async () => {
    // TODO
  });

  it('404 : experience not found', async () => {
    // TODO
  });

  it('500 : stripe error', async () => {
    // TODO
  });
});

describe('createPayPalOrder()', () => {
  beforeEach(resetMocks);

  it('200 : returns paypal order id', async () => {
    // TODO
  });

  it('403 : booking not found or not owned by visitor', async () => {
    // TODO
  });

  it('500 : paypal error', async () => {
    // TODO
  });
});

describe('captureStripePayment()', () => {
  beforeEach(resetMocks);

  it('200 : records payment and confirms booking', async () => {
    // TODO
  });

  it('200 : payment already captured', async () => {
    // TODO
  });

  it('400 : missing session_id', async () => {
    // TODO
  });

  it('400 : payment not completed yet', async () => {
    // TODO
  });

  it('500 : stripe retrieve error', async () => {
    // TODO
  });
});

describe('capturePayPalOrder()', () => {
  beforeEach(resetMocks);

  it('200 : captures paypal order and confirms booking', async () => {
    // TODO
  });

  it('400 : payment incomplete', async () => {
    // TODO
  });

  it('500 : paypal capture error', async () => {
    // TODO
  });
});

describe('refundBooking()', () => {
  beforeEach(resetMocks);

  it('200 : submits 100% refund request when >= 14 days before event', async () => {
    // TODO
  });

  it('200 : submits 50% refund request when >= 7 and < 14 days before event', async () => {
    // TODO
  });

  it('200 : rejects refund when < 7 days before event', async () => {
    // TODO
  });

  it('400 : missing or empty refund reason', async () => {
    // TODO
  });

  it('400 : refund request already exists', async () => {
    // TODO
  });

  it('401 : no visitor id on request', async () => {
    // TODO
  });

  it('404 : booking not found or not owned by visitor', async () => {
    // TODO
  });

  it('500 : database error', async () => {
    // TODO
  });
});

describe('getMe()', () => {
  beforeEach(resetMocks);

  it('returns visitor profile', async () => {
    // TODO
  });
});

describe('getExperiences()', () => {
  beforeEach(resetMocks);

  it('returns list of available experiences', async () => {
    // TODO
  });
});

describe('getExperienceById()', () => {
  beforeEach(resetMocks);

  it('returns a single experience by id', async () => {
    // TODO
  });
});

describe('createReview()', () => {
  beforeEach(resetMocks);

  it('creates a review for a booking', async () => {
    // TODO
  });
});
