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
  getCalendarSlots,
  createCalendarSlot,
  updateCalendarSlot,
  deleteCalendarSlot,
  setUnavailableDates,
  updateBookingMeetingLink,
  getBookingPreferences,
  updateBookingPreferences,
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
      name: 'John Smith', birthday: '1990-01-01', country: 'UK',
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
      name: 'John Smith', birthday: '1990-01-01', country: 'UK',
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
    let callCount = 0;
    fakePool.query.mock.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({ rows: [{ id: 1 }] });
      }
      return Promise.resolve({ rows: [updated] });
    });

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

  it('400 : invalid gender_preference', async () => {
    const req = makeReq({
      title: 'City Tour', location_name: 'London', country: 'UK',
      price: 50, description: 'A great tour', cover_image: 'https://img.com/x.jpg',
      gender_preference: 'unknown_value',
    }, {}, {}, { id: 5 });
    const res = makeRes();
    await createExperience(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /Invalid gender_preference/);
  });
});

describe('getBookings()', () => {
  beforeEach(resetMocks);

  it('200 : returns upcoming confirmed bookings and service suggestions', async () => {
    const rows = [{
      id: 1,
      meeting_link: JSON.stringify({ platform: 'Zoom', link: 'https://zoom.us/j/123', password: '8899' }),
    }];
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows }));
    const req = makeReq({}, {}, {}, { id: 5 });
    const res = makeRes();
    await getBookings(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].suggested_services, ['Google Meet', 'Zoom', 'WhatsApp']);
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
      rows: [{ id: 10, gender_preference: 'no_all_male_groups', max_visitors: 6, date_time: '2026-06-01T10:00:00.000Z' }],
    }));
    const req = makeReq({ gender_preference: 'no_all_male_groups', max_visitors: 6 }, { id: '10' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingPreferences(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    const payload = res.json.mock.calls[0].arguments[0];
    assert.equal(payload.data.gender_preference, 'no_all_male_groups');
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

describe('updateBookingMeetingLink()', () => {
  beforeEach(resetMocks);

  it('200 : updates meeting link for upcoming confirmed booking', async () => {
    let callCount = 0;
    fakePool.query.mock.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({ rows: [{ id: 1 }] });
      }
      return Promise.resolve({
        rows: [{
          id: 1,
          meeting_link: JSON.stringify({ platform: 'Google Meet', link: 'https://meet.google.com/abc-defg-hij', password: '2233' }),
        }],
      });
    });

    const req = makeReq(
      { platform: 'Google Meet', meeting_link: 'https://meet.google.com/abc-defg-hij', meeting_password: '2233' },
      { id: '1' },
      {},
      { id: 5 }
    );
    const res = makeRes();
    await updateBookingMeetingLink(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].data.meeting_config.password, '2233');
  });

  it('400 : invalid booking id', async () => {
    const req = makeReq({ meeting_link: 'https://zoom.us/j/123' }, { id: 'abc' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingMeetingLink(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('400 : invalid meeting link format', async () => {
    const req = makeReq({ meeting_link: 'zoom.us/j/123' }, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingMeetingLink(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
  });

  it('404 : booking not upcoming or not owned by ehost', async () => {
    fakePool.query.mock.mockImplementationOnce(() => Promise.resolve({ rows: [] }));
    const req = makeReq({ meeting_link: 'https://zoom.us/j/123' }, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingMeetingLink(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementationOnce(() => Promise.reject(new Error('DB fail')));
    const req = makeReq({ meeting_link: 'https://zoom.us/j/123' }, { id: '1' }, {}, { id: 5 });
    const res = makeRes();
    await updateBookingMeetingLink(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});
