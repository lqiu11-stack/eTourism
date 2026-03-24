const crypto = require('crypto');
const User = require('../models/User');
const Experience = require('../models/Experience');
const { appendToken, markTokenUsed } = require('../utils/reviewTokenStore');
const { validateInviteToken } = require('../utils/reviewInviteToken');
const { createReview, findByExperienceId } = require('../utils/reviewStore');

const REVIEW_LINK_BASE =
  process.env.REVIEW_FRONTEND_URL || 'http://localhost:3000/review';
const TOKEN_TTL_MS =
  (Number(process.env.REVIEW_TOKEN_TTL_DAYS) || 7) * 24 * 60 * 60 * 1000;

function parseRating1to5(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    return { error: `${fieldName} must be an integer between 1 and 5` };
  }
  return { value: n };
}

function parseRecommend(value) {
  if (value === true || value === false) return { value };
  if (value === 1 || value === '1' || value === 'true') return { value: true };
  if (value === 0 || value === '0' || value === 'false') return { value: false };
  return { error: 'recommend must be a boolean' };
}

const sendReviewEmail = async (req, res) => {
  try {
    const userId =
      req.body.user_id != null ? Number(req.body.user_id) : NaN;
    const experienceId =
      req.body.experience_id != null ? Number(req.body.experience_id) : NaN;

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: 'Valid user_id is required' });
    }
    if (!Number.isInteger(experienceId) || experienceId < 1) {
      return res
        .status(400)
        .json({ message: 'Valid experience_id is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const token = crypto.randomUUID();
    const expiredAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    const record = {
      token,
      user_id: userId,
      experience_id: experienceId,
      expired_at: expiredAt,
      used: false,
    };

    await appendToken(record);

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

    const rOverall = parseRating1to5(req.body?.rating, 'rating');
    if (rOverall.error) {
      return res.status(400).json({ message: rOverall.error });
    }
    const rHost = parseRating1to5(req.body?.host_rating, 'host_rating');
    if (rHost.error) {
      return res.status(400).json({ message: rHost.error });
    }
    const rContent = parseRating1to5(req.body?.content_rating, 'content_rating');
    if (rContent.error) {
      return res.status(400).json({ message: rContent.error });
    }
    const rTech = parseRating1to5(req.body?.technical_rating, 'technical_rating');
    if (rTech.error) {
      return res.status(400).json({ message: rTech.error });
    }

    const rec = parseRecommend(req.body?.recommend);
    if (rec.error) {
      return res.status(400).json({ message: rec.error });
    }

    const comment =
      req.body?.comment != null ? String(req.body.comment) : '';
    const improvement =
      req.body?.improvement != null ? String(req.body.improvement) : '';

    const saved = await createReview({
      user_id: record.user_id,
      experience_id: record.experience_id,
      rating: rOverall.value,
      host_rating: rHost.value,
      content_rating: rContent.value,
      technical_rating: rTech.value,
      recommend: rec.value,
      comment,
      improvement,
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

    const reviews = await findByExperienceId(id);
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
