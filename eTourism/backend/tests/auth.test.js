'use strict';

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

process.env.DATABASE_URL = 'postgres://mock';
process.env.JWT_SECRET = 'test_secret';

const fakePool = { query: mock.fn(async () => ({ rows: [] })), end: mock.fn() };
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
  update: mock.fn(),
  touchLastLogin: mock.fn(async () => {}),
};

const mockUserAgreement = {
  create: mock.fn(async () => ({})),
  findByUser: mock.fn(async () => ({ is_over_18: true })),
};
require.cache[path.resolve(__dirname, '../models/UserAgreement.js')] = {
  id: path.resolve(__dirname, '../models/UserAgreement.js'),
  filename: path.resolve(__dirname, '../models/UserAgreement.js'),
  loaded: true,
  exports: mockUserAgreement,
  children: [],
  paths: [],
};
require.cache[path.resolve(__dirname, '../models/User.js')] = {
  id: path.resolve(__dirname, '../models/User.js'),
  filename: path.resolve(__dirname, '../models/User.js'),
  loaded: true,
  exports: mockUser,
  children: [],
  paths: [],
};

const fakeBcrypt = { hash: mock.fn(), compare: mock.fn() };
require.cache[require.resolve('bcryptjs')] = {
  id: require.resolve('bcryptjs'),
  filename: require.resolve('bcryptjs'),
  loaded: true,
  exports: fakeBcrypt,
  children: [],
  paths: [],
};

const fakeJwt = { sign: mock.fn(() => 'mock_token'), verify: mock.fn() };
require.cache[require.resolve('jsonwebtoken')] = {
  id: require.resolve('jsonwebtoken'),
  filename: require.resolve('jsonwebtoken'),
  loaded: true,
  exports: fakeJwt,
  children: [],
  paths: [],
};

const { register, login } = require('../controllers/authController');

function makeRes() {
  const res = {};
  res.status = mock.fn(() => res);
  res.json   = mock.fn(() => res);
  return res;
}

function makeReq(body = {}) {
  return { body };
}

function resetMocks() {
  fakePool.query.mock.resetCalls();
  fakePool.query.mock.mockImplementation(async () => ({ rows: [] }));
  mockUser.findByEmail.mock.resetCalls();
  mockUser.create.mock.resetCalls();
  mockUser.update.mock.resetCalls();
  mockUser.touchLastLogin.mock.resetCalls();
  mockUserAgreement.create.mock.resetCalls();
  fakeBcrypt.hash.mock.resetCalls();
  fakeBcrypt.compare.mock.resetCalls();
  fakeJwt.sign.mock.resetCalls();
  fakeJwt.sign.mock.mockImplementation(() => 'mock_token');
}

const fullRegisterPayload = (overrides = {}) => ({
  email: 'new@test.com',
  password: 'pass123',
  name: 'John',
  date_of_birth: '1990-01-01',
  gender: 'male',
  accepted_terms: true,
  accepted_behaviour: true,
  accepted_recording: true,
  payment_method_on_file: true,
  ...overrides,
});

describe('register()', () => {
  beforeEach(resetMocks);

  it('201 : registers a new visitor successfully', async () => {
    fakeBcrypt.hash.mock.mockImplementation(async () => 'hashed_pw');
    mockUser.findByEmail.mock.mockImplementation(async () => null);
    mockUser.create.mock.mockImplementation(async () => ({
      id: 1, email: 'new@test.com', role: 'visitor',
      first_name: 'John', last_name: '',
    }));

    const req = makeReq(fullRegisterPayload());
    const res = makeRes();
    await register(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.token, 'mock_token');
    assert.ok(body.user);
  });

  it('400 : missing email or password', async () => {
    const req = makeReq({ email: 'missing@test.com' });
    const res = makeRes();
    await register(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].error, /required/i);
  });

  it('400 : missing name', async () => {
    const req = makeReq(fullRegisterPayload({ name: undefined }));
    const res = makeRes();
    await register(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].error, /name/i);
  });

  it('400 : missing date of birth', async () => {
    const req = makeReq(fullRegisterPayload({ date_of_birth: undefined }));
    const res = makeRes();
    await register(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].error, /date of birth/i);
  });

  it('409 : email already registered', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({ id: 1 }));

    const req = makeReq(fullRegisterPayload({ email: 'exists@test.com', name: 'Jane' }));
    const res = makeRes();
    await register(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
    assert.match(res.json.mock.calls[0].arguments[0].error, /already registered/i);
  });
});

describe('login()', () => {
  beforeEach(resetMocks);

  it('200 : login successful with valid credentials', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({
      id: 1, email: 'user@test.com', password_hash: 'hashed_pw',
      role: 'visitor', first_name: 'John', last_name: 'Doe', status: 'active',
    }));
    fakeBcrypt.compare.mock.mockImplementation(async () => true);

    const req = makeReq({ email: 'user@test.com', password: 'pass123' });
    const res = makeRes();
    await login(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.token, 'mock_token');
    assert.equal(body.user.email, 'user@test.com');
    assert.equal(body.user.password_hash, undefined, 'password_hash must not be returned');
  });

  it('400 : missing email or password', async () => {
    const req = makeReq({ email: 'user@test.com' });
    const res = makeRes();
    await login(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].error, /required/i);
  });

  it('401 : user not found', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => null);

    const req = makeReq({ email: 'ghost@test.com', password: 'pass123' });
    const res = makeRes();
    await login(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.match(res.json.mock.calls[0].arguments[0].error, /invalid email or password/i);
  });

  it('401 : wrong password', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({
      id: 1, password_hash: 'hashed_pw', role: 'visitor', status: 'active',
    }));
    fakeBcrypt.compare.mock.mockImplementation(async () => false);

    const req = makeReq({ email: 'user@test.com', password: 'wrongpass' });
    const res = makeRes();
    await login(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.match(res.json.mock.calls[0].arguments[0].error, /invalid email or password/i);
  });

  it('200 : ehost login is allowed', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({
      id: 2, password_hash: 'hashed_pw', role: 'ehost', status: 'active',
    }));
    fakeBcrypt.compare.mock.mockImplementation(async () => true);

    const req = makeReq({ email: 'ehost@test.com', password: 'pass123' });
    const res = makeRes();
    await login(req, res);

    assert.equal(res.json.mock.calls[0].arguments[0].user.role, 'ehost');
  });

  it('200 : admin login is allowed', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({
      id: 3, password_hash: 'hashed_pw', role: 'admin', status: 'active',
    }));
    fakeBcrypt.compare.mock.mockImplementation(async () => true);

    const req = makeReq({ email: 'admin@test.com', password: 'adminpass' });
    const res = makeRes();
    await login(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.user.role, 'admin');
    assert.equal(body.token, 'mock_token');
  });

});

const { resetPassword } = require('../controllers/authController');

describe('resetPassword()', () => {
  beforeEach(resetMocks);

  it('200 : resets password successfully', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({ id: 1, email: 'user@test.com' }));
    fakeBcrypt.hash.mock.mockImplementation(async () => 'new_hashed_pw');
    mockUser.update.mock.mockImplementation(async () => {});

    const req = makeReq({ email: 'user@test.com', newPassword: 'newpass123', confirmPassword: 'newpass123' });
    const res = makeRes();
    await resetPassword(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /reset successfully/i);
  });

  it('400 : missing required fields', async () => {
    const req = makeReq({ email: 'user@test.com', newPassword: 'newpass123' });
    const res = makeRes();
    await resetPassword(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].error, /required/i);
  });

  it('400 : passwords do not match', async () => {
    const req = makeReq({ email: 'user@test.com', newPassword: 'newpass123', confirmPassword: 'different' });
    const res = makeRes();
    await resetPassword(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].error, /do not match/i);
  });

  it('404 : email not found', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => null);

    const req = makeReq({ email: 'ghost@test.com', newPassword: 'newpass123', confirmPassword: 'newpass123' });
    const res = makeRes();
    await resetPassword(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].error, /not found/i);
  });
});


