'use strict';

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// ── Inject all mocks into require.cache BEFORE any app module is loaded ──────

// 1. Fake DB pool (prevents pg from connecting to real PostgreSQL)
const fakePool = { query: mock.fn(), end: mock.fn() };
require.cache[path.resolve(__dirname, '../config/db.js')] = {
  id: path.resolve(__dirname, '../config/db.js'),
  filename: path.resolve(__dirname, '../config/db.js'),
  loaded: true,
  exports: fakePool,
  children: [],
  paths: [],
};

// 2. Fake User model
const mockUser = { findByEmail: mock.fn(), create: mock.fn() };
require.cache[path.resolve(__dirname, '../models/User.js')] = {
  id: path.resolve(__dirname, '../models/User.js'),
  filename: path.resolve(__dirname, '../models/User.js'),
  loaded: true,
  exports: mockUser,
  children: [],
  paths: [],
};

// 3. Fake bcryptjs
const fakeBcrypt = { hash: mock.fn(), compare: mock.fn() };
require.cache[require.resolve('bcryptjs')] = {
  id: require.resolve('bcryptjs'),
  filename: require.resolve('bcryptjs'),
  loaded: true,
  exports: fakeBcrypt,
  children: [],
  paths: [],
};

// 4. Fake jsonwebtoken
const fakeJwt = { sign: mock.fn(() => 'mock_token'), verify: mock.fn() };
require.cache[require.resolve('jsonwebtoken')] = {
  id: require.resolve('jsonwebtoken'),
  filename: require.resolve('jsonwebtoken'),
  loaded: true,
  exports: fakeJwt,
  children: [],
  paths: [],
};

// ── Now safe to load the controller ──────────────────────────────────────────
const { register, login } = require('../controllers/authController');

// ── Mock req/res helpers ──────────────────────────────────────────────────────
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
  mockUser.findByEmail.mock.resetCalls();
  mockUser.create.mock.resetCalls();
  fakeBcrypt.hash.mock.resetCalls();
  fakeBcrypt.compare.mock.resetCalls();
  fakeJwt.sign.mock.resetCalls();
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe('register()', () => {
  beforeEach(resetMocks);

  it('201 – registers a new visitor successfully', async () => {
    fakeBcrypt.hash.mock.mockImplementation(async () => 'hashed_pw');
    mockUser.findByEmail.mock.mockImplementation(async () => null);
    mockUser.create.mock.mockImplementation(async () => ({
      id: 1, email: 'new@test.com', role: 'visitor',
      first_name: 'John', last_name: 'Doe',
    }));

    const req = makeReq({ email: 'new@test.com', password: 'pass123', first_name: 'John', last_name: 'Doe' });
    const res = makeRes();
    await register(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.token, 'mock_token');
    assert.equal(body.message, 'Registered successfully');
  });

  it('400 – missing required fields', async () => {
    const req = makeReq({ email: 'missing@test.com' });
    const res = makeRes();
    await register(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /required/i);
  });

  it('409 – email already in use', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({ id: 1 }));

    const req = makeReq({ email: 'exists@test.com', password: 'pass123', first_name: 'Jane', last_name: 'Doe' });
    const res = makeRes();
    await register(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already in use/i);
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('login()', () => {
  beforeEach(resetMocks);

  it('200 – login successful with valid credentials', async () => {
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
  });

  it('400 – missing email or password', async () => {
    const req = makeReq({ email: 'user@test.com' });
    const res = makeRes();
    await login(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /required/i);
  });

  it('401 – user not found', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => null);

    const req = makeReq({ email: 'ghost@test.com', password: 'pass123' });
    const res = makeRes();
    await login(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.match(res.json.mock.calls[0].arguments[0].message, /invalid email or password/i);
  });

  it('401 – wrong password', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({
      id: 1, password_hash: 'hashed_pw', status: 'active',
    }));
    fakeBcrypt.compare.mock.mockImplementation(async () => false);

    const req = makeReq({ email: 'user@test.com', password: 'wrongpass' });
    const res = makeRes();
    await login(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.match(res.json.mock.calls[0].arguments[0].message, /invalid email or password/i);
  });

  it('403 – suspended account', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({
      id: 2, password_hash: 'hashed_pw', status: 'suspended',
    }));
    fakeBcrypt.compare.mock.mockImplementation(async () => true);

    const req = makeReq({ email: 'banned@test.com', password: 'pass123' });
    const res = makeRes();
    await login(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.match(res.json.mock.calls[0].arguments[0].message, /suspended/i);
  });
});
