const { readTokens } = require('./reviewTokenStore');

function normalizeToken(token) {
  if (typeof token === 'string') return token.trim();
  if (Array.isArray(token) && token.length) return String(token[0]).trim();
  return '';
}

async function validateInviteToken(token, options = {}) {
  const missingMessage = options.missingMessage || 'token is required';
  const tokenValue = normalizeToken(token);
  if (!tokenValue) {
    return {
      error: {
        status: 400,
        body: { message: missingMessage },
      },
    };
  }

  const tokens = await readTokens();
  const record = tokens.find((t) => t && t.token === tokenValue);

  if (!record) {
    return {
      error: {
        status: 404,
        body: { message: 'Token not found' },
      },
    };
  }

  const expiredAtMs = new Date(record.expired_at).getTime();
  if (Number.isNaN(expiredAtMs) || Date.now() > expiredAtMs) {
    return {
      error: {
        status: 410,
        body: {
          message: 'Token has expired',
          expired_at: record.expired_at,
        },
      },
    };
  }

  if (record.used === true) {
    return {
      error: {
        status: 409,
        body: { message: 'Token has already been used' },
      },
    };
  }

  return { record, tokenValue };
}

module.exports = { validateInviteToken, normalizeToken };
