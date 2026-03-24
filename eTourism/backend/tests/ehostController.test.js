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
  fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));
}

describe('submitApplication()', () => {
  beforeEach(resetMocks);

  it('201 : submits application successfully', async () => {
    let calls = 0;
    fakePool.query.mock.mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.resolve({ rows: [] });       // duplicate check
      return Promise.resolve({ rows: [{ id: 1 }] });               // insert
    });

    const req = makeReq({
      name: 'John Smith', birthday: '1990-01-01', nationality: 'UK',
      email: 'john@example.com', hasExperience: true, preferredCountry: 'UK',
      description: 'Great tour guide', videoLink: 'https://youtube.com/x',
      isContractAgreed: true,
    });
    const res = makeRes();
    await submitApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    assert.equal(res.json.mock.calls[0].arguments[0].applicationId, 1);
  });

  it('409 : email already submitted an application', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [{ id: 99 }] }));

    const req = makeReq({ email: 'existing@example.com' });
    const res = makeRes();
    await submitApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already submitted/i);
  });

  it('500 : database error on duplicate check', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({ email: 'john@example.com' });
    const res = makeRes();
    await submitApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });

  it('500 : database error on insert', async () => {
    let calls = 0;
    fakePool.query.mock.mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.resolve({ rows: [] });
      return Promise.reject(new Error('Insert fail'));
    });

    const req = makeReq({
      name: 'John Smith', birthday: '1990-01-01', nationality: 'UK',
      email: 'john@example.com', hasExperience: true, preferredCountry: 'UK',
      description: 'Great tour guide', videoLink: 'https://youtube.com/x',
      isContractAgreed: true,
    });
    const res = makeRes();
    await submitApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getExperiences()', () => {
  beforeEach(resetMocks);

  it('200 : returns list of experiences for ehost', async () => {
    const experiences = [
      { id: 1, location_name: 'London', price: 50, status: 'approved' },
      { id: 2, location_name: 'Paris', price: 80, status: 'pending' },
    ];
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: experiences }));

    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getExperiences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, experiences);
  });

  it('200 : returns empty array when ehost has no experiences', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getExperiences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, []);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getExperiences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getExperienceById()', () => {
  beforeEach(resetMocks);

  it('200 : returns experience when found and owned by ehost', async () => {
    const experience = { id: 1, title: 'City Tour', ehost_id: 5 };
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [experience] }));

    const req = makeReq({}, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await getExperienceById(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, experience);
  });

  it('404 : experience not found or not owned by ehost', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq({}, { id: '999' }, {}, { id: 5 });
    const res = makeRes();
    await getExperienceById(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await getExperienceById(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('updateExperience()', () => {
  beforeEach(resetMocks);

  it('200 : updates experience and sets status to pending', async () => {
    const updated = { id: 1, location_name: 'New York', status: 'pending' };
    // first query: ownership check
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1 }] }));
    // second query: update
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({ rows: [updated] }));

    const req = makeReq({ location_name: 'New York', price: 60 }, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, updated);
  });

  it('404 : experience not found or not owned by ehost', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq({ location_name: 'New York' }, { id: '999' }, {}, { id: 5 });
    const res = makeRes();
    await updateExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('500 : database error on ownership check', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({ location_name: 'New York' }, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });

  it('500 : database error on update', async () => {
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1 }] }));
    fakePool.query.mock.mockImplementationOnce(() => Promise.reject(new Error('Update fail')));

    const req = makeReq({ location_name: 'New York' }, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('deleteExperience()', () => {
  beforeEach(resetMocks);

  it('200 : soft-deletes experience successfully', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [{ id: 1 }] }));

    const req = makeReq({}, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await deleteExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.match(res.json.mock.calls[0].arguments[0].message, /removed/i);
  });

  it('404 : experience not found or not owned by ehost', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq({}, { id: '999' }, {}, { id: 5 });
    const res = makeRes();
    await deleteExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await deleteExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('createExperience()', () => {
  beforeEach(resetMocks);

  it('201 : creates experience successfully', async () => {
    const newExp = { id: 1, title: 'City Tour', status: 'pending' };
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [newExp] }));

    const req = makeReq({
      title: 'City Tour', location_name: 'London', country: 'UK',
      price: 50, description: 'A great tour', cover_image: 'https://img.com/x.jpg',
    }, {}, {}, { id: 5 });
    const res = makeRes();
    await createExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, newExp);
  });

  it('400 : missing required fields', async () => {
    const req = makeReq({ title: 'City Tour' }, {}, {}, { id: 5 });
    const res = makeRes();
    await createExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('400 : missing cover image', async () => {
    const req = makeReq({
      title: 'City Tour', location_name: 'London', country: 'UK',
      price: 50, description: 'A great tour',
    }, {}, {}, { id: 5 });
    const res = makeRes();
    await createExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({
      title: 'City Tour', location_name: 'London', country: 'UK',
      price: 50, description: 'A great tour', cover_image: 'https://img.com/x.jpg',
    }, {}, {}, { id: 5 });
    const res = makeRes();
    await createExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getBookings()', () => {
  beforeEach(resetMocks);

  it('200 : placeholder returns bookings message', async () => {
    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getBookings(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.match(res.json.mock.calls[0].arguments[0].message, /placeholder/i);
  });
});
