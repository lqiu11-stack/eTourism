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

const mockNetworkLog = {
  hasRecentLog: mock.fn(),
  create: mock.fn(),
  getQualityForUser: mock.fn(),
  getQualityForExperience: mock.fn(),
  getQualityForEhost: mock.fn(),
  adminSummary: mock.fn(),
};
require.cache[path.resolve(__dirname, '../models/NetworkLog.js')] = {
  id: path.resolve(__dirname, '../models/NetworkLog.js'),
  filename: path.resolve(__dirname, '../models/NetworkLog.js'),
  loaded: true,
  exports: mockNetworkLog,
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

const {
  logIssue,
  getMyQuality,
  getExperienceQuality,
  getAdminSummary,
} = require('../controllers/networkController');

function makeRes() {
  const res = {};
  res.status = mock.fn(() => res);
  res.json = mock.fn(() => res);
  res.end = mock.fn(() => res);
  return res;
}

function makeReq({ body = {}, params = {}, query = {}, headers = {}, ip = null, userId = null } = {}) {
  return { body, params, query, headers, ip, userId };
}

function resetMocks() {
  mockNetworkLog.hasRecentLog.mock.resetCalls();
  mockNetworkLog.create.mock.resetCalls();
  mockNetworkLog.getQualityForUser.mock.resetCalls();
  mockNetworkLog.getQualityForExperience.mock.resetCalls();
  mockNetworkLog.getQualityForEhost.mock.resetCalls();
  mockNetworkLog.adminSummary.mock.resetCalls();
  mockExperience.findById.mock.resetCalls();
  fakePool.query.mock.resetCalls();
}

describe('logIssue()', () => {
  beforeEach(resetMocks);

  it('400 : invalid connection_quality', async () => {
    const req = makeReq({ body: { connection_quality: 'amazing' }, userId: 1 });
    const res = makeRes();
    await logIssue(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].error, /connection_quality/i);
  });

  it('204 : good quality is acknowledged but not stored', async () => {
    const req = makeReq({ body: { connection_quality: 'good' }, userId: 1 });
    const res = makeRes();
    await logIssue(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 204);
    assert.equal(mockNetworkLog.create.mock.callCount(), 0);
  });

  it('202 : throttled when a recent log exists', async () => {
    mockNetworkLog.hasRecentLog.mock.mockImplementation(async () => true);

    const req = makeReq({ body: { connection_quality: 'slow' }, userId: 1 });
    const res = makeRes();
    await logIssue(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 202);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], { throttled: true });
    assert.equal(mockNetworkLog.create.mock.callCount(), 0);
  });

  it('201 : creates log for poor quality and uses x-forwarded-for ip', async () => {
    mockNetworkLog.hasRecentLog.mock.mockImplementation(async () => false);
    const created = { id: 7, connection_quality: 'failed' };
    mockNetworkLog.create.mock.mockImplementation(async () => created);

    const req = makeReq({
      body: { connection_quality: 'failed', error_details: 'timeout', experience_id: 12 },
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
      ip: '127.0.0.1',
      userId: 42,
    });
    const res = makeRes();
    await logIssue(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    assert.deepEqual(res.json.mock.calls[0].arguments[0], created);
    const args = mockNetworkLog.create.mock.calls[0].arguments[0];
    assert.equal(args.user_id, 42);
    assert.equal(args.experience_id, 12);
    assert.equal(args.connection_quality, 'failed');
    assert.equal(args.ip_address, '203.0.113.1');
    assert.equal(args.error_details, 'timeout');
  });

  it('201 : truncates long error_details to 500 chars and falls back to req.ip', async () => {
    mockNetworkLog.hasRecentLog.mock.mockImplementation(async () => false);
    mockNetworkLog.create.mock.mockImplementation(async (row) => row);

    const longDetails = 'x'.repeat(800);
    const req = makeReq({
      body: { connection_quality: 'offline', error_details: longDetails },
      ip: '198.51.100.5',
      userId: 1,
    });
    const res = makeRes();
    await logIssue(req, res);

    const args = mockNetworkLog.create.mock.calls[0].arguments[0];
    assert.equal(args.ip_address, '198.51.100.5');
    assert.equal(args.error_details.length, 500);
    assert.equal(args.experience_id, null);
  });

  it('201 : non-string error_details becomes null', async () => {
    mockNetworkLog.hasRecentLog.mock.mockImplementation(async () => false);
    mockNetworkLog.create.mock.mockImplementation(async (row) => row);

    const req = makeReq({
      body: { connection_quality: 'slow', error_details: { not: 'a string' } },
      userId: 3,
    });
    const res = makeRes();
    await logIssue(req, res);

    const args = mockNetworkLog.create.mock.calls[0].arguments[0];
    assert.equal(args.error_details, null);
  });

  it('500 : database failure on create', async () => {
    mockNetworkLog.hasRecentLog.mock.mockImplementation(async () => false);
    mockNetworkLog.create.mock.mockImplementation(async () => { throw new Error('DB down'); });

    const req = makeReq({ body: { connection_quality: 'slow' }, userId: 1 });
    const res = makeRes();
    await logIssue(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.match(res.json.mock.calls[0].arguments[0].error, /failed/i);
  });
});

describe('getMyQuality()', () => {
  beforeEach(resetMocks);

  it('200 : returns the summary for the current user', async () => {
    const summary = { quality: 'good', sample_count: 12 };
    mockNetworkLog.getQualityForUser.mock.mockImplementation(async () => summary);

    const req = makeReq({ userId: 99 });
    const res = makeRes();
    await getMyQuality(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], summary);
    assert.equal(mockNetworkLog.getQualityForUser.mock.calls[0].arguments[0], 99);
  });

  it('500 : database error', async () => {
    mockNetworkLog.getQualityForUser.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq({ userId: 1 });
    const res = makeRes();
    await getMyQuality(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getExperienceQuality()', () => {
  beforeEach(resetMocks);

  it('404 : experience not found', async () => {
    mockExperience.findById.mock.mockImplementation(async () => null);

    const req = makeReq({ params: { id: '99' } });
    const res = makeRes();
    await getExperienceQuality(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].error, /not found/i);
  });

  it('200 : returns experience and ehost quality', async () => {
    mockExperience.findById.mock.mockImplementation(async () => ({ id: 5, ehost_id: 17 }));
    mockNetworkLog.getQualityForExperience.mock.mockImplementation(async () => ({ quality: 'good' }));
    mockNetworkLog.getQualityForEhost.mock.mockImplementation(async () => ({ quality: 'slow' }));

    const req = makeReq({ params: { id: '5' } });
    const res = makeRes();
    await getExperienceQuality(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.deepEqual(body.experience, { quality: 'good' });
    assert.deepEqual(body.ehost, { quality: 'slow' });
    assert.equal(mockNetworkLog.getQualityForExperience.mock.calls[0].arguments[0], 5);
    assert.equal(mockNetworkLog.getQualityForEhost.mock.calls[0].arguments[0], 17);
  });

  it('500 : database error while fetching summaries', async () => {
    mockExperience.findById.mock.mockImplementation(async () => ({ id: 5, ehost_id: 17 }));
    mockNetworkLog.getQualityForExperience.mock.mockImplementation(async () => { throw new Error('DB fail'); });
    mockNetworkLog.getQualityForEhost.mock.mockImplementation(async () => ({}));

    const req = makeReq({ params: { id: '5' } });
    const res = makeRes();
    await getExperienceQuality(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getAdminSummary()', () => {
  beforeEach(resetMocks);

  it('200 : default window (168h) when no query', async () => {
    const summary = { totals: {}, top: [] };
    mockNetworkLog.adminSummary.mock.mockImplementation(async () => summary);

    const req = makeReq();
    const res = makeRes();
    await getAdminSummary(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], summary);
    const args = mockNetworkLog.adminSummary.mock.calls[0].arguments[0];
    assert.equal(args.sinceHours, 168);
    assert.equal(args.limit, 50);
  });

  it('200 : accepts allowed window 24', async () => {
    mockNetworkLog.adminSummary.mock.mockImplementation(async () => ({}));

    const req = makeReq({ query: { hours: '24' } });
    const res = makeRes();
    await getAdminSummary(req, res);

    assert.equal(mockNetworkLog.adminSummary.mock.calls[0].arguments[0].sinceHours, 24);
  });

  it('200 : accepts allowed window 720', async () => {
    mockNetworkLog.adminSummary.mock.mockImplementation(async () => ({}));

    const req = makeReq({ query: { hours: '720' } });
    const res = makeRes();
    await getAdminSummary(req, res);

    assert.equal(mockNetworkLog.adminSummary.mock.calls[0].arguments[0].sinceHours, 720);
  });

  it('400 : rejects an unsupported window', async () => {
    const req = makeReq({ query: { hours: '5' } });
    const res = makeRes();
    await getAdminSummary(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].error, /hours/i);
    assert.equal(mockNetworkLog.adminSummary.mock.callCount(), 0);
  });

  it('500 : database error', async () => {
    mockNetworkLog.adminSummary.mock.mockImplementation(async () => { throw new Error('DB fail'); });

    const req = makeReq();
    const res = makeRes();
    await getAdminSummary(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});
