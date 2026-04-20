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

const mockUser = {
  findByEmail: mock.fn(),
  create: mock.fn(),
  findAll: mock.fn(),
  findById: mock.fn(),
  update: mock.fn(),
  delete: mock.fn(),
};
require.cache[path.resolve(__dirname, '../models/User.js')] = {
  id: path.resolve(__dirname, '../models/User.js'),
  filename: path.resolve(__dirname, '../models/User.js'),
  loaded: true,
  exports: mockUser,
  children: [],
  paths: [],
};

const fakeBcrypt = { hash: mock.fn() };
require.cache[require.resolve('bcrypt')] = {
  id: require.resolve('bcrypt'),
  filename: require.resolve('bcrypt'),
  loaded: true,
  exports: fakeBcrypt,
  children: [],
  paths: [],
};

const {
  createUser,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getApplications,
  approveApplication,
  rejectApplication,
  getNetworkLogs,
  getNetworkIssueStats,
  reportNetworkIssue,
} = require('../controllers/adminController');

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
  mockUser.findAll.mock.resetCalls();
  mockUser.findById.mock.resetCalls();
  mockUser.update.mock.resetCalls();
  mockUser.delete.mock.resetCalls();
  fakeBcrypt.hash.mock.resetCalls();
  fakePool.query.mock.resetCalls();
  fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));
}

describe('createUser()', () => {
  beforeEach(resetMocks);

  it('201 : creates a user successfully', async () => {
    fakeBcrypt.hash.mock.mockImplementation(async () => 'hashed_pw');
    mockUser.findByEmail.mock.mockImplementation(async () => null);
    mockUser.create.mock.mockImplementation(async () => ({
      id: 5, email: 'admin@test.com', role: 'admin',
      first_name: 'Admin', last_name: 'User',
    }));

    const req = makeReq({
      email: 'admin@test.com', password: 'pass123', role: 'admin',
      first_name: 'Admin', last_name: 'User',
    });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    const body = res.json.mock.calls[0].arguments[0];
    assert.equal(body.message, 'User created successfully');
    assert.ok(body.user);
  });

  it('400 : missing required fields', async () => {
    const req = makeReq({ email: 'test@test.com', role: 'visitor' });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /required/i);
  });

  it('400 : invalid role', async () => {
    const req = makeReq({
      email: 'test@test.com', password: 'pass', role: 'superuser',
      first_name: 'A', last_name: 'B',
    });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /role/i);
  });

  it('409 : email already in use', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => ({ id: 1 }));

    const req = makeReq({
      email: 'exists@test.com', password: 'pass', role: 'visitor',
      first_name: 'A', last_name: 'B',
    });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already in use/i);
  });

  it('500 : database error on create', async () => {
    mockUser.findByEmail.mock.mockImplementation(async () => null);
    fakeBcrypt.hash.mock.mockImplementation(async () => 'hashed_pw');
    mockUser.create.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({
      email: 'new@test.com', password: 'pass', role: 'visitor',
      first_name: 'A', last_name: 'B',
    });
    const res = makeRes();
    await createUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getUsers()', () => {
  beforeEach(resetMocks);

  it('200 : returns all users', async () => {
    const users = [
      { id: 1, email: 'a@test.com', role: 'visitor' },
      { id: 2, email: 'b@test.com', role: 'admin' },
    ];
    mockUser.findAll.mock.mockImplementation(async () => users);

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getUsers(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], users);
  });

  it('200 : passes role and status filters to model', async () => {
    mockUser.findAll.mock.mockImplementation(async ({ role, status }) => {
      assert.equal(role, 'admin');
      assert.equal(status, 'active');
      return [];
    });

    const req = makeReq({}, {}, { role: 'admin', status: 'active' });
    const res = makeRes();
    await getUsers(req, res);

    assert.equal(res.json.mock.callCount(), 1);
  });

  it('500 : database error', async () => {
    mockUser.findAll.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getUsers(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getUserById()', () => {
  beforeEach(resetMocks);

  it('200 : returns user when found', async () => {
    const user = { id: 1, email: 'a@test.com', role: 'visitor' };
    mockUser.findById.mock.mockImplementation(async () => user);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await getUserById(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], user);
  });

  it('404 : user not found', async () => {
    mockUser.findById.mock.mockImplementation(async () => null);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();
    await getUserById(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockUser.findById.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await getUserById(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('updateUserStatus()', () => {
  beforeEach(resetMocks);

  it('200 : suspends a user', async () => {
    const updatedUser = { id: 1, status: 'suspended' };
    mockUser.update.mock.mockImplementation(async () => updatedUser);

    const req = makeReq({ status: 'suspended' }, { id: '1' });
    const res = makeRes();
    await updateUserStatus(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /suspended/i);
    assert.deepEqual(body.user, updatedUser);
  });

  it('200 : reactivates a user', async () => {
    mockUser.update.mock.mockImplementation(async () => ({ id: 1, status: 'active' }));

    const req = makeReq({ status: 'active' }, { id: '1' });
    const res = makeRes();
    await updateUserStatus(req, res);

    assert.match(res.json.mock.calls[0].arguments[0].message, /active/i);
  });

  it('400 : invalid status value', async () => {
    const req = makeReq({ status: 'banned' }, { id: '1' });
    const res = makeRes();
    await updateUserStatus(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /active or suspended/i);
  });

  it('404 : user not found', async () => {
    mockUser.update.mock.mockImplementation(async () => null);

    const req = makeReq({ status: 'active' }, { id: '99' });
    const res = makeRes();
    await updateUserStatus(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockUser.update.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({ status: 'active' }, { id: '1' });
    const res = makeRes();
    await updateUserStatus(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('updateUserRole()', () => {
  beforeEach(resetMocks);

  it('200 : updates user role to ehost', async () => {
    const updatedUser = { id: 1, role: 'ehost' };
    mockUser.update.mock.mockImplementation(async () => updatedUser);

    const req = makeReq({ role: 'ehost' }, { id: '1' });
    const res = makeRes();
    await updateUserRole(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /ehost/i);
    assert.deepEqual(body.user, updatedUser);
  });

  it('400 : invalid role value', async () => {
    const req = makeReq({ role: 'superuser' }, { id: '1' });
    const res = makeRes();
    await updateUserRole(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /visitor, ehost, or admin/i);
  });

  it('404 : user not found', async () => {
    mockUser.update.mock.mockImplementation(async () => null);

    const req = makeReq({ role: 'admin' }, { id: '99' });
    const res = makeRes();
    await updateUserRole(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockUser.update.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({ role: 'visitor' }, { id: '1' });
    const res = makeRes();
    await updateUserRole(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('deleteUser()', () => {
  beforeEach(resetMocks);

  it('200 : deletes a user successfully', async () => {
    mockUser.delete.mock.mockImplementation(async () => true);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await deleteUser(req, res);

    assert.match(res.json.mock.calls[0].arguments[0].message, /deleted successfully/i);
  });

  it('404 : user not found', async () => {
    mockUser.delete.mock.mockImplementation(async () => false);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();
    await deleteUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('500 : database error', async () => {
    mockUser.delete.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await deleteUser(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getApplications()', () => {
  beforeEach(resetMocks);

  it('200 : returns all applications without filter', async () => {
    const apps = [{ id: 1, email: 'a@test.com', status: 'pending' }];
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: apps }));

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getApplications(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], apps);
  });

  it('200 : filters applications by status', async () => {
    const apps = [{ id: 2, email: 'b@test.com', status: 'approved' }];
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: apps }));

    const req = makeReq({}, {}, { status: 'approved' });
    const res = makeRes();
    await getApplications(req, res);

    assert.deepEqual(res.json.mock.calls[0].arguments[0], apps);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, {}, {});
    const res = makeRes();
    await getApplications(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('approveApplication()', () => {
  beforeEach(resetMocks);

  it('200 : approves application and creates ehost user', async () => {
    const app = { id: 1, email: 'john@test.com', name: 'John Smith', birthday: '1990-01-01', preferred_country: 'UK', status: 'pending' };
    const createdUser = { id: 10, email: 'john@test.com', role: 'ehost' };

    let calls = 0;
    fakePool.query.mock.mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.resolve({ rows: [app] }); // find application
      return Promise.resolve({ rows: [] });                      // update status
    });
    mockUser.findByEmail.mock.mockImplementation(async () => null);
    fakeBcrypt.hash.mock.mockImplementation(async () => 'hashed_pw');
    mockUser.create.mock.mockImplementation(async () => createdUser);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveApplication(req, res);

    const body = res.json.mock.calls[0].arguments[0];
    assert.match(body.message, /approved/i);
    assert.deepEqual(body.user, createdUser);
    assert.ok(body.temp_password);
  });

  it('404 : application not found', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq({}, { id: '999' });
    const res = makeRes();
    await approveApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('400 : application already approved', async () => {
    fakePool.query.mock.mockImplementation(() =>
      Promise.resolve({ rows: [{ id: 1, status: 'approved' }] })
    );

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already/i);
  });

  it('409 : user with this email already exists', async () => {
    fakePool.query.mock.mockImplementation(() =>
      Promise.resolve({ rows: [{ id: 1, email: 'john@test.com', name: 'John', status: 'pending' }] })
    );
    mockUser.findByEmail.mock.mockImplementation(async () => ({ id: 5 }));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 409);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already exists/i);
  });

  it('500 : database error on find', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await approveApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('rejectApplication()', () => {
  beforeEach(resetMocks);

  it('200 : rejects application successfully', async () => {
    const app = { id: 1, email: 'john@test.com', status: 'pending' };

    let calls = 0;
    fakePool.query.mock.mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.resolve({ rows: [app] }); 
      return Promise.resolve({ rows: [] });                      
    });

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectApplication(req, res);

    assert.match(res.json.mock.calls[0].arguments[0].message, /rejected/i);
  });

  it('404 : application not found', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.resolve({ rows: [] }));

    const req = makeReq({}, { id: '999' });
    const res = makeRes();
    await rejectApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 404);
    assert.match(res.json.mock.calls[0].arguments[0].message, /not found/i);
  });

  it('400 : application already rejected', async () => {
    fakePool.query.mock.mockImplementation(() =>
      Promise.resolve({ rows: [{ id: 1, status: 'rejected' }] })
    );

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.match(res.json.mock.calls[0].arguments[0].message, /already/i);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(() => Promise.reject(new Error('DB fail')));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();
    await rejectApplication(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
  });
});

describe('getNetworkLogs()', () => {
  beforeEach(resetMocks);

  it('200 : returns network logs successfully', async () => {
    const mockRows = [{ id: 1, connection_quality: 'Poor', user_id: 2, location_name: 'Stonehenge' }];
    fakePool.query.mock.mockImplementation(async () => ({ rows: mockRows }));

    const req = makeReq();
    const res = makeRes();
    await getNetworkLogs(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].success, true);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, mockRows);
  });

  it('500 : database error', async () => {
    fakePool.query.mock.mockImplementation(async () => { throw new Error('DB error'); });

    const req = makeReq();
    const res = makeRes();
    await getNetworkLogs(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].success, false);
  });
});

describe('getNetworkIssueStats()', () => {
  beforeEach(resetMocks);

  it('200 : returns network issue stats', async () => {
    const mockStats = [{ experience_id: 1, location_name: 'Machu Picchu', issue_count: '5' }];
    fakePool.query.mock.mockImplementation(async () => ({ rows: mockStats }));

    const req = makeReq();
    const res = makeRes();
    await getNetworkIssueStats(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 200);
    assert.equal(res.json.mock.calls[0].arguments[0].success, true);
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, mockStats);
  });
});

describe('reportNetworkIssue()', () => {
  beforeEach(resetMocks);

  it('201 : inserts network log successfully', async () => {
    const req = makeReq({ experience_id: 10, connection_quality: 'Dropped', ip_address: '192.168.1.1' });
    req.user = { id: 1 }; 

    const mockInsertedRow = { id: 100, connection_quality: 'Dropped' };
    fakePool.query.mock.mockImplementation(async () => ({ rows: [mockInsertedRow] }));

    const res = makeRes();
    await reportNetworkIssue(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 201);
    assert.equal(res.json.mock.calls[0].arguments[0].success, true);
    assert.equal(res.json.mock.calls[0].arguments[0].message, 'The network issue has been logged.');
    assert.deepEqual(res.json.mock.calls[0].arguments[0].data, mockInsertedRow);
  });

  it('400 : missing connection_quality', async () => {
    const req = makeReq({ experience_id: 10 }); 
    req.user = { id: 1 };
    
    const res = makeRes();
    await reportNetworkIssue(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 400);
    assert.equal(res.json.mock.calls[0].arguments[0].success, false);
    assert.match(res.json.mock.calls[0].arguments[0].message, /connection_quality/i);
    assert.equal(fakePool.query.mock.callCount(), 0); 
  });

  it('500 : database error', async () => {
    const req = makeReq({ connection_quality: 'Dropped' });
    req.user = { id: 1 };
    fakePool.query.mock.mockImplementation(async () => { throw new Error('DB error'); });
    
    const res = makeRes();
    await reportNetworkIssue(req, res);

    assert.equal(res.status.mock.calls[0].arguments[0], 500);
    assert.equal(res.json.mock.calls[0].arguments[0].success, false);
  });
});