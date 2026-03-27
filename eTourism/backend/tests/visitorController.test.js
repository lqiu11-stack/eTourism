'use strict';

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

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

const mockExperience = { findById: mock.fn(), findByIdWithHost: mock.fn(), findAll: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Experience.js')] = {
  id: path.resolve(__dirname, '../models/Experience.js'),
  filename: path.resolve(__dirname, '../models/Experience.js'),
  loaded: true,
  exports: mockExperience,
  children: [],
  paths: [],
};

const mockPayment = { create: mock.fn(), findByBooking: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Payment.js')] = {
  id: path.resolve(__dirname, '../models/Payment.js'),
  filename: path.resolve(__dirname, '../models/Payment.js'),
  loaded: true,
  exports: mockPayment,
  children: [],
  paths: [],
};

const mockRefund = { create: mock.fn(), findByBookingId: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Refund.js')] = {
  id: path.resolve(__dirname, '../models/Refund.js'),
  filename: path.resolve(__dirname, '../models/Refund.js'),
  loaded: true,
  exports: mockRefund,
  children: [],
  paths: [],
};

const fakeStripeClient = {
  checkout: {
    sessions: {
      create: mock.fn(),
      retrieve: mock.fn(),
    },
  },
  refunds: {
    create: mock.fn(),
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

const fakePayPalClient = { execute: mock.fn() };
const fakePayPal = {
  core: {
    SandboxEnvironment: function() {},
    PayPalHttpClient: function() { return fakePayPalClient; },
  },
  orders: {
    OrdersCreateRequest: function() { return { prefer: function() {}, requestBody: function() {} }; },
    OrdersCaptureRequest: function() { return { requestBody: function() {} }; },
  },
  payments: {
    CapturesRefundRequest: function() { return { requestBody: function() {} }; },
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
  mockExperience.findByIdWithHost.mock.resetCalls();
  mockExperience.findAll.mock.resetCalls();
  mockPayment.create.mock.resetCalls();
  mockPayment.findByBooking.mock.resetCalls();
  mockRefund.create.mock.resetCalls();
  mockRefund.findByBookingId.mock.resetCalls();
  fakeStripeClient.checkout.sessions.create.mock.resetCalls();
  fakeStripeClient.checkout.sessions.retrieve.mock.resetCalls();
  fakeStripeClient.refunds.create.mock.resetCalls();
  fakePayPalClient.execute.mock.resetCalls();
}

describe('createBooking()', () => {
  beforeEach(resetMocks);
  const futureSlot = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  it('201 : creates a booking successfully', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', price_discounted: '40.00', title: 'Test Tour', date_time: futureSlot, status: 'approved' };
    const fakeBooking = { id: 1, visitor_id: 42, experience_id: 1, amount_paid: 140 };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    mockBooking.create.mock.mockImplementationOnce(async () => fakeBooking);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 2, qty_discounted: 1, contact_name: 'Alice', contact_email: 'alice@example.com' },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Booking created successfully');
    assert.deepEqual(res.json.mock.calls[0].arguments[0].booking, fakeBooking);
    assert.equal(mockBooking.create.mock.calls[0].arguments[0].meeting_link, '');
  });

  it('400 : agreed_to_terms is not true', async () => {
    const req = makeReq({ experience_id: 1, agreed_to_terms: false }, {}, {}, 42);
    const res = makeRes();
    await createBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'You must agree to the Terms and Conditions.');
  });

  it('400 : missing experience_id', async () => {
    const req = makeReq({ agreed_to_terms: true }, {}, {}, 42);
    const res = makeRes();
    await createBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'experience_id is required');
  });

  it('400 : total tickets exceed max_visitors', async () => {
    const fakeExperience = { id: 1, max_visitors: 2, price: '50.00', title: 'Test Tour', date_time: futureSlot, status: 'approved' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 2, qty_discounted: 1 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /Sold out/);
  });

  it('400 : invalid quantity values', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', title: 'Test Tour', date_time: futureSlot, status: 'approved' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: -1, qty_discounted: 0 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /must be non-negative integers/i);
  });

  it('400 : zero total tickets', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', title: 'Test Tour', date_time: futureSlot, status: 'approved' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 0, qty_discounted: 0 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'At least one ticket is required.');
  });

  it('400 : booking closed when experience already started', async () => {
    const fakeExperience = {
      id: 1,
      max_visitors: 10,
      price: '50.00',
      title: 'Test Tour',
      date_time: new Date(Date.now() - 60 * 1000).toISOString(),
    };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 1, qty_discounted: 0 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /Booking is closed/i);
  });

  it('400 : missing group gender info for restricted preference', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', title: 'Test Tour', gender_preference: 'female_only', date_time: futureSlot, status: 'approved' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 1, qty_discounted: 0 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /requires group gender information/i);
  });

  it('400 : blocks all-male group for no_all_male_groups preference', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', title: 'Test Tour', gender_preference: 'no_all_male_groups', date_time: futureSlot, status: 'approved' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 2, qty_discounted: 0, group_gender_type: 'all_male' },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /All-male groups are not accepted/i);
  });

  it('201 : allows compliant group under gender preference', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', price_discounted: '40.00', title: 'Test Tour', gender_preference: 'female_only', date_time: futureSlot, status: 'approved' };
    const fakeBooking = { id: 2, visitor_id: 42, experience_id: 1, amount_paid: 50 };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    mockBooking.create.mock.mockImplementationOnce(async () => fakeBooking);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 1, qty_discounted: 0, group_gender_profile: { male_count: 0, female_count: 1, other_count: 0 } },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    assert.equal(res.json.mock.calls[0].arguments[0].booking.id, 2);
  });

  it('404 : experience not found', async () => {
    mockExperience.findById.mock.mockImplementationOnce(async () => null);
    const req = makeReq({ experience_id: 999, agreed_to_terms: true }, {}, {}, 42);
    const res = makeRes();
    await createBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Experience not found');
  });

  it('400 : rejects booking for unavailable slot status', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', title: 'Test Tour', date_time: futureSlot, status: 'pending' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 1, qty_discounted: 0 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not available/i);
  });

  it('400 : rejects booking when no slot is available', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', title: 'Test Tour', date_time: null, status: 'approved' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 1, qty_discounted: 0 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /no available time slot/i);
  });

  it('500 : database error on booking create', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', title: 'Test Tour', date_time: futureSlot, status: 'approved' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    mockBooking.create.mock.mockImplementationOnce(async () => { throw new Error('DB connection failed'); });
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 1 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Server error');
  });
});

describe('getBookings()', () => {
  beforeEach(resetMocks);

  it('200 : returns bookings with parsed meeting link only for confirmed', async () => {
    const fakeBookings = [
      { id: 1, visitor_id: 42, status: 'confirmed', meeting_link: JSON.stringify({ platform: 'Zoom', link: 'https://zoom.us/j/123', password: '1111' }) },
      { id: 2, visitor_id: 42, status: 'pending', meeting_link: 'https://meet.google.com/raw-link' },
    ];
    mockBooking.findByVisitor.mock.mockImplementationOnce(async () => fakeBookings);
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await getBookings(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const response = res.json.mock.calls[0].arguments[0];
    assert.equal(response[0].meeting_link, 'https://zoom.us/j/123');
    assert.equal(response[0].meeting_config.password, '1111');
    assert.equal(response[1].meeting_link, null);
    assert.equal(response[1].meeting_config, null);
  });

  it('500 : database error', async () => {
    mockBooking.findByVisitor.mock.mockImplementationOnce(async () => { throw new Error('DB error'); });
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await getBookings(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Server error');
  });
});

describe('getBookingById()', () => {
  beforeEach(resetMocks);

  it('200 : returns booking when found and owned by visitor', async () => {
    const fakeBooking = { id: 1, visitor_id: 42, status: 'confirmed', meeting_link: JSON.stringify({ platform: 'WhatsApp', link: 'https://wa.me/111222333', password: null }) };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockRefund.findByBookingId.mock.mockImplementationOnce(async () => null);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => []);
    const req = makeReq({}, { id: 1 }, {}, 42);
    const res = makeRes();
    await getBookingById(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].meeting_link, 'https://wa.me/111222333');
    assert.equal(res.json.mock.calls[0].arguments[0].meeting_config.platform, 'WhatsApp');
  });

  it('403 : booking belongs to a different visitor', async () => {
    const fakeBooking = { id: 1, visitor_id: 99 };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    const req = makeReq({}, { id: 1 }, {}, 42);
    const res = makeRes();
    await getBookingById(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Forbidden');
  });

  it('404 : booking not found', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => null);
    const req = makeReq({}, { id: 999 }, {}, 42);
    const res = makeRes();
    await getBookingById(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Booking not found');
  });

  it('500 : database error', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => { throw new Error('DB error'); });
    const req = makeReq({}, { id: 1 }, {}, 42);
    const res = makeRes();
    await getBookingById(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Server error');
  });
});

describe('rescheduleBooking()', () => {
  beforeEach(resetMocks);

  it('200 : reschedules booking successfully', async () => {
    const fakeBooking = { id: 1, visitor_id: 42, experience_id: 2, status: 'rescheduled' };
    mockBooking.reschedule.mock.mockImplementationOnce(async () => fakeBooking);
    const req = makeReq({ new_experience_id: 2 }, { id: 1 }, {}, 42);
    const res = makeRes();
    await rescheduleBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Booking rescheduled successfully');
    assert.deepEqual(res.json.mock.calls[0].arguments[0].booking, fakeBooking);
  });

  it('400 : missing new_experience_id', async () => {
    const req = makeReq({}, { id: 1 }, {}, 42);
    const res = makeRes();
    await rescheduleBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'new_experience_id is required');
  });

  it('401 : no visitor id on request', async () => {
    const req = makeReq({ new_experience_id: 2 }, { id: 1 }, {}, null);
    const res = makeRes();
    await rescheduleBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Unauthorised');
  });

  it('404 : booking not found or not owned by visitor', async () => {
    mockBooking.reschedule.mock.mockImplementationOnce(async () => null);
    const req = makeReq({ new_experience_id: 2 }, { id: 999 }, {}, 42);
    const res = makeRes();
    await rescheduleBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Booking not found or not yours');
  });

  it('500 : database error', async () => {
    mockBooking.reschedule.mock.mockImplementationOnce(async () => { throw new Error('DB error'); });
    const req = makeReq({ new_experience_id: 2 }, { id: 1 }, {}, 42);
    const res = makeRes();
    await rescheduleBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Server error');
  });
});

describe('createPaymentSession()', () => {
  beforeEach(resetMocks);

  it('200 : returns stripe checkout session url', async () => {
    const fakeBooking = { id: 1, visitor_id: 42, experience_id: 1, amount_paid: 50 };
    const fakeExperience = { id: 1, title: 'Test Tour' };
    const fakeSession = { url: 'https://checkout.stripe.com/session123' };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    fakeStripeClient.checkout.sessions.create.mock.mockImplementationOnce(async () => fakeSession);
    const req = makeReq({ booking_id: 1 }, {}, {}, 42);
    const res = makeRes();
    await createPaymentSession(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].url, fakeSession.url);
  });

  it('400 : missing booking_id', async () => {
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await createPaymentSession(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'booking_id is required');
  });

  it('403 : booking belongs to a different visitor', async () => {
    const fakeBooking = { id: 1, visitor_id: 99, experience_id: 1, amount_paid: 50 };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    const req = makeReq({ booking_id: 1 }, {}, {}, 42);
    const res = makeRes();
    await createPaymentSession(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Forbidden');
  });

  it('404 : booking not found', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => null);
    const req = makeReq({ booking_id: 999 }, {}, {}, 42);
    const res = makeRes();
    await createPaymentSession(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Booking not found');
  });

  it('404 : experience not found', async () => {
    const fakeBooking = { id: 1, visitor_id: 42, experience_id: 1, amount_paid: 50 };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockExperience.findById.mock.mockImplementationOnce(async () => null);
    const req = makeReq({ booking_id: 1 }, {}, {}, 42);
    const res = makeRes();
    await createPaymentSession(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Experience not found');
  });

  it('500 : stripe error', async () => {
    const fakeBooking = { id: 1, visitor_id: 42, experience_id: 1, amount_paid: 50 };
    const fakeExperience = { id: 1, title: 'Test Tour' };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    fakeStripeClient.checkout.sessions.create.mock.mockImplementationOnce(async () => { throw new Error('Stripe error'); });
    const req = makeReq({ booking_id: 1 }, {}, {}, 42);
    const res = makeRes();
    await createPaymentSession(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Server error');
  });
});

describe('createPayPalOrder()', () => {
  beforeEach(resetMocks);

  it('200 : returns paypal order id', async () => {
    const fakeBooking = { id: 1, visitor_id: 42, amount_paid: 50 };
    const fakeResponse = { result: { id: 'ORDER123', status: 'CREATED', links: [] } };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    fakePayPalClient.execute.mock.mockImplementationOnce(async () => fakeResponse);
    const req = makeReq({ booking_id: 1 }, {}, {}, 42);
    const res = makeRes();
    await createPayPalOrder(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].id, 'ORDER123');
  });

  it('403 : booking not found or not owned by visitor', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => null);
    const req = makeReq({ booking_id: 999 }, {}, {}, 42);
    const res = makeRes();
    await createPayPalOrder(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Forbidden');
  });

  it('500 : paypal error', async () => {
    const fakeBooking = { id: 1, visitor_id: 42, amount_paid: 50 };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    fakePayPalClient.execute.mock.mockImplementationOnce(async () => { throw new Error('PayPal error'); });
    const req = makeReq({ booking_id: 1 }, {}, {}, 42);
    const res = makeRes();
    await createPayPalOrder(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'PayPal Order Error');
  });
});

describe('captureStripePayment()', () => {
  beforeEach(resetMocks);

  it('200 : records payment and confirms booking', async () => {
    const fakeSession = {
      payment_status: 'paid',
      metadata: { booking_id: '1' },
      amount_total: 5000,
      payment_intent: 'pi_test_123',
    };
    fakeStripeClient.checkout.sessions.retrieve.mock.mockImplementationOnce(async () => fakeSession);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => []);
    mockPayment.create.mock.mockImplementationOnce(async () => {});
    mockBooking.updateStatus.mock.mockImplementationOnce(async () => {});
    const req = makeReq({ session_id: 'cs_test_123' }, {}, {}, 42);
    const res = makeRes();
    await captureStripePayment(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Stripe payment successful and recorded');
  });

  it('200 : payment already captured', async () => {
    const fakeSession = {
      payment_status: 'paid',
      metadata: { booking_id: '1' },
      amount_total: 5000,
      payment_intent: 'pi_test_123',
    };
    fakeStripeClient.checkout.sessions.retrieve.mock.mockImplementationOnce(async () => fakeSession);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => [{ id: 1 }]);
    const req = makeReq({ session_id: 'cs_test_123' }, {}, {}, 42);
    const res = makeRes();
    await captureStripePayment(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Payment already captured');
  });

  it('400 : missing session_id', async () => {
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await captureStripePayment(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'session_id is required');
  });

  it('400 : payment not completed yet', async () => {
    const fakeSession = { payment_status: 'unpaid', metadata: { booking_id: '1' } };
    fakeStripeClient.checkout.sessions.retrieve.mock.mockImplementationOnce(async () => fakeSession);
    const req = makeReq({ session_id: 'cs_test_123' }, {}, {}, 42);
    const res = makeRes();
    await captureStripePayment(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Payment not completed yet');
  });

  it('500 : stripe retrieve error', async () => {
    fakeStripeClient.checkout.sessions.retrieve.mock.mockImplementationOnce(async () => { throw new Error('Stripe error'); });
    const req = makeReq({ session_id: 'cs_test_123' }, {}, {}, 42);
    const res = makeRes();
    await captureStripePayment(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Stripe Capture Error');
  });
});

describe('capturePayPalOrder()', () => {
  beforeEach(resetMocks);

  it('200 : captures paypal order and confirms booking', async () => {
    const fakeResponse = {
      result: {
        status: 'COMPLETED',
        purchase_units: [{
          payments: {
            captures: [{ id: 'capture_123', amount: { value: '50.00' } }],
          },
        }],
      },
    };
    fakePayPalClient.execute.mock.mockImplementationOnce(async () => fakeResponse);
    mockPayment.create.mock.mockImplementationOnce(async () => {});
    mockBooking.updateStatus.mock.mockImplementationOnce(async () => {});
    const req = makeReq({ orderID: 'ORDER123', booking_id: 1 }, {}, {}, 42);
    const res = makeRes();
    await capturePayPalOrder(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].status, 'success');
  });

  it('400 : payment incomplete', async () => {
    const fakeResponse = { result: { status: 'PENDING', purchase_units: [] } };
    fakePayPalClient.execute.mock.mockImplementationOnce(async () => fakeResponse);
    const req = makeReq({ orderID: 'ORDER123', booking_id: 1 }, {}, {}, 42);
    const res = makeRes();
    await capturePayPalOrder(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Payment incomplete');
  });

  it('500 : paypal capture error', async () => {
    fakePayPalClient.execute.mock.mockImplementationOnce(async () => { throw new Error('PayPal error'); });
    const req = makeReq({ orderID: 'ORDER123', booking_id: 1 }, {}, {}, 42);
    const res = makeRes();
    await capturePayPalOrder(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'PayPal Capture Error');
  });
});

describe('refundBooking()', () => {
  beforeEach(resetMocks);

  it('200 : submits 100% refund request when >= 14 days before event', async () => {
    const eventDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
    const fakeBooking = { id: 1, visitor_id: 42, status: 'confirmed', experience_id: 1, amount_paid: 100 };
    const fakeExperience = { id: 1, date_time: eventDate };
    const fakePayment = { id: 1, method: 'stripe', transaction_id: 'pi_test_123', amount: '100.00' };
    const fakeRefund = { id: 1, refund_percentage: 100, status: 'approved' };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockRefund.findByBookingId.mock.mockImplementationOnce(async () => null);
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => [fakePayment]);
    fakeStripeClient.refunds.create.mock.mockImplementationOnce(async () => ({ id: 'refund_123' }));
    mockRefund.create.mock.mockImplementationOnce(async () => fakeRefund);
    mockBooking.updateStatus.mock.mockImplementationOnce(async () => {});
    const req = makeReq({ reason: 'Change of plans' }, { id: 1 }, {}, 42);
    const res = makeRes();
    await refundBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Refund processed successfully');
  });

  it('200 : submits 50% refund request when >= 7 and < 14 days before event', async () => {
    const eventDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const fakeBooking = { id: 1, visitor_id: 42, status: 'confirmed', experience_id: 1, amount_paid: 100 };
    const fakeExperience = { id: 1, date_time: eventDate };
    const fakePayment = { id: 1, method: 'stripe', transaction_id: 'pi_test_123', amount: '100.00' };
    const fakeRefund = { id: 1, refund_percentage: 50, status: 'approved' };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockRefund.findByBookingId.mock.mockImplementationOnce(async () => null);
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => [fakePayment]);
    fakeStripeClient.refunds.create.mock.mockImplementationOnce(async () => ({ id: 'refund_456' }));
    mockRefund.create.mock.mockImplementationOnce(async () => fakeRefund);
    mockBooking.updateStatus.mock.mockImplementationOnce(async () => {});
    const req = makeReq({ reason: 'Change of plans' }, { id: 1 }, {}, 42);
    const res = makeRes();
    await refundBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Refund processed successfully');
  });

  it('200 : rejects refund when < 7 days before event', async () => {
    const eventDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const fakeBooking = { id: 1, visitor_id: 42, status: 'confirmed', experience_id: 1, amount_paid: 100 };
    const fakeExperience = { id: 1, date_time: eventDate };
    const fakePayment = { id: 1, method: 'stripe', transaction_id: 'pi_test_123', amount: '100.00' };
    const fakeRefund = { id: 1, refund_percentage: 0, status: 'rejected' };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockRefund.findByBookingId.mock.mockImplementationOnce(async () => null);
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => [fakePayment]);
    mockRefund.create.mock.mockImplementationOnce(async () => fakeRefund);
    const req = makeReq({ reason: 'Change of plans' }, { id: 1 }, {}, 42);
    const res = makeRes();
    await refundBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.match(res.json.mock.calls[0].arguments[0].message, /No refund available/);
  });

  it('400 : missing or empty refund reason', async () => {
    const fakeBooking = { id: 1, visitor_id: 42, status: 'confirmed', experience_id: 1 };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockRefund.findByBookingId.mock.mockImplementationOnce(async () => null);
    const req = makeReq({ reason: '' }, { id: 1 }, {}, 42);
    const res = makeRes();
    await refundBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Reason is required');
  });

  it('400 : refund request already exists', async () => {
    const fakeBooking = { id: 1, visitor_id: 42, status: 'confirmed', experience_id: 1 };
    const existingRefund = { id: 1, booking_id: 1 };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockRefund.findByBookingId.mock.mockImplementationOnce(async () => existingRefund);
    const req = makeReq({ reason: 'Change of plans' }, { id: 1 }, {}, 42);
    const res = makeRes();
    await refundBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Refund already requested for this booking');
  });

  it('401 : no visitor id on request', async () => {
    const req = makeReq({ reason: 'Change of plans' }, { id: 1 }, {}, null);
    const res = makeRes();
    await refundBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Unauthorised');
  });

  it('404 : booking not found or not owned by visitor', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => null);
    const req = makeReq({ reason: 'Change of plans' }, { id: 999 }, {}, 42);
    const res = makeRes();
    await refundBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Booking not found');
  });

  it('500 : database error', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => { throw new Error('DB error'); });
    const req = makeReq({ reason: 'Change of plans' }, { id: 1 }, {}, 42);
    const res = makeRes();
    await refundBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'Refund Error');
  });
});

describe('getMe()', () => {
  beforeEach(resetMocks);

  it('returns visitor profile', async () => {
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await getMe(req, res);
    assert.equal(res.status.mock.calls.length, 0);
  });
});

describe('getExperiences()', () => {
  beforeEach(resetMocks);

  it('returns list of available experiences', async () => {
    const fakeExperiences = [{ id: 1, title: 'Tour A' }, { id: 2, title: 'Tour B' }];
    mockExperience.findAll.mock.mockImplementationOnce(async () => fakeExperiences);
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await getExperiences(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], fakeExperiences);
  });
});

describe('getExperienceById()', () => {
  beforeEach(resetMocks);

  it('returns a single experience by id', async () => {
    const fakeExperience = { id: 1, title: 'Tour A' };
    mockExperience.findByIdWithHost.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq({}, { id: 1 }, {}, 42);
    const res = makeRes();
    await getExperienceById(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], fakeExperience);
  });
});

describe('createReview()', () => {
  beforeEach(resetMocks);

  it('creates a review for a booking', async () => {
    const req = makeReq({ booking_id: 1, rating: 5, comment: 'Great!' }, {}, {}, 42);
    const res = makeRes();
    await createReview(req, res);
    assert.equal(res.status.mock.calls.length, 0);
  });
});
