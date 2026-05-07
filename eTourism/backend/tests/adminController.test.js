'use strict';

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const fakePool = { query: mock.fn(), end: mock.fn() };
require.cache[path.resolve(__dirname, '../config/db.js')] = {
  id: path.resolve(__dirname, '../config/db.js'),
  filename: path.resolve(__dirname, '../config/db.js'),
  loaded: true,
  exports: fakePool,
  children: [],
  paths: [],
};

const mockUser = {
  findByEmail: mock.fn(),
  create: mock.fn(),
  findAll: mock.fn(),
  findById: mock.fn(),
  update: mock.fn(),
  delete: mock.fn(),
};
require.cache[path.resolve(__dirname, '../models/User.js')] = {
  id: path.resolve(__dirname, '../models/User.js'),
  filename: path.resolve(__dirname, '../models/User.js'),
  loaded: true,
  exports: mockUser,
  children: [],
  paths: [],
};

const fakeBcrypt = { hash: mock.fn() };
require.cache[require.resolve('bcrypt')] = {
  id: require.resolve('bcrypt'),
  filename: require.resolve('bcrypt'),
  loaded: true,
  exports: fakeBcrypt,
  children: [],
  paths: [],
};

const mockExperience = { findAll: mock.fn(), update: mock.fn(), delete: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Experience.js')] = {
  id: path.resolve(__dirname, '../models/Experience.js'),
  filename: path.resolve(__dirname, '../models/Experience.js'),
  loaded: true,
  exports: mockExperience,
  children: [],
  paths: [],
};

const mockUserAgreement = { findByUser: mock.fn(), create: mock.fn() };
require.cache[path.resolve(__dirname, '../models/UserAgreement.js')] = {
  id: path.resolve(__dirname, '../models/UserAgreement.js'),
  filename: path.resolve(__dirname, '../models/UserAgreement.js'),
  loaded: true,
  exports: mockUserAgreement,
  children: [],
  paths: [],
};

const mockBooking = { findAll: mock.fn(), updateStatus: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Booking.js')] = {
  id: path.resolve(__dirname, '../models/Booking.js'),
  filename: path.resolve(__dirname, '../models/Booking.js'),
  loaded: true,
  exports: mockBooking,
  children: [],
  paths: [],
};

const mockExperienceScore = { create: mock.fn(), findByExperience: mock.fn() };
require.cache[path.resolve(__dirname, '../models/ExperienceScore.js')] = {
  id: path.resolve(__dirname, '../models/ExperienceScore.js'),
  filename: path.resolve(__dirname, '../models/ExperienceScore.js'),
  loaded: true,
  exports: mockExperienceScore,
  children: [],
  paths: [],
};

const mockRefund = { findById: mock.fn(), updateStatus: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Refund.js')] = {
  id: path.resolve(__dirname, '../models/Refund.js'),
  filename: path.resolve(__dirname, '../models/Refund.js'),
  loaded: true,
  exports: mockRefund,
  children: [],
  paths: [],
};

const mockPayment = { findByBooking: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Payment.js')] = {
  id: path.resolve(__dirname, '../models/Payment.js'),
  filename: path.resolve(__dirname, '../models/Payment.js'),
  loaded: true,
  exports: mockPayment,
  children: [],
  paths: [],
};

const mockAnalytics = {
  getTopExperiences: mock.fn(),
  getTopHosts: mock.fn(),
  getVisitorCountries: mock.fn(),
  getCategoryBreakdown: mock.fn(),
  getTipsByHost: mock.fn(),
};
require.cache[path.resolve(__dirname, '../models/Analytics.js')] = {
  id: path.resolve(__dirname, '../models/Analytics.js'),
  filename: path.resolve(__dirname, '../models/Analytics.js'),
  loaded: true,
  exports: mockAnalytics,
  children: [],
  paths: [],
};

// stripe: controller does require('stripe')(key) at load time — mock the module as a factory
const fakeStripeClient = { refunds: { create: mock.fn() } };
const fakeStripe = mock.fn(() => fakeStripeClient);
require.cache[require.resolve('stripe')] = {
  id: require.resolve('stripe'),
  filename: require.resolve('stripe'),
  loaded: true,
  exports: fakeStripe,
  children: [],
  paths: [],
};

// paypal: mock the SDK so constructor calls work
const fakePayPalClient = { execute: mock.fn() };
const fakeCheckoutSDK = {
  core: {
    SandboxEnvironment: class {},
    PayPalHttpClient: function () { return fakePayPalClient; },
  },
  payments: {
    CapturesRefundRequest: class { requestBody() {} },
  },
};
require.cache[require.resolve('@paypal/checkout-server-sdk')] = {
  id: require.resolve('@paypal/checkout-server-sdk'),
  filename: require.resolve('@paypal/checkout-server-sdk'),
  loaded: true,
  exports: fakeCheckoutSDK,
  children: [],
  paths: [],
};

const {
  createUser,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getApplications,
  approveApplication,
  rejectApplication,
  getExperiences,
  getAgreement,
  acceptAgreement,
  approveExperience,
  rejectExperience,
  deleteExperience,
  getBookings,
  getAnalytics,
  scoreExperience,
  getExperienceScores,
  getRefunds,
  approveRefund,
  rejectRefund,
} = require('../controllers/adminController');

function makeRes() {
  const res = {};
  res.status = mock.fn(() => res);
  res.json = mock.fn(() => res);
  return res;
}

function makeReq(body = {}, params = {}, query = {}, user = null) {
  const req = { body, params, query };
  if (user) req.user = user;
  return req;
}

function resetMocks() {
  mockUser.findByEmail.mock.resetCalls();
  mockUser.create.mock.resetCalls();
  mockUser.findAll.mock.resetCalls();
  mockUser.findById.mock.resetCalls();
  mockUser.update.mock.resetCalls();
  mockUser.delete.mock.resetCalls();
  mockExperience.findAll.mock.resetCalls();
  mockExperience.update.mock.resetCalls();
  mockExperience.delete.mock.resetCalls();
  mockUserAgreement.findByUser.mock.resetCalls();
  mockUserAgreement.create.mock.resetCalls();
  mockBooking.findAll.mock.resetCalls();
  mockBooking.updateStatus.mock.resetCalls();
  mockExperienceScore.create.mock.resetCalls();
  mockExperienceScore.findByExperience.mock.resetCalls();
  mockRefund.findById.mock.resetCalls();
  mockRefund.updateStatus.mock.resetCalls();
  mockPayment.findByBooking.mock.resetCalls();
  mockAnalytics.getTopExperiences.mock.resetCalls();
  mockAnalytics.getTopHosts.mock.resetCalls();
  mockAnalytics.getVisitorCountries.mock.resetCalls();
  mockAnalytics.getCategoryBreakdown.mock.resetCalls();
  fakeStripeClient.refunds.create.mock.resetCalls();
  fakePayPalClient.execute.mock.resetCalls();
  fakeBcrypt.hash.mock.resetCalls();
  fakePool.query.mock.resetCalls();
  fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));
}

describe('createUser()', () => {
  beforeEach(resetMocks);

  it('201 : creates a user successfully', async () => {
    fakeBcrypt.hash.mock.mockImplementation(async () => 'hashed_pw');
    mockUser.findByEmail.mock.mockImplementation(async () => null);
    mockUser.create.mock.mockImplementation(async () => ({
      id: 5, email: 'admin@test.com', role: 'admin',
      first_name: 'Admin', last_name: 'User',
    }));

    const req = makeReq({
      email: 'admin@test.com', password: 'pass123', role: 'admin',
      first_name: 'Admin', last_name: 'User',
    });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.message, 'User created successfully');
    assert.ok(body.user);
  });

  it('400 : missing required fields', async () => {
    const req = makeReq({ email: 'test@test.com', role: 'visitor' });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /required/i);
  });

  it('400 : invalid role', async () => {
    const req = makeReq({
      email: 'test@test.com', password: 'pass', role: 'superuser',
      first_name: 'A', last_name: 'B',
    });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /role/i);
  });

  it('409 : email already in use', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({ id: 1 }));

    const req = makeReq({
      email: 'exists@test.com', password: 'pass', role: 'visitor',
      first_name: 'A', last_name: 'B',
    });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already in use/i);
  });

  it('500 : database error on create', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => null);
    fakeBcrypt.hash.mock.mockImplementation(async () => 'hashed_pw');
    mockUser.create.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({
      email: 'new@test.com', password: 'pass', role: 'visitor',
      first_name: 'A', last_name: 'B',
    });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getUsers()', () => {
  beforeEach(resetMocks);

  it('200 : returns all users', async () => {
    const users = [
      { id: 1, email: 'a@test.com', role: 'visitor' },
      { id: 2, email: 'b@test.com', role: 'admin' },
    ];
    mockUser.findAll.mock.mockImplementation(async () => users);

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getUsers(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], users);
  });

  it('200 : passes role and status filters to model', async () => {
    mockUser.findAll.mock.mockImplementation(async ({ role, status }) => {
      assert.equal(role, 'admin');
      assert.equal(status, 'active');
      return [];
    });

    const req = makeReq({}, {}, { role: 'admin', status: 'active' });
    const res = makeRes();
    await getUsers(req, res);

    assert.equal(res.json.mock.callCount(), 1);
  });

  it('500 : database error', async () => {
    mockUser.findAll.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getUsers(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getUserById()', () => {
  beforeEach(resetMocks);

  it('200 : returns user when found', async () => {
    const user = { id: 1, email: 'a@test.com', role: 'visitor' };
    mockUser.findById.mock.mockImplementation(async () => user);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await getUserById(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], user);
  });

  it('404 : user not found', async () => {
    mockUser.findById.mock.mockImplementation(async () => null);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();
    await getUserById(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockUser.findById.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await getUserById(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('updateUserStatus()', () => {
  beforeEach(resetMocks);

  it('200 : suspends a user', async () => {
    const updatedUser = { id: 1, status: 'suspended' };
    mockUser.update.mock.mockImplementation(async () => updatedUser);

    const req = makeReq({ status: 'suspended' }, { id: '1' });
    const res = makeRes();
    await updateUserStatus(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /suspended/i);
    assert.deepEqual(body.user, updatedUser);
  });

  it('200 : reactivates a user', async () => {
    mockUser.update.mock.mockImplementation(async () => ({ id: 1, status: 'active' }));

    const req = makeReq({ status: 'active' }, { id: '1' });
    const res = makeRes();
    await updateUserStatus(req, res);

    assert.match(res.json.mock.calls[0].arguments[0].message, /active/i);
  });

  it('400 : invalid status value', async () => {
    const req = makeReq({ status: 'banned' }, { id: '1' });
    const res = makeRes();
    await updateUserStatus(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /active or suspended/i);
  });

  it('404 : user not found', async () => {
    mockUser.update.mock.mockImplementation(async () => null);

    const req = makeReq({ status: 'active' }, { id: '99' });
    const res = makeRes();
    await updateUserStatus(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockUser.update.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({ status: 'active' }, { id: '1' });
    const res = makeRes();
    await updateUserStatus(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('updateUserRole()', () => {
  beforeEach(resetMocks);

  it('200 : updates user role to ehost', async () => {
    const updatedUser = { id: 1, role: 'ehost' };
    mockUser.update.mock.mockImplementation(async () => updatedUser);

    const req = makeReq({ role: 'ehost' }, { id: '1' });
    const res = makeRes();
    await updateUserRole(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /ehost/i);
    assert.deepEqual(body.user, updatedUser);
  });

  it('400 : invalid role value', async () => {
    const req = makeReq({ role: 'superuser' }, { id: '1' });
    const res = makeRes();
    await updateUserRole(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /visitor, ehost, or admin/i);
  });

  it('404 : user not found', async () => {
    mockUser.update.mock.mockImplementation(async () => null);

    const req = makeReq({ role: 'admin' }, { id: '99' });
    const res = makeRes();
    await updateUserRole(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockUser.update.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({ role: 'visitor' }, { id: '1' });
    const res = makeRes();
    await updateUserRole(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('deleteUser()', () => {
  beforeEach(resetMocks);

  it('200 : deletes a user successfully', async () => {
    mockUser.delete.mock.mockImplementation(async () => true);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await deleteUser(req, res);

    assert.match(res.json.mock.calls[0].arguments[0].message, /deleted successfully/i);
  });

  it('404 : user not found', async () => {
    mockUser.delete.mock.mockImplementation(async () => false);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();
    await deleteUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockUser.delete.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await deleteUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getApplications()', () => {
  beforeEach(resetMocks);

  it('200 : returns all applications without filter', async () => {
    const apps = [{ id: 1, email: 'a@test.com', status: 'pending' }];
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: apps }));

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getApplications(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], apps);
  });

  it('200 : filters applications by status', async () => {
    const apps = [{ id: 2, email: 'b@test.com', status: 'approved' }];
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: apps }));

    const req = makeReq({}, {}, { status: 'approved' });
    const res = makeRes();
    await getApplications(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], apps);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getApplications(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('approveApplication()', () => {
  beforeEach(resetMocks);

  it('200 : approves application and creates ehost user', async () => {
    const app = {
      id: 1,
      email: 'john@test.com',
      name: 'John Smith',
      birthday: '1990-01-01',
      country: 'UK',
      password_hash: 'hashed_pw_from_application',
      status: 'pending',
    };
    const createdUser = { id: 10, email: 'john@test.com', role: 'ehost' };

    let calls = 0;
    fakePool.query.mock.mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.resolve({ rows: [app] }); // find application
      return Promise.resolve({ rows: [] });                      // update status
    });
    mockUser.findByEmail.mock.mockImplementation(async () => null);
    mockUser.create.mock.mockImplementation(async () => createdUser);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveApplication(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /approved/i);
    assert.deepEqual(body.user, createdUser);
  });

  it('404 : application not found', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq({}, { id: '999' });
    const res = makeRes();
    await approveApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('400 : application already approved', async () => {
    fakePool.query.mock.mockImplementation(() =>
      Promise.resolve({ rows: [{ id: 1, status: 'approved' }] })
    );

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already/i);
  });

  it('409 : user with this email already exists', async () => {
    fakePool.query.mock.mockImplementation(() =>
      Promise.resolve({ rows: [{ id: 1, email: 'john@test.com', name: 'John', status: 'pending' }] })
    );
    mockUser.findByEmail.mock.mockImplementation(async () => ({ id: 5 }));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already exists/i);
  });

  it('500 : database error on find', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('rejectApplication()', () => {
  beforeEach(resetMocks);

  it('200 : rejects application successfully', async () => {
    const app = { id: 1, email: 'john@test.com', status: 'pending' };

    let calls = 0;
    fakePool.query.mock.mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.resolve({ rows: [app] }); // find application
      return Promise.resolve({ rows: [] });                      // update status
    });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectApplication(req, res);

    assert.match(res.json.mock.calls[0].arguments[0].message, /rejected/i);
  });

  it('404 : application not found', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq({}, { id: '999' });
    const res = makeRes();
    await rejectApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('400 : application already rejected', async () => {
    fakePool.query.mock.mockImplementation(() =>
      Promise.resolve({ rows: [{ id: 1, status: 'rejected' }] })
    );

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already/i);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getExperiences()', () => {
  beforeEach(resetMocks);

  it('200 : returns pending experiences by default', async () => {
    const exps = [{ id: 1, title: 'Trip A', status: 'pending' }];
    mockExperience.findAll.mock.mockImplementation(async () => exps);

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getExperiences(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], exps);
    assert.equal(mockExperience.findAll.mock.calls[0].arguments[0].status, 'pending');
  });

  it('200 : passes status filter from query', async () => {
    const exps = [{ id: 2, title: 'Trip B', status: 'approved' }];
    mockExperience.findAll.mock.mockImplementation(async () => exps);

    const req = makeReq({}, {}, { status: 'approved' });
    const res = makeRes();
    await getExperiences(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], exps);
    assert.equal(mockExperience.findAll.mock.calls[0].arguments[0].status, 'approved');
  });

  it('200 : returns empty array when no experiences found', async () => {
    mockExperience.findAll.mock.mockImplementation(async () => []);

    const req = makeReq({}, {}, { status: 'rejected' });
    const res = makeRes();
    await getExperiences(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], []);
  });

  it('500 : database error', async () => {
    mockExperience.findAll.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getExperiences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getAgreement()', () => {
  beforeEach(resetMocks);

  it('200 : returns agreement title and content', async () => {
    const req = makeReq();
    const res = makeRes();
    await getAgreement(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const body = res.json.mock.calls[0].arguments[0];
    assert.ok(body.title);
    assert.ok(body.content);
  });
});

describe('acceptAgreement()', () => {
  beforeEach(resetMocks);

  it('400 : missing or invalid userId', async () => {
    const req = makeReq({ userId: 'not-a-number' });
    const res = makeRes();
    await acceptAgreement(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /userId/i);
  });

  it('400 : user not found', async () => {
    mockUser.findById.mock.mockImplementation(async () => null);

    const req = makeReq({ userId: 1 });
    const res = makeRes();
    await acceptAgreement(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('200 : agreement already on file', async () => {
    const existing = { id: 1, user_id: 1 };
    mockUser.findById.mock.mockImplementation(async () => ({ id: 1 }));
    mockUserAgreement.findByUser.mock.mockImplementation(async () => existing);

    const req = makeReq({ userId: 1 });
    const res = makeRes();
    await acceptAgreement(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already/i);
  });

  it('201 : creates new agreement', async () => {
    const record = { id: 5, user_id: 1 };
    mockUser.findById.mock.mockImplementation(async () => ({ id: 1 }));
    mockUserAgreement.findByUser.mock.mockImplementation(async () => null);
    mockUserAgreement.create.mock.mockImplementation(async () => record);

    const req = makeReq({ userId: 1 });
    const res = makeRes();
    await acceptAgreement(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    assert.match(res.json.mock.calls[0].arguments[0].message, /accepted/i);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].record, record);
  });

  it('500 : database error', async () => {
    mockUser.findById.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({ userId: 1 });
    const res = makeRes();
    await acceptAgreement(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('approveExperience()', () => {
  beforeEach(resetMocks);

  it('200 : approves experience', async () => {
    const exp = { id: 1, status: 'approved' };
    mockExperience.update.mock.mockImplementation(async () => exp);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveExperience(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /approved/i);
    assert.deepEqual(body.experience, exp);
  });

  it('404 : experience not found', async () => {
    mockExperience.update.mock.mockImplementation(async () => null);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();
    await approveExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockExperience.update.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('rejectExperience()', () => {
  beforeEach(resetMocks);

  it('200 : rejects experience', async () => {
    const exp = { id: 1, status: 'rejected' };
    mockExperience.update.mock.mockImplementation(async () => exp);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectExperience(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /rejected/i);
    assert.deepEqual(body.experience, exp);
  });

  it('404 : experience not found', async () => {
    mockExperience.update.mock.mockImplementation(async () => null);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();
    await rejectExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockExperience.update.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('deleteExperience()', () => {
  beforeEach(resetMocks);

  it('200 : deletes experience successfully', async () => {
    mockExperience.update.mock.mockImplementation(async () => ({ id: 1, status: 'deleted' }));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await deleteExperience(req, res);

    assert.match(res.json.mock.calls[0].arguments[0].message, /deleted/i);
  });

  it('404 : experience not found', async () => {
    mockExperience.update.mock.mockImplementation(async () => null);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();
    await deleteExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockExperience.update.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await deleteExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getBookings()', () => {
  beforeEach(resetMocks);

  it('200 : returns all bookings without filter', async () => {
    const bookings = [{ id: 1 }, { id: 2 }];
    mockBooking.findAll.mock.mockImplementation(async () => bookings);

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getBookings(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], bookings);
  });

  it('200 : passes status filter to model', async () => {
    mockBooking.findAll.mock.mockImplementation(async ({ status }) => {
      assert.equal(status, 'confirmed');
      return [];
    });

    const req = makeReq({}, {}, { status: 'confirmed' });
    const res = makeRes();
    await getBookings(req, res);

    assert.equal(res.json.mock.callCount(), 1);
  });

  it('500 : database error', async () => {
    mockBooking.findAll.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getBookings(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getAnalytics()', () => {
  beforeEach(resetMocks);

  it('200 : returns all analytics data', async () => {
    const topExp = [{ id: 1, title: 'Trip A' }];
    const topHosts = [{ id: 2, name: 'Host B' }];
    const countries = [{ country: 'United Kingdom', visitor_count: 42 }];
    const categories = [{ name: 'Adventure', count: 5 }];
    mockAnalytics.getTopExperiences.mock.mockImplementation(async () => topExp);
    mockAnalytics.getTopHosts.mock.mockImplementation(async () => topHosts);
    mockAnalytics.getVisitorCountries.mock.mockImplementation(async () => countries);
    mockAnalytics.getCategoryBreakdown.mock.mockImplementation(async () => categories);

    const req = makeReq();
    const res = makeRes();
    await getAnalytics(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.deepEqual(body.topExperiences, topExp);
    assert.deepEqual(body.topHosts, topHosts);
    assert.deepEqual(body.visitorCountries, countries);
    assert.deepEqual(body.categoryBreakdown, categories);
  });

  it('500 : database error', async () => {
    mockAnalytics.getTopExperiences.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq();
    const res = makeRes();
    await getAnalytics(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('scoreExperience()', () => {
  beforeEach(resetMocks);

  it('400 : invalid result value', async () => {
    const req = makeReq({ result: 'maybe' }, { id: '1' }, {}, { id: 99 });
    const res = makeRes();
    await scoreExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /pass.*fail|fail.*pass/i);
  });

  it('400 : fail result without comment', async () => {
    const req = makeReq({ result: 'fail', comment: '  ' }, { id: '1' }, {}, { id: 99 });
    const res = makeRes();
    await scoreExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /comment/i);
  });

  it('200 : pass result creates score and approves experience', async () => {
    const score = { id: 1, result: 'pass' };
    mockExperienceScore.create.mock.mockImplementation(async () => score);
    mockExperience.update.mock.mockImplementation(async () => ({ id: 1, status: 'approved' }));

    const req = makeReq({ result: 'pass' }, { id: '1' }, {}, { id: 99 });
    const res = makeRes();
    await scoreExperience(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /pass/i);
    assert.deepEqual(body.score, score);
    assert.equal(mockExperience.update.mock.callCount(), 1);
    assert.equal(mockExperience.update.mock.calls[0].arguments[1].status, 'approved');
  });

  it('200 : fail result creates score and rejects experience', async () => {
    const score = { id: 2, result: 'fail' };
    mockExperienceScore.create.mock.mockImplementation(async () => score);
    mockExperience.update.mock.mockImplementation(async () => ({ id: 1, status: 'rejected' }));

    const req = makeReq({ result: 'fail', comment: 'Bad content' }, { id: '1' }, {}, { id: 99 });
    const res = makeRes();
    await scoreExperience(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /fail/i);
    assert.equal(mockExperience.update.mock.callCount(), 1);
    assert.equal(mockExperience.update.mock.calls[0].arguments[1].status, 'rejected');
  });

  it('500 : database error', async () => {
    mockExperienceScore.create.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({ result: 'pass' }, { id: '1' }, {}, { id: 99 });
    const res = makeRes();
    await scoreExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getExperienceScores()', () => {
  beforeEach(resetMocks);

  it('200 : returns scores for experience', async () => {
    const scores = [{ id: 1, result: 'pass' }, { id: 2, result: 'fail' }];
    mockExperienceScore.findByExperience.mock.mockImplementation(async () => scores);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await getExperienceScores(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], scores);
  });

  it('500 : database error', async () => {
    mockExperienceScore.findByExperience.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await getExperienceScores(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getRefunds()', () => {
  beforeEach(resetMocks);

  it('200 : returns all refunds without filter', async () => {
    const rows = [{ refund_id: 1, refund_status: 'pending' }];
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows }));

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getRefunds(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], rows);
    const [sql, vals] = fakePool.query.mock.calls[0].arguments;
    assert.ok(!sql.includes('WHERE'));
    assert.deepEqual(vals, []);
  });

  it('200 : filters by status', async () => {
    const rows = [{ refund_id: 2, refund_status: 'pending' }];
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows }));

    const req = makeReq({}, {}, { status: 'pending' });
    const res = makeRes();
    await getRefunds(req, res);

    const [sql, vals] = fakePool.query.mock.calls[0].arguments;
    assert.ok(sql.includes('WHERE'));
    assert.deepEqual(vals, ['pending']);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getRefunds(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('approveRefund()', () => {
  beforeEach(resetMocks);

  it('404 : refund not found', async () => {
    mockRefund.findById.mock.mockImplementation(async () => null);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveRefund(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /refund not found/i);
  });

  it('400 : refund already processed', async () => {
    mockRefund.findById.mock.mockImplementation(async () => ({ id: 1, status: 'approved', booking_id: 1 }));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveRefund(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already/i);
  });

  it('404 : payment record not found', async () => {
    mockRefund.findById.mock.mockImplementation(async () => ({ id: 1, status: 'pending', booking_id: 1, refund_amount: '10.00' }));
    mockPayment.findByBooking.mock.mockImplementation(async () => null);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveRefund(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /payment/i);
  });

  it('400 : stripe transaction_id missing', async () => {
    mockRefund.findById.mock.mockImplementation(async () => ({ id: 1, status: 'pending', booking_id: 1, refund_amount: '10.00' }));
    mockPayment.findByBooking.mock.mockImplementation(async () => [{ method: 'stripe', transaction_id: null }]);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveRefund(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /transaction_id/i);
  });

  it('200 : stripe refund processed successfully', async () => {
    mockRefund.findById.mock.mockImplementation(async () => ({ id: 1, status: 'pending', booking_id: 1, refund_amount: '50.00' }));
    mockPayment.findByBooking.mock.mockImplementation(async () => [{ method: 'stripe', transaction_id: 'pi_test_123' }]);
    fakeStripeClient.refunds.create.mock.mockImplementation(async () => ({ id: 're_test_456' }));
    mockRefund.updateStatus.mock.mockImplementation(async () => {});
    mockBooking.updateStatus.mock.mockImplementation(async () => {});

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveRefund(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /approved/i);
    assert.equal(body.gateway_refund_id, 're_test_456');
  });

  it('200 : paypal refund processed successfully', async () => {
    mockRefund.findById.mock.mockImplementation(async () => ({ id: 2, status: 'pending', booking_id: 2, refund_amount: '25.00' }));
    mockPayment.findByBooking.mock.mockImplementation(async () => [{ method: 'paypal', transaction_id: 'capture_xyz' }]);
    fakePayPalClient.execute.mock.mockImplementation(async () => ({ result: { id: 'paypal_refund_id' } }));
    mockRefund.updateStatus.mock.mockImplementation(async () => {});
    mockBooking.updateStatus.mock.mockImplementation(async () => {});

    const req = makeReq({}, { id: '2' });
    const res = makeRes();
    await approveRefund(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /approved/i);
    assert.equal(body.gateway_refund_id, 'paypal_refund_id');
  });
});

describe('rejectRefund()', () => {
  beforeEach(resetMocks);

  it('200 : rejects refund and restores booking to confirmed', async () => {
    mockRefund.findById.mock.mockImplementation(async () => ({ id: 1, status: 'pending', booking_id: 1 }));
    mockRefund.updateStatus.mock.mockImplementation(async () => {});
    mockBooking.updateStatus.mock.mockImplementation(async () => {});

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectRefund(req, res);

    assert.match(res.json.mock.calls[0].arguments[0].message, /rejected/i);
    assert.equal(mockBooking.updateStatus.mock.calls[0].arguments[1], 'confirmed');
  });

  it('404 : refund not found', async () => {
    mockRefund.findById.mock.mockImplementation(async () => null);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();
    await rejectRefund(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('400 : refund already processed', async () => {
    mockRefund.findById.mock.mockImplementation(async () => ({ id: 1, status: 'rejected', booking_id: 1 }));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectRefund(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already/i);
  });

  it('500 : database error', async () => {
    mockRefund.findById.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectRefund(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});
