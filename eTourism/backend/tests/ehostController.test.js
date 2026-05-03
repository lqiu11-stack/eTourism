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
  getBookingsByExperience,
  getCalendarSlots,
  createCalendarSlot,
  updateCalendarSlot,
  deleteCalendarSlot,
  setUnavailableDates,
  getBookingPreferences,
  updateBookingPreferences,
  getMe,
  updateMe,
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
      if (calls === 1) return Promise.resolve({ rows: [] });       // ehost_applications dup check
      if (calls === 2) return Promise.resolve({ rows: [] });       // User.findByEmail check
      return Promise.resolve({ rows: [{ id: 1 }] });               // insert
    });

    const req = makeReq({
      name: 'John Smith', birthday: '1990-01-01', country: 'UK', gender: 'male',
      email: 'john@example.com', password: 'Secret123!', hasExperience: true, preferredCountry: 'UK',
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

    const req = makeReq({ email: 'existing@example.com', gender: 'male' });
    const res = makeRes();
    await submitApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already submitted/i);
  });

  it('500 : database error on duplicate check', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({ email: 'john@example.com', gender: 'male' });
    const res = makeRes();
    await submitApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });

  it('500 : database error on insert', async () => {
    let calls = 0;
    fakePool.query.mock.mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.resolve({ rows: [] });   // ehost_applications dup check
      if (calls === 2) return Promise.resolve({ rows: [] });   // User.findByEmail check
      return Promise.reject(new Error('Insert fail'));
    });

    const req = makeReq({
      name: 'John Smith', birthday: '1990-01-01', country: 'UK', gender: 'male',
      email: 'john@example.com', password: 'Secret123!', hasExperience: true, preferredCountry: 'UK',
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

  const futureSlot = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const fullPayload = () => ({
    title: 'City Tour',
    location_name: 'New York',
    country: 'United States',
    price: 60,
    description: 'An updated description',
    cover_image: 'https://img.com/x.jpg',
    additional_images: ['https://img.com/a.jpg', 'https://img.com/b.jpg', 'https://img.com/c.jpg'],
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    sample_video_url: 'https://youtube.com/watch?v=abcdefghijk',
    video_description: 'A short clip showing what visitors will see.',
    date_time: futureSlot(),
    duration_minutes: 60,
    max_visitors: 10,
  });

  it('200 : updates pending experience successfully', async () => {
    const updated = { id: 1, location_name: 'New York', status: 'pending' };
    let callCount = 0;
    fakePool.query.mock.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return Promise.resolve({ rows: [{ id: 1, status: 'pending' }] });
      // overlap check (findOverlappingSlot) — return no conflict
      if (callCount === 2) return Promise.resolve({ rows: [] });
      return Promise.resolve({ rows: [updated] });
    });

    const req = makeReq(fullPayload(), { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, updated);
  });

  it('403 : refuses to edit experience that is not pending or approved', async () => {
    fakePool.query.mock.mockImplementation(() =>
      Promise.resolve({ rows: [{ id: 1, status: 'rejected' }] })
    );

    const req = makeReq(fullPayload(), { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    // ownership lookup only — no UPDATE issued
    assert.equal(fakePool.query.mock.callCount(), 1);
  });

  it('404 : experience not found or not owned by ehost', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq(fullPayload(), { id: '999' }, {}, { id: 5 });
    const res = makeRes();
    await updateExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('400 : missing required fields', async () => {
    fakePool.query.mock.mockImplementation(() =>
      Promise.resolve({ rows: [{ id: 1, status: 'pending' }] })
    );

    const req = makeReq({ title: 'Just a title' }, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('500 : database error on ownership check', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq(fullPayload(), { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });

  it('500 : database error on update', async () => {
    fakePool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [{ id: 1, status: 'pending' }] })
    );
    fakePool.query.mock.mockImplementationOnce(() => Promise.reject(new Error('Update fail')));

    const req = makeReq(fullPayload(), { id: '1' }, {}, { id: 5 });
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

  it('403 : experience not found, not owned, or already approved', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq({}, { id: '999' }, {}, { id: 5 });
    const res = makeRes();
    await deleteExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
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

  const futureSlot = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const validCreatePayload = (overrides = {}) => ({
    title: 'City Tour',
    location_name: 'London',
    country: 'UK',
    price: 50,
    description: 'A great tour',
    cover_image: 'https://img.com/x.jpg',
    additional_images: ['https://img.com/a.jpg', 'https://img.com/b.jpg', 'https://img.com/c.jpg'],
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    sample_video_url: 'https://youtube.com/watch?v=abcdefghijk',
    video_description: 'A short clip showing what visitors will see.',
    date_time: futureSlot(),
    duration_minutes: 60,
    max_visitors: 10,
    ...overrides,
  });

  it('201 : creates experience successfully', async () => {
    const newExp = { id: 1, title: 'City Tour', status: 'pending' };
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [newExp] }));

    const req = makeReq(validCreatePayload(), {}, {}, { id: 5 });
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
    const payload = validCreatePayload();
    delete payload.cover_image;
    const req = makeReq(payload, {}, {}, { id: 5 });
    const res = makeRes();
    await createExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq(validCreatePayload(), {}, {}, { id: 5 });
    const res = makeRes();
    await createExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });

  it('400 : invalid gender_preference', async () => {
    const req = makeReq(validCreatePayload({ gender_preference: 'unknown_value' }), {}, {}, { id: 5 });
    const res = makeRes();
    await createExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /Invalid gender_preference/);
  });
});

describe('getBookings()', () => {
  beforeEach(resetMocks);

  it('200 : returns upcoming confirmed bookings with experience meeting link', async () => {
    const rows = [{
      id: 1,
      meeting_link: 'https://zoom.us/j/123',
    }];
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows }));
    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getBookings(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].data[0].meeting_config.link, 'https://zoom.us/j/123');
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));
    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getBookings(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });

});

describe('getCalendarSlots()', () => {
  beforeEach(resetMocks);

  it('200 : returns calendar slots for ehost', async () => {
    const rows = [{ id: 1, title: 'Tour', date_time: '2026-07-01T10:00:00.000Z', duration_minutes: 60 }];
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({ rows }));
    const req = makeReq({}, {}, {}, { id: 5 });
    req.query = {};
    const res = makeRes();
    await getCalendarSlots(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].data.length, 1);
  });

  it('400 : invalid from_date', async () => {
    const req = makeReq({}, {}, {}, { id: 5 });
    req.query = { from_date: 'invalid-date' };
    const res = makeRes();
    await getCalendarSlots(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('400 : from_date later than to_date', async () => {
    const req = makeReq({}, {}, {}, { id: 5 });
    req.query = { from_date: '2026-07-10T10:00:00Z', to_date: '2026-07-01T10:00:00Z' };
    const res = makeRes();
    await getCalendarSlots(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });
});

describe('createCalendarSlot()', () => {
  beforeEach(resetMocks);

  it('200 : creates calendar slot when no overlap', async () => {
    let callCount = 0;
    fakePool.query.mock.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({ rows: [{ id: 10, title: 'Tour A', duration_minutes: 60 }] });
      }
      if (callCount === 2) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [{ id: 10, title: 'Tour A', date_time: '2026-07-01T10:00:00.000Z', duration_minutes: 60, status: 'pending' }] });
    });
    const req = makeReq({ experience_id: 10, date_time: '2026-07-01T10:00:00.000Z' }, {}, {}, { id: 5 });
    const res = makeRes();
    await createCalendarSlot(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].data.id, 10);
  });

  it('409 : rejects overlapping slot', async () => {
    let callCount = 0;
    fakePool.query.mock.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({ rows: [{ id: 10, title: 'Tour A', duration_minutes: 60 }] });
      }
      if (callCount === 2) {
        return Promise.resolve({
          rows: [{ id: 11, title: 'Tour B', date_time: '2026-07-01T10:30:00.000Z', duration_minutes: 60 }],
        });
      }
      return Promise.resolve({ rows: [] });
    });
    const req = makeReq({ experience_id: 10, date_time: '2026-07-01T10:00:00.000Z', duration_minutes: 60 }, {}, {}, { id: 5 });
    const res = makeRes();
    await createCalendarSlot(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
  });
});

describe('updateCalendarSlot()', () => {
  beforeEach(resetMocks);

  it('200 : updates calendar slot', async () => {
    let callCount = 0;
    fakePool.query.mock.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({ rows: [{ id: 10, title: 'Tour A', duration_minutes: 60 }] });
      }
      if (callCount === 2) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [{ id: 10, title: 'Tour A', date_time: '2026-07-01T12:00:00.000Z', duration_minutes: 90, status: 'pending' }] });
    });
    const req = makeReq({ date_time: '2026-07-01T12:00:00.000Z', duration_minutes: 90 }, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await updateCalendarSlot(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].data.duration_minutes, 90);
  });
});

describe('deleteCalendarSlot()', () => {
  beforeEach(resetMocks);

  it('200 : deletes calendar slot when no active bookings', async () => {
    let callCount = 0;
    fakePool.query.mock.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({ rows: [{ id: 10 }] });
      }
      if (callCount === 2) {
        return Promise.resolve({ rows: [{ active_count: 0 }] });
      }
      return Promise.resolve({ rows: [{ id: 10, title: 'Tour A', date_time: null, duration_minutes: 60, status: 'pending' }] });
    });
    const req = makeReq({}, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await deleteCalendarSlot(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].data.date_time, null);
  });

  it('409 : blocks deleting slot with active bookings', async () => {
    let callCount = 0;
    fakePool.query.mock.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({ rows: [{ id: 10 }] });
      }
      if (callCount === 2) {
        return Promise.resolve({ rows: [{ active_count: 2 }] });
      }
      return Promise.resolve({ rows: [] });
    });
    const req = makeReq({}, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await deleteCalendarSlot(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
  });
});

describe('setUnavailableDates()', () => {
  beforeEach(resetMocks);

  it('200 : clears unbooked slots and keeps booked slots', async () => {
    let callCount = 0;
    fakePool.query.mock.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({
          rows: [
            { id: 10, title: 'Tour A', date_time: '2026-07-01T10:00:00.000Z' },
            { id: 11, title: 'Tour B', date_time: '2026-07-01T14:00:00.000Z' },
          ],
        });
      }
      if (callCount === 2) {
        return Promise.resolve({ rows: [{ experience_id: 11 }] });
      }
      return Promise.resolve({ rows: [] });
    });
    const req = makeReq({ unavailable_dates: ['2026-07-01'] }, {}, {}, { id: 5 });
    const res = makeRes();
    await setUnavailableDates(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const payload = res.json.mock.calls[0].arguments[0];
    assert.deepEqual(payload.data.cleared_experience_ids, [10]);
    assert.deepEqual(payload.data.blocked_experience_ids, [11]);
  });

  it('400 : invalid unavailable date format', async () => {
    const req = makeReq({ unavailable_dates: ['2026/07/01'] }, {}, {}, { id: 5 });
    const res = makeRes();
    await setUnavailableDates(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });
});

describe('getBookingPreferences()', () => {
  beforeEach(resetMocks);

  it('200 : returns booking preferences for owned experience', async () => {
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({
      rows: [{ id: 10, gender_preference: 'female_only', max_visitors: 8, date_time: '2026-06-01T10:00:00.000Z' }],
    }));
    const req = makeReq({}, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await getBookingPreferences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const payload = res.json.mock.calls[0].arguments[0];
    assert.equal(payload.data.gender_preference, 'female_only');
    assert.equal(payload.data.max_visitors, 8);
  });

  it('400 : invalid experience id', async () => {
    const req = makeReq({}, { id: 'abc' }, {}, { id: 5 });
    const res = makeRes();
    await getBookingPreferences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('404 : experience not found or not owned', async () => {
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({ rows: [] }));
    const req = makeReq({}, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await getBookingPreferences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });
});

describe('updateBookingPreferences()', () => {
  beforeEach(resetMocks);

  it('200 : updates gender preference and max visitors', async () => {
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({
      rows: [{ id: 10, gender_preference: 'mixed', max_visitors: 6, date_time: '2026-06-01T10:00:00.000Z' }],
    }));
    const req = makeReq({ gender_preference: 'no_all_male_groups', max_visitors: 6 }, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingPreferences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const payload = res.json.mock.calls[0].arguments[0];
    assert.equal(payload.data.gender_preference, 'mixed');
    assert.equal(payload.data.max_visitors, 6);
  });

  it('400 : missing preference fields', async () => {
    const req = makeReq({}, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingPreferences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('400 : invalid gender_preference', async () => {
    const req = makeReq({ gender_preference: 'invalid' }, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingPreferences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('400 : invalid max_visitors', async () => {
    const req = makeReq({ max_visitors: -3 }, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingPreferences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('404 : experience not found or not owned', async () => {
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({ rows: [] }));
    const req = makeReq({ gender_preference: 'any' }, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingPreferences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });
});

describe('getBookingsByExperience()', () => {
  beforeEach(resetMocks);

  it('200 : returns bookings list when ehost owns the experience', async () => {
    const owned = { id: 7, title: 'My Tour' };
    const bookings = [
      { id: 1, status: 'confirmed', qty_normal: 2, contact_email: 'a@b.com', first_name: 'Alice' },
    ];
    let calls = 0;
    fakePool.query.mock.mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.resolve({ rows: [owned] });   // ownership lookup
      return Promise.resolve({ rows: bookings });                    // bookings list
    });

    const req = makeReq({}, { id: '7' }, {}, { id: 5 });
    const res = makeRes();
    await getBookingsByExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, { experience: owned, bookings });
  });

  it('400 : invalid experience id', async () => {
    const req = makeReq({}, { id: 'abc' }, {}, { id: 5 });
    const res = makeRes();
    await getBookingsByExperience(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('404 : experience not owned by this ehost', async () => {
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({ rows: [] }));
    const req = makeReq({}, { id: '7' }, {}, { id: 5 });
    const res = makeRes();
    await getBookingsByExperience(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));
    const req = makeReq({}, { id: '7' }, {}, { id: 5 });
    const res = makeRes();
    await getBookingsByExperience(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getMe()', () => {
  beforeEach(resetMocks);

  it('200 : returns ehost profile', async () => {
    const me = { id: 5, email: 'host@x.com', role: 'ehost', first_name: 'Host', display_name: 'TheHost' };
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [me] }));

    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getMe(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, me);
  });

  it('404 : user not found', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));
    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));
    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('updateMe()', () => {
  beforeEach(resetMocks);

  it('200 : updates editable profile fields', async () => {
    const updated = { id: 5, first_name: 'New', last_name: 'Name', display_name: 'Newbie' };
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [updated] }));

    const req = makeReq({ first_name: 'New', last_name: 'Name', display_name: 'Newbie' }, {}, {}, { id: 5 });
    const res = makeRes();
    await updateMe(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, updated);
  });

  it('400 : no editable fields supplied', async () => {
    const req = makeReq({ password: 'hack' }, {}, {}, { id: 5 });
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('400 : invalid language', async () => {
    const req = makeReq({ language: 'Klingon' }, {}, {}, { id: 5 });
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /language/i);
  });

  it('clears empty string fields to null', async () => {
    const updated = { id: 5, display_name: null };
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [updated] }));

    const req = makeReq({ display_name: '' }, {}, {}, { id: 5 });
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    // The SET clause params should include `null` for the cleared field
    assert.ok(fakePool.query.mock.calls[0].arguments[1].includes(null));
  });

  it('404 : user not found', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));
    const req = makeReq({ first_name: 'A' }, {}, {}, { id: 5 });
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));
    const req = makeReq({ first_name: 'A' }, {}, {}, { id: 5 });
    const res = makeRes();
    await updateMe(req, res);
    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

