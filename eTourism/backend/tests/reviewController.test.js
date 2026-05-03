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

const mockUser = { findById: mock.fn() };
require.cache[path.resolve(__dirname, '../models/User.js')] = {
  id: path.resolve(__dirname, '../models/User.js'),
  filename: path.resolve(__dirname, '../models/User.js'),
  loaded: true,
  exports: mockUser,
  children: [],
  paths: [],
};

const mockExperience = { findById: mock.fn() };
require.cache[path.resolve(__dirname, '../models/Experience.js')] = {
  id: path.resolve(__dirname, '../models/Experience.js'),
  filename: path.resolve(__dirname, '../models/Experience.js'),
  loaded: true,
  exports: mockExperience,
  children: [],
  paths: [],
};

// In-memory file system that backs reviewController's fs/promises calls.
const virtualFiles = new Map();
const fsMock = {
  mkdir: mock.fn(async () => {}),
  readFile: mock.fn(async (file) => {
    if (!virtualFiles.has(file)) {
      const err = new Error('ENOENT');
      err.code = 'ENOENT';
      throw err;
    }
    return virtualFiles.get(file);
  }),
  writeFile: mock.fn(async (file, contents) => {
    virtualFiles.set(file, contents);
  }),
};
require.cache[require.resolve('fs/promises')] = {
  id: require.resolve('fs/promises'),
  filename: require.resolve('fs/promises'),
  loaded: true,
  exports: fsMock,
  children: [],
  paths: [],
};

const {
  sendReviewEmail,
  verifyReviewToken,
  submitReview,
  getExperienceReviews,
} = require('../controllers/reviewController');

const REVIEWS_FILE = path.join(__dirname, '..', 'data', 'reviews.json');
const TOKENS_FILE = path.join(__dirname, '..', 'reviewTokens.json');

function makeRes() {
  const res = {};
  res.status = mock.fn(() => res);
  res.json = mock.fn(() => res);
  return res;
}

function makeReq({ body = {}, params = {}, query = {} } = {}) {
  return { body, params, query };
}

function resetMocks() {
  virtualFiles.clear();
  mockUser.findById.mock.resetCalls();
  mockExperience.findById.mock.resetCalls();
  fsMock.mkdir.mock.resetCalls();
  fsMock.readFile.mock.resetCalls();
  fsMock.writeFile.mock.resetCalls();
  fsMock.mkdir.mock.mockImplementation(async () => {});
  fsMock.readFile.mock.mockImplementation(async (file) => {
    if (!virtualFiles.has(file)) {
      const err = new Error('ENOENT');
      err.code = 'ENOENT';
      throw err;
    }
    return virtualFiles.get(file);
  });
  fsMock.writeFile.mock.mockImplementation(async (file, contents) => {
    virtualFiles.set(file, contents);
  });
}

function seedTokens(tokens) {
  virtualFiles.set(TOKENS_FILE, JSON.stringify(tokens));
}

function seedReviews(reviews) {
  virtualFiles.set(REVIEWS_FILE, JSON.stringify(reviews));
}

function readPersistedTokens() {
  return JSON.parse(virtualFiles.get(TOKENS_FILE) || '[]');
}

function readPersistedReviews() {
  return JSON.parse(virtualFiles.get(REVIEWS_FILE) || '[]');
}

function futureIso(msFromNow = 60 * 60 * 1000) {
  return new Date(Date.now() + msFromNow).toISOString();
}

describe('sendReviewEmail()', () => {
  beforeEach(resetMocks);

  it('400 : missing user_id', async () => {
    const req = makeReq({ body: { experience_id: 1 } });
    const res = makeRes();
    await sendReviewEmail(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /user_id/i);
  });

  it('400 : missing experience_id', async () => {
    const req = makeReq({ body: { user_id: 1 } });
    const res = makeRes();
    await sendReviewEmail(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /experience_id/i);
  });

  it('404 : user not found', async () => {
    mockUser.findById.mock.mockImplementation(async () => null);

    const req = makeReq({ body: { user_id: 1, experience_id: 2 } });
    const res = makeRes();
    await sendReviewEmail(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /user/i);
  });

  it('404 : experience not found', async () => {
    mockUser.findById.mock.mockImplementation(async () => ({ id: 1, email: 'a@test.com' }));
    mockExperience.findById.mock.mockImplementation(async () => null);

    const req = makeReq({ body: { user_id: 1, experience_id: 2 } });
    const res = makeRes();
    await sendReviewEmail(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /experience/i);
  });

  it('201 : persists a token and returns expiry', async () => {
    mockUser.findById.mock.mockImplementation(async () => ({ id: 1, email: 'a@test.com', first_name: 'Alex' }));
    mockExperience.findById.mock.mockImplementation(async () => ({ id: 2 }));

    const req = makeReq({ body: { user_id: 1, experience_id: 2 } });
    const res = makeRes();
    await sendReviewEmail(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /recorded/i);
    assert.ok(body.expired_at);

    const persisted = readPersistedTokens();
    assert.equal(persisted.length, 1);
    assert.equal(persisted[0].user_id, 1);
    assert.equal(persisted[0].experience_id, 2);
    assert.equal(persisted[0].used, false);
    assert.equal(typeof persisted[0].token, 'string');
  });

  it('500 : write failure surfaces a server error', async () => {
    mockUser.findById.mock.mockImplementation(async () => ({ id: 1, email: 'a@test.com' }));
    mockExperience.findById.mock.mockImplementation(async () => ({ id: 2 }));
    fsMock.writeFile.mock.mockImplementation(async () => { throw new Error('disk full'); });

    const req = makeReq({ body: { user_id: 1, experience_id: 2 } });
    const res = makeRes();
    await sendReviewEmail(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('verifyReviewToken()', () => {
  beforeEach(resetMocks);

  it('400 : missing token query', async () => {
    const req = makeReq({ query: {} });
    const res = makeRes();
    await verifyReviewToken(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /token/i);
  });

  it('404 : token not found', async () => {
    seedTokens([]);

    const req = makeReq({ query: { token: 'unknown' } });
    const res = makeRes();
    await verifyReviewToken(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('410 : token expired', async () => {
    seedTokens([{
      token: 't1', user_id: 1, experience_id: 2,
      expired_at: new Date(Date.now() - 1000).toISOString(),
      used: false,
    }]);

    const req = makeReq({ query: { token: 't1' } });
    const res = makeRes();
    await verifyReviewToken(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 410);
    assert.match(res.json.mock.calls[0].arguments[0].message, /expired/i);
  });

  it('409 : token already used', async () => {
    seedTokens([{
      token: 't1', user_id: 1, experience_id: 2,
      expired_at: futureIso(), used: true,
    }]);

    const req = makeReq({ query: { token: 't1' } });
    const res = makeRes();
    await verifyReviewToken(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
  });

  it('200 : valid token returns user/experience info', async () => {
    const expired_at = futureIso();
    seedTokens([{ token: 't1', user_id: 1, experience_id: 2, expired_at, used: false }]);

    const req = makeReq({ query: { token: 't1' } });
    const res = makeRes();
    await verifyReviewToken(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.valid, true);
    assert.equal(body.user_id, 1);
    assert.equal(body.experience_id, 2);
    assert.equal(body.expired_at, expired_at);
  });

  it('200 : array-form token query is normalized to first element', async () => {
    const expired_at = futureIso();
    seedTokens([{ token: 't1', user_id: 1, experience_id: 2, expired_at, used: false }]);

    const req = makeReq({ query: { token: ['t1', 't2'] } });
    const res = makeRes();
    await verifyReviewToken(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
  });
});

describe('submitReview()', () => {
  beforeEach(resetMocks);

  const validBody = {
    token: 't1',
    rating: 5,
    host_rating: 4,
    content_rating: 5,
    technical_rating: 3,
    recommend: true,
    comment: 'Loved it',
    improvement: 'Nothing',
  };

  it('400 : missing token', async () => {
    const req = makeReq({ body: { ...validBody, token: undefined } });
    const res = makeRes();
    await submitReview(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('404 : token not found', async () => {
    seedTokens([]);

    const req = makeReq({ body: validBody });
    const res = makeRes();
    await submitReview(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('410 : expired token', async () => {
    seedTokens([{
      token: 't1', user_id: 1, experience_id: 2,
      expired_at: new Date(Date.now() - 1000).toISOString(),
      used: false,
    }]);

    const req = makeReq({ body: validBody });
    const res = makeRes();
    await submitReview(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 410);
  });

  it('400 : rating out of range', async () => {
    seedTokens([{ token: 't1', user_id: 1, experience_id: 2, expired_at: futureIso(), used: false }]);

    const req = makeReq({ body: { ...validBody, rating: 9 } });
    const res = makeRes();
    await submitReview(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /rating/i);
  });

  it('400 : recommend is not boolean-coercible', async () => {
    seedTokens([{ token: 't1', user_id: 1, experience_id: 2, expired_at: futureIso(), used: false }]);

    const req = makeReq({ body: { ...validBody, recommend: 'maybe' } });
    const res = makeRes();
    await submitReview(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /recommend/i);
  });

  it('201 : saves review, marks token used, returns saved record', async () => {
    seedTokens([{ token: 't1', user_id: 1, experience_id: 2, expired_at: futureIso(), used: false }]);

    const req = makeReq({ body: validBody });
    const res = makeRes();
    await submitReview(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /submitted/i);
    assert.ok(body.review.id);
    assert.equal(body.review.user_id, 1);
    assert.equal(body.review.experience_id, 2);
    assert.equal(body.review.rating, 5);
    assert.equal(body.review.recommend, true);

    const reviews = readPersistedReviews();
    assert.equal(reviews.length, 1);
    const tokens = readPersistedTokens();
    assert.equal(tokens[0].used, true);
  });

  it('201 : new review id increments past existing reviews', async () => {
    seedTokens([{ token: 't1', user_id: 1, experience_id: 2, expired_at: futureIso(), used: false }]);
    seedReviews([{ id: 7, experience_id: 99, rating: 1 }]);

    const req = makeReq({ body: validBody });
    const res = makeRes();
    await submitReview(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.review.id, 8);
  });

  it('201 : coerces string boolean and numeric ratings', async () => {
    seedTokens([{ token: 't1', user_id: 1, experience_id: 2, expired_at: futureIso(), used: false }]);

    const req = makeReq({
      body: { ...validBody, recommend: 'false', rating: '4' },
    });
    const res = makeRes();
    await submitReview(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.review.recommend, false);
    assert.equal(body.review.rating, 4);
  });
});

describe('getExperienceReviews()', () => {
  beforeEach(resetMocks);

  it('400 : invalid experience id', async () => {
    const req = makeReq({ params: { id: 'abc' } });
    const res = makeRes();
    await getExperienceReviews(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('200 : returns only reviews for the requested experience, newest first', async () => {
    seedReviews([
      { id: 1, experience_id: 2, rating: 5, created_at: '2026-01-01T00:00:00Z' },
      { id: 2, experience_id: 9, rating: 3, created_at: '2026-02-01T00:00:00Z' },
      { id: 3, experience_id: 2, rating: 4, created_at: '2026-03-01T00:00:00Z' },
    ]);

    const req = makeReq({ params: { id: '2' } });
    const res = makeRes();
    await getExperienceReviews(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.experience_id, 2);
    assert.equal(body.count, 2);
    assert.equal(body.reviews[0].id, 3);
    assert.equal(body.reviews[1].id, 1);
  });

  it('200 : empty array when no reviews file exists', async () => {
    const req = makeReq({ params: { id: '2' } });
    const res = makeRes();
    await getExperienceReviews(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const body = res.json.mock.calls[0].arguments[0];
    assert.deepEqual(body.reviews, []);
    assert.equal(body.count, 0);
  });

  it('500 : read failure surfaces server error', async () => {
    fsMock.readFile.mock.mockImplementation(async () => { throw new Error('disk fail'); });

    const req = makeReq({ params: { id: '2' } });
    const res = makeRes();
    await getExperienceReviews(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});
