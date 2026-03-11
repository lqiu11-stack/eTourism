'use strict';

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Replaces ../config/db.js so no real database connection is made.
// authController does not query the pool directly (it goes through the User model),
// but the pool is injected transitively via User.js – mocking it here prevents any
// accidental real connection if the module load order changes.
const fakePool = { query: mock.fn(), end: mock.fn() };
require.cache[path.resolve(__dirname, '../config/db.js')] = {
  id: path.resolve(__dirname, '../config/db.js'),
  filename: path.resolve(__dirname, '../config/db.js'),
  loaded: true,
  exports: fakePool,
  children: [],
  paths: [],
};

// Replaces ../models/User.js so no real DB calls are made.
// Covers all User methods used by authController:
//   findByEmail – look up a user by email (used in register, login, and resetPassword)
//   create      – insert a new user row (used in register)
//   update      – update an existing user row (used in resetPassword to save the new password hash)
const mockUser = {
  findByEmail: mock.fn(),
  create: mock.fn(),
  update: mock.fn(),
};
require.cache[path.resolve(__dirname, '../models/User.js')] = {
  id: path.resolve(__dirname, '../models/User.js'),
  filename: path.resolve(__dirname, '../models/User.js'),
  loaded: true,
  exports: mockUser,
  children: [],
  paths: [],
};

// Replaces the 'bcryptjs' npm package so no real hashing is performed.
//   hash    – called in register and resetPassword to hash a plain-text password
//   compare – called in login to verify the submitted password against the stored hash
const fakeBcrypt = { hash: mock.fn(), compare: mock.fn() };
require.cache[require.resolve('bcryptjs')] = {
  id: require.resolve('bcryptjs'),
  filename: require.resolve('bcryptjs'),
  loaded: true,
  exports: fakeBcrypt,
  children: [],
  paths: [],
};

// Replaces the 'jsonwebtoken' npm package so no real JWT is signed.
//   sign – called in register and login to create the session token returned to the client
const fakeJwt = { sign: mock.fn() };
require.cache[require.resolve('jsonwebtoken')] = {
  id: require.resolve('jsonwebtoken'),
  filename: require.resolve('jsonwebtoken'),
  loaded: true,
  exports: fakeJwt,
  children: [],
  paths: [],
};

const { register, login, resetPassword } = require('../controllers/authController');

function makeRes() {
  const res = {};
  res.status = mock.fn(() => res);
  res.json = mock.fn(() => res);
  return res;
}

function makeReq(body = {}, params = {}, query = {}) {
  return { body, params, query };
}

function resetMocks() {
  mockUser.findByEmail.mock.resetCalls();
  mockUser.create.mock.resetCalls();
  mockUser.update.mock.resetCalls();
  fakeBcrypt.hash.mock.resetCalls();
  fakeBcrypt.compare.mock.resetCalls();
  fakeJwt.sign.mock.resetCalls();
}

describe('register()', () => {
  beforeEach(resetMocks);

  it('201 : registers a new user successfully', async () => {
    // TODO
  });

  it('400 : missing email or password', async () => {
    // TODO
  });

  it('400 : missing name', async () => {
    // TODO
  });

  it('400 : missing date_of_birth', async () => {
    // TODO
  });

  it('409 : email already registered', async () => {
    // TODO
  });

  it('503 : DATABASE_URL not configured', async () => {
    // TODO
  });

  it('503 : JWT_SECRET not configured', async () => {
    // TODO
  });

  it('500 : database error on create', async () => {
    // TODO
  });
});

describe('login()', () => {
  beforeEach(resetMocks);

  it('200 : returns token and user on valid credentials', async () => {
    // TODO
  });

  it('400 : missing email or password', async () => {
    // TODO
  });

  it('401 : user not found', async () => {
    // TODO
  });

  it('401 : wrong password', async () => {
    // TODO
  });

  it('403 : ehost login is disabled', async () => {
    // TODO
  });

  it('503 : DATABASE_URL not configured', async () => {
    // TODO
  });

  it('503 : JWT_SECRET not configured', async () => {
    // TODO
  });

  it('500 : database error', async () => {
    // TODO
  });
});

describe('resetPassword()', () => {
  beforeEach(resetMocks);

  it('200 : resets password successfully', async () => {
    // TODO
  });

  it('400 : missing required fields', async () => {
    // TODO
  });

  it('400 : passwords do not match', async () => {
    // TODO
  });

  it('404 : email not found', async () => {
    // TODO
  });

  it('503 : DATABASE_URL not configured', async () => {
    // TODO
  });

  it('500 : database error', async () => {
    // TODO
  });
});
