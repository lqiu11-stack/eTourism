'use strict';

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Replaces ../config/db.js so no real database connection is made.
// ehostController calls pool directly (no model layer), so every SQL statement
// goes through this single mock:
//   query – intercepts all parameterised SQL queries (SELECT, INSERT, UPDATE)
//   end   – intercepts pool shutdown (not normally called in controllers, included for completeness)
const fakePool = { query: mock.fn(), end: mock.fn() };
require.cache[path.resolve(__dirname, '../config/db.js')] = {
  id: path.resolve(__dirname, '../config/db.js'),
  filename: path.resolve(__dirname, '../config/db.js'),
  loaded: true,
  exports: fakePool,
  children: [],
  paths: [],
};

const {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  getBookings,
  submitApplication,
} = require('../controllers/ehostController');

function makeRes() {
  const res = {};
  res.status = mock.fn(() => res);
  res.json = mock.fn(() => res);
  return res;
}

function makeReq(body = {}, params = {}, query = {}, user = null) {
  return { body, params, query, user };
}

function resetMocks() {
  fakePool.query.mock.resetCalls();
}

describe('submitApplication()', () => {
  beforeEach(resetMocks);

  it('201 : submits application successfully', async () => {
    // TODO
  });

  it('409 : email already submitted an application', async () => {
    // TODO
  });

  it('500 : database error on duplicate check', async () => {
    // TODO
  });

  it('500 : database error on insert', async () => {
    // TODO
  });
});

describe('getExperiences()', () => {
  beforeEach(resetMocks);

  it('200 : returns list of experiences for ehost', async () => {
    // TODO
  });

  it('200 : returns empty array when ehost has no experiences', async () => {
    // TODO
  });

  it('500 : database error', async () => {
    // TODO
  });
});

describe('getExperienceById()', () => {
  beforeEach(resetMocks);

  it('200 : returns experience when found and owned by ehost', async () => {
    // TODO
  });

  it('404 : experience not found or not owned by ehost', async () => {
    // TODO
  });

  it('500 : database error', async () => {
    // TODO
  });
});

describe('updateExperience()', () => {
  beforeEach(resetMocks);

  it('200 : updates experience and sets status to pending', async () => {
    // TODO
  });

  it('404 : experience not found or not owned by ehost', async () => {
    // TODO
  });

  it('500 : database error on ownership check', async () => {
    // TODO
  });

  it('500 : database error on update', async () => {
    // TODO
  });
});

describe('deleteExperience()', () => {
  beforeEach(resetMocks);

  it('200 : soft-deletes experience successfully', async () => {
    // TODO
  });

  it('404 : experience not found or not owned by ehost', async () => {
    // TODO
  });

  it('500 : database error', async () => {
    // TODO
  });
});

describe('createExperience()', () => {
  beforeEach(resetMocks);

  it('200 : placeholder returns success message', async () => {
    // TODO
  });
});

describe('getBookings()', () => {
  beforeEach(resetMocks);

  it('200 : placeholder returns bookings message', async () => {
    // TODO
  });
});
