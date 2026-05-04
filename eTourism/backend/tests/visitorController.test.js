'use strict';

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const fakePool = { query: mock.fn(async () => ({ rows: [] })), end: mock.fn() };
require.cache[path.resolve(__dirname, '../config/db.js')] = {
  id: path.resolve(__dirname, '../config/db.js'),
  filename: path.resolve(__dirname, '../config/db.js'),
  loaded: true,
  exports: fakePool,
  children: [],
  paths: [],
};

const mockBooking = {
  create: mock.fn(),
  findByVisitor: mock.fn(),
  findById: mock.fn(),
  reschedule: mock.fn(),
  updateStatus: mock.fn(),
  getRefundContext: mock.fn(),
  findActiveByVisitorAndExperience: mock.fn(async () => null),
};
require.cache[path.resolve(__dirname, '../models/Booking.js')] = {
  id: path.resolve(__dirname, '../models/Booking.js'),
  filename: path.resolve(__dirname, '../models/Booking.js'),
  loaded: true,
  exports: mockBooking,
  children: [],
  paths: [],
};

const mockExperience = { findById: mock.fn(), findByIdWithHost: mock.fn(), findAll: mock.fn(), findByHost: mock.fn(async () => []) };
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

const mockFollow = {
  create: mock.fn(),
  remove: mock.fn(),
  exists: mock.fn(async () => false),
  countForHost: mock.fn(async () => 0),
  listForVisitor: mock.fn(async () => []),
};
require.cache[path.resolve(__dirname, '../models/Follow.js')] = {
  id: path.resolve(__dirname, '../models/Follow.js'),
  filename: path.resolve(__dirname, '../models/Follow.js'),
  loaded: true,
  exports: mockFollow,
  children: [],
  paths: [],
};

const mockUser = {
  findById: mock.fn(async () => null),
  findByEmail: mock.fn(),
  create: mock.fn(),
  update: mock.fn(),
  findAll: mock.fn(),
  updateStatus: mock.fn(),
  updateRole: mock.fn(),
  deleteUser: mock.fn(),
};
require.cache[path.resolve(__dirname, '../models/User.js')] = {
  id: path.resolve(__dirname, '../models/User.js'),
  filename: path.resolve(__dirname, '../models/User.js'),
  loaded: true,
  exports: mockUser,
  children: [],
  paths: [],
};

const mockReview = {
  create: mock.fn(),
  upsert: mock.fn(async () => ({ review: { id: 1 }, updated: false })),
  findByBookingId: mock.fn(async () => null),
  findByExperience: mock.fn(),
};
require.cache[path.resolve(__dirname, '../models/Review.js')] = {
  id: path.resolve(__dirname, '../models/Review.js'),
  filename: path.resolve(__dirname, '../models/Review.js'),
  loaded: true,
  exports: mockReview,
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
  updateMe,
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
  followHost,
  unfollowHost,
  getFollowStatus,
  listFollows,
  getEhostPublicProfile,
  getReviews,
  getRefundStatus,
} = require('../controllers/visitorController');

function makeRes() {
  const res = {};
  res.status = mock.fn(() => res);
  res.json = mock.fn(() => res);
  return res;
}

function makeReq(body = {}, params = {}, query = {}, userId = null) {
  return { body, params, query, userId, headers: {} };
}

function resetMocks() {
  fakePool.query.mock.resetCalls();
  fakePool.query.mock.mockImplementation(async () => ({ rows: [] }));
  mockBooking.create.mock.resetCalls();
  mockBooking.findByVisitor.mock.resetCalls();
  mockBooking.findById.mock.resetCalls();
  mockBooking.reschedule.mock.resetCalls();
  mockBooking.updateStatus.mock.resetCalls();
  mockBooking.getRefundContext.mock.resetCalls();
  mockBooking.findActiveByVisitorAndExperience.mock.resetCalls();
  mockBooking.findActiveByVisitorAndExperience.mock.mockImplementation(async () => null);
  mockExperience.findById.mock.resetCalls();
  mockExperience.findByIdWithHost.mock.resetCalls();
  mockExperience.findAll.mock.resetCalls();
  mockExperience.findByHost.mock.resetCalls();
  mockExperience.findByHost.mock.mockImplementation(async () => []);
  mockPayment.create.mock.resetCalls();
  mockPayment.findByBooking.mock.resetCalls();
  mockRefund.create.mock.resetCalls();
  mockRefund.findByBookingId.mock.resetCalls();
  mockFollow.create.mock.resetCalls();
  mockFollow.remove.mock.resetCalls();
  mockFollow.exists.mock.resetCalls();
  mockFollow.countForHost.mock.resetCalls();
  mockFollow.listForVisitor.mock.resetCalls();
  mockUser.findById.mock.resetCalls();
  mockUser.findById.mock.mockImplementation(async () => null);
  mockUser.findByEmail.mock.resetCalls();
  mockUser.create.mock.resetCalls();
  mockUser.update.mock.resetCalls();
  mockReview.create.mock.resetCalls();
  mockReview.upsert.mock.resetCalls();
  mockReview.upsert.mock.mockImplementation(async () => ({ review: { id: 1 }, updated: false }));
  mockReview.findByBookingId.mock.resetCalls();
  mockReview.findByBookingId.mock.mockImplementation(async () => null);
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

  it('400 : qty_normal exceeds max_visitors (normal-ticket cap)', async () => {
    const fakeExperience = { id: 1, max_visitors: 2, price: '50.00', title: 'Test Tour', date_time: futureSlot, status: 'approved' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 3 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /normal-ticket spot/i);
  });

  it('400 : qty_discounted exceeds max_piggyback_visitors (piggyback cap)', async () => {
    const fakeExperience = {
      id: 1,
      max_visitors: 10,
      max_piggyback_visitors: 1,
      allows_piggyback: true,
      price: '50.00',
      price_discounted: '40.00',
      title: 'Test Tour',
      date_time: futureSlot,
      status: 'approved',
    };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 0, qty_discounted: 2 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /watch-only spot/i);
  });

  it('400 : duplicate booking blocked when active booking already exists', async () => {
    const fakeExperience = { id: 1, max_visitors: 10, price: '50.00', title: 'Test Tour', date_time: futureSlot, status: 'approved' };
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    mockBooking.findActiveByVisitorAndExperience.mock.mockImplementationOnce(async () => ({ id: 7, status: 'confirmed' }));
    const req = makeReq(
      { experience_id: 1, agreed_to_terms: true, qty_normal: 1 },
      {}, {}, 42
    );
    const res = makeRes();
    await createBooking(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already have a booking/i);
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

  it('200 : returns bookings with experience meeting link only for confirmed', async () => {
    const fakeBookings = [
      { id: 1, visitor_id: 42, status: 'confirmed', meeting_link: 'https://zoom.us/j/123' },
      { id: 2, visitor_id: 42, status: 'pending', meeting_link: 'https://meet.google.com/raw-link' },
    ];
    mockBooking.findByVisitor.mock.mockImplementationOnce(async () => fakeBookings);
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await getBookings(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const response = res.json.mock.calls[0].arguments[0];
    assert.equal(response[0].meeting_link, 'https://zoom.us/j/123');
    assert.equal(response[0].meeting_config.link, 'https://zoom.us/j/123');
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
    const fakeBooking = { id: 1, visitor_id: 42, status: 'confirmed', meeting_link: 'https://wa.me/111222333' };
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockRefund.findByBookingId.mock.mockImplementationOnce(async () => null);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => []);
    const req = makeReq({}, { id: 1 }, {}, 42);
    const res = makeRes();
    await getBookingById(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].meeting_link, 'https://wa.me/111222333');
    assert.equal(res.json.mock.calls[0].arguments[0].meeting_config.link, 'https://wa.me/111222333');
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
    const fakeBooking = { id: 1, experience_id: 9, status: 'confirmed' };
    const fakeExperience = { id: 9, title: 'Tour A' };
    fakeStripeClient.checkout.sessions.retrieve.mock.mockImplementationOnce(async () => fakeSession);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => []);
    mockPayment.create.mock.mockImplementationOnce(async () => {});
    mockBooking.updateStatus.mock.mockImplementationOnce(async () => {});
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq({ session_id: 'cs_test_123' }, {}, {}, 42);
    const res = makeRes();
    await captureStripePayment(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].status, 'success');
    assert.deepEqual(res.json.mock.calls[0].arguments[0].booking, fakeBooking);
  });

  it('200 : payment already captured', async () => {
    const fakeSession = {
      payment_status: 'paid',
      metadata: { booking_id: '1' },
      amount_total: 5000,
      payment_intent: 'pi_test_123',
    };
    const fakeBooking = { id: 1, experience_id: 9, status: 'confirmed' };
    const fakeExperience = { id: 9, title: 'Tour A' };
    fakeStripeClient.checkout.sessions.retrieve.mock.mockImplementationOnce(async () => fakeSession);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => [{ id: 1 }]);
    mockBooking.findById.mock.mockImplementationOnce(async () => fakeBooking);
    mockExperience.findById.mock.mockImplementationOnce(async () => fakeExperience);
    const req = makeReq({ session_id: 'cs_test_123' }, {}, {}, 42);
    const res = makeRes();
    await captureStripePayment(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].status, 'success');
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
    assert.match(res.json.mock.calls[0].arguments[0].message, /Refund request submitted/i);
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
    assert.match(res.json.mock.calls[0].arguments[0].message, /Refund request submitted/i);
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
    const fakeUser = { id: 42, email: 'a@b.com', first_name: 'Alice' };
    mockUser.findById.mock.mockImplementationOnce(async () => fakeUser);
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await getMe(req, res);
    assert.equal(res.status.mock.calls.length, 0);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], fakeUser);
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

  it('creates a review for an attended experience', async () => {
    fakePool.query.mock.mockImplementationOnce(async () => ({ rows: [{ id: 99 }] })); // eligibility check
    const req = makeReq({ experience_id: 1, rating: 5, comment: 'Great!' }, {}, {}, 42);
    const res = makeRes();
    await createReview(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    assert.equal(mockReview.upsert.mock.callCount(), 1);
  });

  it('403 : not eligible (never attended)', async () => {
    fakePool.query.mock.mockImplementationOnce(async () => ({ rows: [] }));
    const req = makeReq({ experience_id: 1, rating: 5 }, {}, {}, 42);
    const res = makeRes();
    await createReview(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 403);
  });

  it('400 : invalid rating', async () => {
    const req = makeReq({ experience_id: 1, rating: 9 }, {}, {}, 42);
    const res = makeRes();
    await createReview(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });
});

describe('updateMe()', () => {
  beforeEach(resetMocks);

  it('200 : updates editable fields', async () => {
    mockUser.update.mock.mockImplementationOnce(async () => ({ id: 42, first_name: 'Alice', last_name: 'B', display_name: 'AliB' }));
    const req = makeReq({ first_name: 'Alice', last_name: 'B', display_name: 'AliB' }, {}, {}, 42);
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(mockUser.update.mock.callCount(), 1);
    assert.deepEqual(mockUser.update.mock.calls[0].arguments[0], 42);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], { id: 42, first_name: 'Alice', last_name: 'B', display_name: 'AliB' });
  });

  it('400 : no editable fields supplied', async () => {
    const req = makeReq({ password: 'hack' }, {}, {}, 42);
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('400 : empty first_name rejected', async () => {
    const req = makeReq({ first_name: '   ' }, {}, {}, 42);
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('400 : empty last_name rejected', async () => {
    const req = makeReq({ last_name: '' }, {}, {}, 42);
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('clears display_name when blank', async () => {
    mockUser.update.mock.mockImplementationOnce(async () => ({ id: 42, display_name: null }));
    const req = makeReq({ display_name: '' }, {}, {}, 42);
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(mockUser.update.mock.calls[0].arguments[1].display_name, null);
  });

  it('404 : user not found', async () => {
    mockUser.update.mock.mockImplementationOnce(async () => null);
    const req = makeReq({ first_name: 'Alice' }, {}, {}, 42);
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });
});

describe('followHost()', () => {
  beforeEach(resetMocks);

  it('201 : creates a follow row and returns count', async () => {
    mockUser.findById.mock.mockImplementationOnce(async () => ({ id: 7, role: 'ehost' }));
    mockFollow.create.mock.mockImplementationOnce(async () => ({ visitor_id: 42, ehost_id: 7 }));
    mockFollow.countForHost.mock.mockImplementationOnce(async () => 12);
    const req = makeReq({ ehost_id: 7 }, {}, {}, 42);
    const res = makeRes();
    await followHost(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], { following: true, followers_count: 12 });
  });

  it('400 : missing ehost_id', async () => {
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await followHost(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('400 : cannot follow yourself', async () => {
    const req = makeReq({ ehost_id: 42 }, {}, {}, 42);
    const res = makeRes();
    await followHost(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].error, /yourself/i);
  });

  it('404 : target user not found', async () => {
    mockUser.findById.mock.mockImplementationOnce(async () => null);
    const req = makeReq({ ehost_id: 99 }, {}, {}, 42);
    const res = makeRes();
    await followHost(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('404 : target is not an ehost', async () => {
    mockUser.findById.mock.mockImplementationOnce(async () => ({ id: 8, role: 'visitor' }));
    const req = makeReq({ ehost_id: 8 }, {}, {}, 42);
    const res = makeRes();
    await followHost(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });
});

describe('unfollowHost()', () => {
  beforeEach(resetMocks);

  it('200 : removes follow and returns updated count', async () => {
    mockFollow.countForHost.mock.mockImplementationOnce(async () => 4);
    const req = makeReq({}, { ehostId: 7 }, {}, 42);
    const res = makeRes();
    await unfollowHost(req, res);
    assert.equal(mockFollow.remove.mock.callCount(), 1);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], { following: false, followers_count: 4 });
  });

  it('400 : invalid ehost id', async () => {
    const req = makeReq({}, { ehostId: 'abc' }, {}, 42);
    const res = makeRes();
    await unfollowHost(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });
});

describe('getFollowStatus()', () => {
  beforeEach(resetMocks);

  it('200 : returns count and follow flag for logged-in visitor', async () => {
    mockFollow.countForHost.mock.mockImplementationOnce(async () => 9);
    mockFollow.exists.mock.mockImplementationOnce(async () => true);
    const req = makeReq({}, { ehostId: 7 }, {}, 42);
    const res = makeRes();
    await getFollowStatus(req, res);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], { following: true, followers_count: 9 });
  });

  it('200 : following=false for anonymous viewer', async () => {
    mockFollow.countForHost.mock.mockImplementationOnce(async () => 9);
    const req = makeReq({}, { ehostId: 7 }, {}, null);
    const res = makeRes();
    await getFollowStatus(req, res);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], { following: false, followers_count: 9 });
  });

  it('400 : invalid ehost id', async () => {
    const req = makeReq({}, { ehostId: '0' }, {}, 42);
    const res = makeRes();
    await getFollowStatus(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });
});

describe('listFollows()', () => {
  beforeEach(resetMocks);

  it('returns rows from Follow.listForVisitor', async () => {
    const rows = [
      { ehost_id: 1, first_name: 'Alice', next_experience_id: 5 },
      { ehost_id: 2, first_name: 'Bob',   next_experience_id: null },
    ];
    mockFollow.listForVisitor.mock.mockImplementationOnce(async () => rows);
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await listFollows(req, res);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], rows);
  });

  it('500 on model failure', async () => {
    mockFollow.listForVisitor.mock.mockImplementationOnce(async () => { throw new Error('DB fail'); });
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await listFollows(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getEhostPublicProfile()', () => {
  beforeEach(resetMocks);

  // The brief requires eHost listings to be anonymous: real first_name must
  // never leak when display_name is missing. The fallback should be 'Host'.
  it('falls back to "Host" instead of first_name when display_name is missing', async () => {
    mockUser.findById.mock.mockImplementationOnce(async () => ({
      id: 7, role: 'ehost', status: 'active',
      first_name: 'Alice', last_name: 'Real', display_name: null,
      profile_image: null, bio: null, country: 'UK',
    }));
    mockFollow.countForHost.mock.mockImplementationOnce(async () => 0);

    const req = makeReq({}, { ehostId: 7 }, {}, 99);
    const res = makeRes();
    await getEhostPublicProfile(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.profile.display_name, 'Host');
    assert.ok(!('first_name' in body.profile));
  });

  it('uses display_name when present', async () => {
    mockUser.findById.mock.mockImplementationOnce(async () => ({
      id: 7, role: 'ehost', status: 'active',
      first_name: 'Alice', last_name: 'Real', display_name: 'Wanderer',
      profile_image: null, bio: null, country: 'UK',
    }));
    mockFollow.countForHost.mock.mockImplementationOnce(async () => 3);

    const req = makeReq({}, { ehostId: 7 }, {}, 99);
    const res = makeRes();
    await getEhostPublicProfile(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.profile.display_name, 'Wanderer');
  });
});

describe('getReviews()', () => {
  beforeEach(resetMocks);

  it('200 : returns reviews for an experience', async () => {
    const reviews = [{ id: 1, rating: 5 }];
    mockReview.findByExperience.mock.mockImplementationOnce(async () => reviews);
    const req = makeReq({}, {}, { experience_id: 1 }, 42);
    const res = makeRes();
    await getReviews(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], reviews);
  });

  it('400 : missing experience_id query param', async () => {
    const req = makeReq({}, {}, {}, 42);
    const res = makeRes();
    await getReviews(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });
});

describe('getRefundStatus()', () => {
  beforeEach(resetMocks);

  it('200 : returns refund details when refund exists', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => ({ id: 1, visitor_id: 42, status: 'refund_pending' }));
    mockRefund.findByBookingId.mock.mockImplementationOnce(async () => ({ id: 9, status: 'pending', refund_amount: 50, refund_percentage: 100 }));
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => [{ id: 11, method: 'stripe' }]);
    const req = makeReq({}, { id: '1' }, {}, 42);
    const res = makeRes();
    await getRefundStatus(req, res);
    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.has_refund, true);
    assert.equal(body.refund_amount, 50);
  });

  it('200 : has_refund false when no refund row', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => ({ id: 1, visitor_id: 42, status: 'confirmed' }));
    mockRefund.findByBookingId.mock.mockImplementationOnce(async () => null);
    mockPayment.findByBooking.mock.mockImplementationOnce(async () => []);
    const req = makeReq({}, { id: '1' }, {}, 42);
    const res = makeRes();
    await getRefundStatus(req, res);
    assert.equal(res.json.mock.calls[0].arguments[0].has_refund, false);
  });

  it('404 : booking not found', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => null);
    const req = makeReq({}, { id: '999' }, {}, 42);
    const res = makeRes();
    await getRefundStatus(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('403 : booking owned by another visitor', async () => {
    mockBooking.findById.mock.mockImplementationOnce(async () => ({ id: 1, visitor_id: 99 }));
    const req = makeReq({}, { id: '1' }, {}, 42);
    const res = makeRes();
    await getRefundStatus(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 403);
  });
});
