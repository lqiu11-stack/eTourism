const NetworkLog = require('../models/NetworkLog');
const Experience = require('../models/Experience');
const { NETWORK_QUALITIES, NETWORK_POOR_QUALITIES } = require('../constants/enums');

const POOR_QUALITIES = new Set(NETWORK_POOR_QUALITIES);

async function logIssue(req, res) {
  try {
    const { connection_quality, error_details, experience_id } = req.body || {};

    if (!NETWORK_QUALITIES.includes(connection_quality)) {
      return res.status(400).json({ error: 'Invalid connection_quality' });
    }

    if (POOR_QUALITIES.has(connection_quality) && await NetworkLog.hasRecentLog(req.userId, 10)) {
      return res.status(202).json({ throttled: true });
    }

    const ip = (req.headers['x-forwarded-for']?.split(',')[0]?.trim()) || req.ip || null;

    const row = await NetworkLog.create({
      user_id: req.userId,
      experience_id: experience_id || null,
      connection_quality,
      ip_address: ip,
      error_details: typeof error_details === 'string' ? error_details.slice(0, 500) : null,
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('logIssue error:', err);
    res.status(500).json({ error: 'Failed to log network issue' });
  }
}

async function getMyQuality(req, res) {
  try {
    const summary = await NetworkLog.getQualityForUser(req.userId);
    res.json(summary);
  } catch (err) {
    console.error('getMyQuality error:', err);
    res.status(500).json({ error: 'Failed to fetch network quality' });
  }
}

async function getExperienceQuality(req, res) {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ error: 'Experience not found' });

    const [experienceQuality, hostQuality] = await Promise.all([
      NetworkLog.getQualityForExperience(experience.id),
      NetworkLog.getQualityForEhost(experience.ehost_id),
    ]);

    res.json({
      experience: experienceQuality,
      ehost: hostQuality,
    });
  } catch (err) {
    console.error('getExperienceQuality error:', err);
    res.status(500).json({ error: 'Failed to fetch experience network quality' });
  }
}

const ALLOWED_WINDOW_HOURS = new Set([24, 168, 720]);

async function getAdminSummary(req, res) {
  try {
    let sinceHours = 168;
    if (req.query.hours !== undefined) {
      const parsed = parseInt(req.query.hours, 10);
      if (!ALLOWED_WINDOW_HOURS.has(parsed)) {
        return res.status(400).json({ error: 'Invalid hours value' });
      }
      sinceHours = parsed;
    }
    const summary = await NetworkLog.adminSummary({ limit: 50, sinceHours });
    res.json(summary);
  } catch (err) {
    console.error('getAdminSummary error:', err);
    res.status(500).json({ error: 'Failed to fetch admin network summary' });
  }
}

module.exports = {
  logIssue,
  getMyQuality,
  getExperienceQuality,
  getAdminSummary,
};
