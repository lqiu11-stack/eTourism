/**
 * Feedback questionnaire (POST /api/reviews body, plus `token`).
 *
 * Persisted record in reviews.json also includes:
 *   id, user_id, experience_id, created_at (added by server from token + store).
 */

const QUESTIONNAIRE_SCHEMA = {
  rating: {
    label: 'rating (overall rating)',
    type: 'integer',
    min: 1,
    max: 5,
  },
  host_rating: {
    label: 'host_rating (eHost performance)',
    type: 'integer',
    min: 1,
    max: 5,
  },
  content_rating: {
    label: 'content_rating (content quality)',
    type: 'integer',
    min: 1,
    max: 5,
  },
  technical_rating: {
    label: 'technical_rating (technical quality)',
    type: 'integer',
    min: 1,
    max: 5,
  },
  recommend: {
    label: 'recommend',
    type: 'boolean',
  },
  comment: {
    label: 'comment',
    type: 'string',
  },
  improvement: {
    label: 'improvement',
    type: 'string',
  },
};

function parseRating1to5(value, fieldKey) {
  const meta = QUESTIONNAIRE_SCHEMA[fieldKey];
  const n = Number(value);
  if (!Number.isInteger(n) || n < meta.min || n > meta.max) {
    return {
      error: `${meta.label} must be an integer between ${meta.min} and ${meta.max}`,
    };
  }
  return { value: n };
}

function parseRecommend(value) {
  if (value === true || value === false) return { value };
  if (value === 1 || value === '1' || value === 'true') return { value: true };
  if (value === 0 || value === '0' || value === 'false') return { value: false };
  return {
    error: `${QUESTIONNAIRE_SCHEMA.recommend.label} must be a boolean`,
  };
}

/**
 * Parse questionnaire fields from request body (excluding token).
 * @returns {{ ok: true, payload: object } | { ok: false, message: string }}
 */
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

  const comment = body.comment != null ? String(body.comment) : '';
  const improvement = body.improvement != null ? String(body.improvement) : '';

  return {
    ok: true,
    payload: {
      rating: rOverall.value,
      host_rating: rHost.value,
      content_rating: rContent.value,
      technical_rating: rTech.value,
      recommend: rec.value,
      comment,
      improvement,
    },
  };
}

module.exports = {
  QUESTIONNAIRE_SCHEMA,
  parseQuestionnaireBody,
};
