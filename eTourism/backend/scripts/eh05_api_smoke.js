const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const DATABASE_URL = process.env.DATABASE_URL;

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const json = async (res) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
};

const request = async (path, { method = 'GET', token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });
  const data = await json(res);
  return { status: res.status, data };
};

const cleanupByEmails = async (client, emails) => {
  const users = await client.query('SELECT id, email FROM users WHERE email = ANY($1)', [emails]);
  const ids = users.rows.map((r) => r.id);
  if (ids.length === 0) return;

  const exps = await client.query('SELECT id FROM experiences WHERE ehost_id = ANY($1)', [ids]);
  const expIds = exps.rows.map((r) => r.id);

  const bookingRows = await client.query(
    'SELECT id FROM bookings WHERE visitor_id = ANY($1) OR experience_id = ANY($2)',
    [ids, expIds.length ? expIds : [0]]
  );
  const bookingIds = bookingRows.rows.map((r) => r.id);

  if (bookingIds.length) {
    await client.query('DELETE FROM refunds WHERE booking_id = ANY($1)', [bookingIds]);
    await client.query('DELETE FROM payments WHERE booking_id = ANY($1)', [bookingIds]);
    await client.query('DELETE FROM bookings WHERE id = ANY($1)', [bookingIds]);
  }

  if (expIds.length) {
    await client.query('DELETE FROM experiences WHERE id = ANY($1)', [expIds]);
  }

  await client.query('DELETE FROM users WHERE id = ANY($1)', [ids]);
};

const main = async () => {
  assert(DATABASE_URL, 'DATABASE_URL is required');

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const ehostEmail = 'ehost_eh05_smoke@local.test';
  const visitorEmail = 'visitor_eh05_smoke@local.test';
  const ehostPassword = 'Passw0rd!';
  const visitorPassword = 'Passw0rd!';

  await client.query('BEGIN');
  await cleanupByEmails(client, [ehostEmail, visitorEmail]);

  const ehostHash = await bcrypt.hash(ehostPassword, 10);
  const visitorHash = await bcrypt.hash(visitorPassword, 10);

  const ehost = await client.query(
    "INSERT INTO users (email, password_hash, role, first_name, last_name, created_at) VALUES ($1,$2,'ehost','Smoke','EHost', NOW()) RETURNING id",
    [ehostEmail, ehostHash]
  );
  const visitor = await client.query(
    "INSERT INTO users (email, password_hash, role, first_name, last_name, created_at) VALUES ($1,$2,'visitor','Smoke','Visitor', NOW()) RETURNING id",
    [visitorEmail, visitorHash]
  );

  const exp = await client.query(
    `INSERT INTO experiences
       (ehost_id, title, description, category, country, location_name, date_time, duration_minutes, max_visitors, price, price_discounted, status, created_at)
     VALUES
       ($1, 'EH-05 Smoke Experience', 'Smoke test experience', 'test', 'UK', 'London', NOW() + interval '2 days', 60, 10, 20.00, 10.00, 'approved', NOW())
     RETURNING id`,
    [ehost.rows[0].id]
  );

  await client.query('COMMIT');
  await client.end();

  const ehostLogin = await request('/auth/login', { method: 'POST', body: { email: ehostEmail, password: ehostPassword } });
  assert(ehostLogin.status === 200, `ehost login failed: ${ehostLogin.status}`);
  const ehostToken = ehostLogin.data?.token;
  assert(ehostToken, 'missing ehost token');

  const list = await request('/ehost/experiences', { token: ehostToken });
  assert(list.status === 200, `ehost experiences failed: ${list.status}`);
  const experiences = list.data?.data || list.data;
  const experienceId = experiences.find((x) => String(x.id) === String(exp.rows[0].id))?.id;
  assert(experienceId, 'created experience not found via API');

  const prefsPut = await request(`/ehost/experiences/${experienceId}/booking-preferences`, {
    method: 'PUT',
    token: ehostToken,
    body: {
      min_notice_minutes: 60,
      min_group_size: 2,
      max_group_size: 4,
      group_rule: 'no_all_male_groups',
      cancellation_policy: {
        type: 'tiered_refund_v1',
        tiers: [
          { min_days: 14, refund_pct: 100 },
          { min_days: 7, refund_pct: 50 },
          { min_days: 0, refund_pct: 0 },
        ],
      },
    },
  });
  assert(prefsPut.status === 200, `prefs PUT failed: ${prefsPut.status}`);

  const prefsGet = await request(`/ehost/experiences/${experienceId}/booking-preferences`, { token: ehostToken });
  assert(prefsGet.status === 200, `prefs GET failed: ${prefsGet.status}`);
  assert(prefsGet.data?.data?.group_rule === 'no_all_male_groups', 'prefs group_rule mismatch');

  const visitorLogin = await request('/auth/login', { method: 'POST', body: { email: visitorEmail, password: visitorPassword } });
  assert(visitorLogin.status === 200, `visitor login failed: ${visitorLogin.status}`);
  const visitorToken = visitorLogin.data?.token;
  assert(visitorToken, 'missing visitor token');

  const b1 = await request('/visitor/bookings', {
    method: 'POST',
    token: visitorToken,
    body: {
      experience_id: experienceId,
      qty_normal: 1,
      qty_discounted: 0,
      contact_name: 'Smoke Visitor',
      contact_email: 'smoke.visitor@local.test',
      agreed_to_terms: true,
    },
  });
  assert(b1.status === 400, `expected 400 for min group size, got ${b1.status}`);

  const b2 = await request('/visitor/bookings', {
    method: 'POST',
    token: visitorToken,
    body: {
      experience_id: experienceId,
      qty_normal: 2,
      qty_discounted: 0,
      contact_name: 'Smoke Visitor',
      contact_email: 'smoke.visitor@local.test',
      agreed_to_terms: true,
    },
  });
  assert(b2.status === 400, `expected 400 for missing breakdown, got ${b2.status}`);

  const b3 = await request('/visitor/bookings', {
    method: 'POST',
    token: visitorToken,
    body: {
      experience_id: experienceId,
      qty_normal: 2,
      qty_discounted: 0,
      contact_name: 'Smoke Visitor',
      contact_email: 'smoke.visitor@local.test',
      agreed_to_terms: true,
      group_gender_breakdown: { male: 2, female: 0, other: 0, unspecified: 0 },
    },
  });
  assert(b3.status === 400, `expected 400 for all-male group, got ${b3.status}`);

  const b4 = await request('/visitor/bookings', {
    method: 'POST',
    token: visitorToken,
    body: {
      experience_id: experienceId,
      qty_normal: 2,
      qty_discounted: 0,
      contact_name: 'Smoke Visitor',
      contact_email: 'smoke.visitor@local.test',
      agreed_to_terms: true,
      group_gender_breakdown: { male: 1, female: 1, other: 0, unspecified: 0 },
    },
  });
  assert(b4.status === 201, `expected 201 for valid booking, got ${b4.status}`);
  assert(b4.data?.booking?.cancellation_policy_snapshot, 'missing cancellation_policy_snapshot on booking');

  console.log('EH-05 API smoke: PASS');
};

main().catch((e) => {
  console.error('EH-05 API smoke: FAIL');
  console.error(e);
  process.exit(1);
});
