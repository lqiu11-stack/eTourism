const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const User = require('../models/User');
const Experience = require('../models/Experience');

const REVIEW_LINK_BASE =
  process.env.REVIEW_FRONTEND_URL || 'http://localhost:3000/review';
const TOKEN_TTL_MS =
  (Number(process.env.REVIEW_TOKEN_TTL_DAYS) || 7) * 24 * 60 * 60 * 1000;

const DATA_DIR = path.join(__dirname, '..', 'data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const TOKENS_FILE = path.join(__dirname, '..', 'reviewTokens.json');

// ---------- file persistence ----------

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonArray(file, label) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    if (err instanceof SyntaxError) {
      const wrapped = new Error(`Invalid JSON in ${label}: ${err.message}`);
      wrapped.cause = err;
      throw wrapped;
    }
    throw err;
  }
}

async function writeJsonArray(file, list, label) {
  try {
    await fs.writeFile(file, `${JSON.stringify(list, null, 2)}\n`, 'utf8');
  } catch (err) {
    const wrapped = new Error(`Failed to write ${label}: ${err.message}`);
    wrapped.cause = err;
    throw wrapped;
  }
}

async function readReviews() {
  return readJsonArray(REVIEWS_FILE, 'reviews.json');
}

async function readTokens() {
  return readJsonArray(TOKENS_FILE, 'reviewTokens.json');
}

async function appendToken(record) {
  const tokens = await readTokens();
  tokens.push(record);
  await writeJsonArray(TOKENS_FILE, tokens, 'reviewTokens.json');
}

async function markTokenUsed(tokenValue) {
  const tokens = await readTokens();
  const idx = tokens.findIndex((t) => t && t.token === tokenValue);
  if (idx === -1) return false;
  tokens[idx] = { ...tokens[idx], used: true };
  await writeJsonArray(TOKENS_FILE, tokens, 'reviewTokens.json');
  return true;
}

async function saveFileReview(fields) {
  await ensureDataDir();
  const list = await readReviews();
  const nextId = list.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
  const review = { id: nextId, ...fields, created_at: new Date().toISOString() };
  list.push(review);
  await writeJsonArray(REVIEWS_FILE, list, 'reviews.json');
  return review;
}

// ---------- invite token validation ----------

function normalizeToken(token) {
  if (typeof token === 'string') return token.trim();
  if (Array.isArray(token) && token.length) return String(token[0]).trim();
  return '';
}

async function validateInviteToken(token, options = {}) {
  const missingMessage = options.missingMessage || 'token is required';
  const tokenValue = normalizeToken(token);
  if (!tokenValue) {
    return { error: { status: 400, body: { message: missingMessage } } };
  }

  const tokens = await readTokens();
  const record = tokens.find((t) => t && t.token === tokenValue);
  if (!record) {
    return { error: { status: 404, body: { message: 'Token not found' } } };
  }

  const expiredAtMs = new Date(record.expired_at).getTime();
  if (Number.isNaN(expiredAtMs) || Date.now() > expiredAtMs) {
    return {
      error: {
        status: 410,
        body: { message: 'Token has expired', expired_at: record.expired_at },
      },
    };
  }

  if (record.used === true) {
    return { error: { status: 409, body: { message: 'Token has already been used' } } };
  }

  return { record, tokenValue };
}

// ---------- questionnaire validation ----------

const QUESTIONNAIRE_SCHEMA = {
  rating: { label: 'rating (overall rating)', type: 'integer', min: 1, max: 5 },
  host_rating: { label: 'host_rating (eHost performance)', type: 'integer', min: 1, max: 5 },
  content_rating: { label: 'content_rating (content quality)', type: 'integer', min: 1, max: 5 },
  technical_rating: { label: 'technical_rating (technical quality)', type: 'integer', min: 1, max: 5 },
  recommend: { label: 'recommend', type: 'boolean' },
  comment: { label: 'comment', type: 'string' },
  improvement: { label: 'improvement', type: 'string' },
};

function parseRating1to5(value, fieldKey) {
  const meta = QUESTIONNAIRE_SCHEMA[fieldKey];
  const n = Number(value);
  if (!Number.isInteger(n) || n < meta.min || n > meta.max) {
    return { error: `${meta.label} must be an integer between ${meta.min} and ${meta.max}` };
  }
  return { value: n };
}

function parseRecommend(value) {
  if (value === true || value === false) return { value };
  if (value === 1 || value === '1' || value === 'true') return { value: true };
  if (value === 0 || value === '0' || value === 'false') return { value: false };
  return { error: `${QUESTIONNAIRE_SCHEMA.recommend.label} must be a boolean` };
}

function parseQuestionnaireBody(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Request body must be a JSON object' };
  }
  const rOverall = parseRating1to5(body.rating, 'rating');
  if (rOverall.error) return { ok: false, message: rOverall.error };
  const rHost = parseRating1to5(body.host_rating, 'host_rating');
  if (rHost.error) return { ok: false, message: rHost.error };
  const rContent = parseRating1to5(body.content_rating, 'content_rating');
  if (rContent.error) return { ok: false, message: rContent.error };
  const rTech = parseRating1to5(body.technical_rating, 'technical_rating');
  if (rTech.error) return { ok: false, message: rTech.error };
  const rec = parseRecommend(body.recommend);
  if (rec.error) return { ok: false, message: rec.error };
  return {
    ok: true,
    payload: {
      rating: rOverall.value,
      host_rating: rHost.value,
      content_rating: rContent.value,
      technical_rating: rTech.value,
      recommend: rec.value,
      comment: body.comment != null ? String(body.comment) : '',
      improvement: body.improvement != null ? String(body.improvement) : '',
    },
  };
}

// ---------- handlers ----------

const sendReviewEmail = async (req, res) => {
  try {
    const userId = req.body.user_id != null ? Number(req.body.user_id) : NaN;
    const experienceId = req.body.experience_id != null ? Number(req.body.experience_id) : NaN;

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: 'Valid user_id is required' });
    }
    if (!Number.isInteger(experienceId) || experienceId < 1) {
      return res.status(400).json({ message: 'Valid experience_id is required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const experience = await Experience.findById(experienceId);
    if (!experience) return res.status(404).json({ message: 'Experience not found' });

    const token = crypto.randomUUID();
    const expiredAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    await appendToken({
      token,
      user_id: userId,
      experience_id: experienceId,
      expired_at: expiredAt,
      used: false,
    });

    const reviewUrl = `${REVIEW_LINK_BASE}?token=${encodeURIComponent(token)}`;
    const to = user.email || '(no email on file)';
    const subject = 'Please share your experience feedback';
    const bodyText = `Hi ${user.first_name || 'there'},

We hope you enjoyed your experience. Please leave a short review using the link below (valid until ${expiredAt}):

${reviewUrl}

Thank you,
eTourism`;

    console.log('[review invite email — simulated]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('---');
    console.log(bodyText);
    console.log('---');

    return res.status(201).json({
      message: 'Review invitation recorded; email content logged to console',
      expired_at: expiredAt,
    });
  } catch (err) {
    console.error('[sendReviewEmail]', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const verifyReviewToken = async (req, res) => {
  try {
    const result = await validateInviteToken(req.query.token, {
      missingMessage: 'token query parameter is required',
    });
    if (result.error) {
      return res.status(result.error.status).json(result.error.body);
    }
    const { record } = result;
    return res.status(200).json({
      valid: true,
      user_id: record.user_id,
      experience_id: record.experience_id,
      expired_at: record.expired_at,
    });
  } catch (err) {
    console.error('[verifyReviewToken]', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const submitReview = async (req, res) => {
  try {
    const tokenResult = await validateInviteToken(req.body?.token);
    if (tokenResult.error) {
      return res.status(tokenResult.error.status).json(tokenResult.error.body);
    }
    const { record, tokenValue } = tokenResult;

    const parsed = parseQuestionnaireBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.message });
    }

    const saved = await saveFileReview({
      user_id: record.user_id,
      experience_id: record.experience_id,
      ...parsed.payload,
    });

    const marked = await markTokenUsed(tokenValue);
    if (!marked) {
      console.error('[submitReview] Token disappeared before markTokenUsed:', tokenValue);
      return res.status(500).json({ message: 'Failed to finalize review token' });
    }

    return res.status(201).json({
      message: 'Review submitted successfully',
      review: saved,
    });
  } catch (err) {
    console.error('[submitReview]', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const getExperienceReviews = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'Valid experience id is required' });
    }
    const list = await readReviews();
    const reviews = list
      .filter((r) => Number(r.experience_id) === id)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return res.status(200).json({ experience_id: id, reviews, count: reviews.length });
  } catch (err) {
    console.error('[getExperienceReviews]', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

module.exports = {
  sendReviewEmail,
  verifyReviewToken,
  submitReview,
  getExperienceReviews,
};
