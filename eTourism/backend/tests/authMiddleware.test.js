'use strict';

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test_secret';

const fakeJwt = { verify: mock.fn() };
require.cache[require.resolve('jsonwebtoken')] = {
  id: require.resolve('jsonwebtoken'),
  filename: require.resolve('jsonwebtoken'),
  loaded: true,
  exports: fakeJwt,
  children: [],
  paths: [],
};

const { requireAuth, requireRole, validateApplication } = require('../middleware/auth');

function makeRes() {
  const res = {};
  res.status = mock.fn(() => res);
  res.json   = mock.fn(() => res);
  return res;
}

function makeReq(headers = {}, body = {}) {
  return { headers, body };
}

function resetMocks() {
  fakeJwt.verify.mock.resetCalls();
}

describe('requireAuth()', () => {
  beforeEach(resetMocks);

  it('401 : no Authorization header', () => {
    const req = makeReq({});
    const res = makeRes();
    const next = mock.fn();
    requireAuth(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.match(res.json.mock.calls[0].arguments[0].error, /no token/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('401 : Authorization header does not start with "Bearer "', () => {
    const req = makeReq({ authorization: 'Basic abc123' });
    const res = makeRes();
    const next = mock.fn();
    requireAuth(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.match(res.json.mock.calls[0].arguments[0].error, /no token/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('401 : token is invalid or expired', () => {
    fakeJwt.verify.mock.mockImplementation(() => { throw new Error('jwt expired'); });

    const req = makeReq({ authorization: 'Bearer bad_token' });
    const res = makeRes();
    const next = mock.fn();
    requireAuth(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.match(res.json.mock.calls[0].arguments[0].error, /invalid token/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('passes : valid token — sets req.userId, req.userRole and calls next()', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 42, role: 'visitor' }));

    const req = makeReq({ authorization: 'Bearer valid_token' });
    const res = makeRes();
    const next = mock.fn();
    requireAuth(req, res, next);

    assert.equal(req.userId, 42);
    assert.equal(req.userRole, 'visitor');
    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.status.mock.callCount(), 0);
  });
});

describe('requireRole() - visitor role', () => {
  beforeEach(resetMocks);

  const middleware = requireRole('visitor');

  it('401 : no Authorization header', () => {
    const req = makeReq({});
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.match(res.json.mock.calls[0].arguments[0].error, /no token/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('401 : token is invalid', () => {
    fakeJwt.verify.mock.mockImplementation(() => { throw new Error('invalid'); });

    const req = makeReq({ authorization: 'Bearer bad' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 401);
    assert.equal(next.mock.callCount(), 0);
  });

  it('403 : admin token rejected on visitor route', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 1, role: 'admin' }));

    const req = makeReq({ authorization: 'Bearer admin_token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.match(res.json.mock.calls[0].arguments[0].error, /forbidden/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('403 : ehost token rejected on visitor route', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 2, role: 'ehost' }));

    const req = makeReq({ authorization: 'Bearer ehost_token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.equal(next.mock.callCount(), 0);
  });

  it('passes : visitor token accepted — sets req.userId and req.userRole', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 10, role: 'visitor' }));

    const req = makeReq({ authorization: 'Bearer visitor_token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(req.userId, 10);
    assert.equal(req.userRole, 'visitor');
    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.status.mock.callCount(), 0);
  });
});

describe('requireRole() - ehost role', () => {
  beforeEach(resetMocks);

  const middleware = requireRole('ehost');

  it('403 : visitor token rejected on ehost route', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 1, role: 'visitor' }));

    const req = makeReq({ authorization: 'Bearer visitor_token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.equal(next.mock.callCount(), 0);
  });

  it('403 : admin token rejected on ehost route', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 1, role: 'admin' }));

    const req = makeReq({ authorization: 'Bearer admin_token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.equal(next.mock.callCount(), 0);
  });

  it('passes : ehost token accepted — sets req.userId and req.userRole', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 5, role: 'ehost' }));

    const req = makeReq({ authorization: 'Bearer ehost_token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(req.userId, 5);
    assert.equal(req.userRole, 'ehost');
    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.status.mock.callCount(), 0);
  });
});

describe('requireRole() - admin role', () => {
  beforeEach(resetMocks);

  const middleware = requireRole('admin');

  it('403 : visitor token rejected on admin route', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 1, role: 'visitor' }));

    const req = makeReq({ authorization: 'Bearer visitor_token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.equal(next.mock.callCount(), 0);
  });

  it('403 : ehost token rejected on admin route', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 2, role: 'ehost' }));

    const req = makeReq({ authorization: 'Bearer ehost_token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.equal(next.mock.callCount(), 0);
  });

  it('passes : admin token accepted — sets req.userId and req.userRole', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 1, role: 'admin' }));

    const req = makeReq({ authorization: 'Bearer admin_token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(req.userId, 1);
    assert.equal(req.userRole, 'admin');
    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.status.mock.callCount(), 0);
  });
});

describe('requireRole() - multiple roles allowed', () => {
  beforeEach(resetMocks);

  it('passes : visitor accepted when both visitor and ehost are allowed', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 1, role: 'visitor' }));
    const middleware = requireRole('visitor', 'ehost');

    const req = makeReq({ authorization: 'Bearer token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.status.mock.callCount(), 0);
  });

  it('passes : ehost accepted when both visitor and ehost are allowed', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 2, role: 'ehost' }));
    const middleware = requireRole('visitor', 'ehost');

    const req = makeReq({ authorization: 'Bearer token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.status.mock.callCount(), 0);
  });

  it('403 : admin rejected when only visitor and ehost are allowed', () => {
    fakeJwt.verify.mock.mockImplementation(() => ({ userId: 3, role: 'admin' }));
    const middleware = requireRole('visitor', 'ehost');

    const req = makeReq({ authorization: 'Bearer token' });
    const res = makeRes();
    const next = mock.fn();
    middleware(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 403);
    assert.equal(next.mock.callCount(), 0);
  });
});

describe('validateApplication()', () => {

  it('400 : missing name', () => {
    const req = makeReq({}, {
      birthday: '1990-01-01', nationality: 'UK', email: 'test@test.com',
      hasExperience: true, preferredCountry: 'UK',
      description: 'Great guide', videoLink: 'https://yt.com/x', isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /personal details/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('400 : missing birthday', () => {
    const req = makeReq({}, {
      name: 'John', nationality: 'UK', email: 'test@test.com',
      hasExperience: true, preferredCountry: 'UK',
      description: 'Great guide', videoLink: 'https://yt.com/x', isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /personal details/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('400 : missing nationality', () => {
    const req = makeReq({}, {
      name: 'John', birthday: '1990-01-01', email: 'test@test.com',
      hasExperience: true, preferredCountry: 'UK',
      description: 'Great guide', videoLink: 'https://yt.com/x', isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /personal details/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('400 : missing email', () => {
    const req = makeReq({}, {
      name: 'John', birthday: '1990-01-01', nationality: 'UK',
      hasExperience: true, preferredCountry: 'UK',
      description: 'Great guide', videoLink: 'https://yt.com/x', isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /personal details/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('400 : missing hasExperience', () => {
    const req = makeReq({}, {
      name: 'John', birthday: '1990-01-01', nationality: 'UK', email: 'test@test.com',
      preferredCountry: 'UK',
      description: 'Great guide', videoLink: 'https://yt.com/x', isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /experience details/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('400 : missing preferredCountry', () => {
    const req = makeReq({}, {
      name: 'John', birthday: '1990-01-01', nationality: 'UK', email: 'test@test.com',
      hasExperience: false,
      description: 'Great guide', videoLink: 'https://yt.com/x', isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /experience details/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('400 : missing description', () => {
    const req = makeReq({}, {
      name: 'John', birthday: '1990-01-01', nationality: 'UK', email: 'test@test.com',
      hasExperience: true, preferredCountry: 'UK',
      videoLink: 'https://yt.com/x', isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /required details/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('400 : missing videoLink', () => {
    const req = makeReq({}, {
      name: 'John', birthday: '1990-01-01', nationality: 'UK', email: 'test@test.com',
      hasExperience: true, preferredCountry: 'UK',
      description: 'Great guide', isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /required details/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('400 : isContractAgreed is false', () => {
    const req = makeReq({}, {
      name: 'John', birthday: '1990-01-01', nationality: 'UK', email: 'test@test.com',
      hasExperience: true, preferredCountry: 'UK',
      description: 'Great guide', videoLink: 'https://yt.com/x', isContractAgreed: false,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /privacy policy/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('400 : isContractAgreed is undefined', () => {
    const req = makeReq({}, {
      name: 'John', birthday: '1990-01-01', nationality: 'UK', email: 'test@test.com',
      hasExperience: true, preferredCountry: 'UK',
      description: 'Great guide', videoLink: 'https://yt.com/x',
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /privacy policy/i);
    assert.equal(next.mock.callCount(), 0);
  });

  it('passes : all required fields present with isContractAgreed true', () => {
    const req = makeReq({}, {
      name: 'John Smith', birthday: '1990-01-01', nationality: 'UK', email: 'john@test.com',
      hasExperience: true, preferredCountry: 'UK',
      description: 'Experienced guide', videoLink: 'https://youtube.com/x',
      isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.status.mock.callCount(), 0);
  });

  it('passes : hasExperience false is valid when all other fields provided', () => {
    const req = makeReq({}, {
      name: 'Jane Smith', birthday: '1995-05-15', nationality: 'FR', email: 'jane@test.com',
      hasExperience: false, preferredCountry: 'France',
      description: 'New guide eager to learn', videoLink: 'https://youtube.com/y',
      isContractAgreed: true,
    });
    const res = makeRes();
    const next = mock.fn();
    validateApplication(req, res, next);

    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.status.mock.callCount(), 0);
  });
});
