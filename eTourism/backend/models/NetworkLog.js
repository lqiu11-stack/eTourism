const pool = require('../config/db');
const {
  NETWORK_POOR_QUALITIES,
  NETWORK_POOR_RATIO_THRESHOLD,
  NETWORK_POOR_MIN_SAMPLES,
} = require('../constants/enums');

const DEFAULT_WINDOW_HOURS = 168;

const NetworkLog = {
  async create({ user_id, experience_id, connection_quality, ip_address, error_details }) {
    const { rows } = await pool.query(
      `INSERT INTO network_logs (user_id, experience_id, connection_quality, ip_address, error_details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, experience_id, connection_quality, ip_address, error_details]
    );
    return rows[0];
  },

  async findByExperience(experience_id) {
    const { rows } = await pool.query(
      'SELECT * FROM network_logs WHERE experience_id = $1 ORDER BY logged_at DESC',
      [experience_id]
    );
    return rows;
  },

  async findByUser(user_id) {
    const { rows } = await pool.query(
      'SELECT * FROM network_logs WHERE user_id = $1 ORDER BY logged_at DESC',
      [user_id]
    );
    return rows;
  },

  async hasRecentLog(user_id, seconds = 10) {
    const { rows } = await pool.query(
      `SELECT 1 FROM network_logs
       WHERE user_id = $1 AND logged_at > now() - ($2 || ' seconds')::interval
       LIMIT 1`,
      [user_id, seconds]
    );
    return rows.length > 0;
  },

  async getQualityForUser(user_id, sinceHours = DEFAULT_WINDOW_HOURS) {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE connection_quality = ANY($2::text[]))::int AS poor_count
       FROM network_logs
       WHERE user_id = $1 AND logged_at > now() - ($3 || ' hours')::interval`,
      [user_id, NETWORK_POOR_QUALITIES, sinceHours]
    );
    return summarise(rows[0]);
  },

  async getQualityForExperience(experience_id, sinceHours = DEFAULT_WINDOW_HOURS) {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE connection_quality = ANY($2::text[]))::int AS poor_count
       FROM network_logs
       WHERE experience_id = $1 AND logged_at > now() - ($3 || ' hours')::interval`,
      [experience_id, NETWORK_POOR_QUALITIES, sinceHours]
    );
    return summarise(rows[0]);
  },

  async getQualityForEhost(ehost_id, sinceHours = DEFAULT_WINDOW_HOURS) {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE nl.connection_quality = ANY($2::text[]))::int AS poor_count
       FROM network_logs nl
       JOIN experiences e ON e.id = nl.experience_id
       WHERE e.ehost_id = $1 AND nl.logged_at > now() - ($3 || ' hours')::interval`,
      [ehost_id, NETWORK_POOR_QUALITIES, sinceHours]
    );
    return summarise(rows[0]);
  },

  async adminSummary({ limit = 50, sinceHours = DEFAULT_WINDOW_HOURS } = {}) {
    const usersQuery = pool.query(
      `SELECT
         nl.user_id,
         u.first_name, u.last_name, u.email, u.role,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE nl.connection_quality = ANY($1::text[]))::int AS poor_count
       FROM network_logs nl
       LEFT JOIN users u ON u.id = nl.user_id
       WHERE nl.logged_at > now() - ($2 || ' hours')::interval
       GROUP BY nl.user_id, u.first_name, u.last_name, u.email, u.role
       HAVING COUNT(*) FILTER (WHERE nl.connection_quality = ANY($1::text[])) > 0
       ORDER BY poor_count DESC
       LIMIT $3`,
      [NETWORK_POOR_QUALITIES, sinceHours, limit]
    );

    const experiencesQuery = pool.query(
      `SELECT
         nl.experience_id,
         e.title, e.ehost_id,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE nl.connection_quality = ANY($1::text[]))::int AS poor_count
       FROM network_logs nl
       LEFT JOIN experiences e ON e.id = nl.experience_id
       WHERE nl.experience_id IS NOT NULL
         AND nl.logged_at > now() - ($2 || ' hours')::interval
       GROUP BY nl.experience_id, e.title, e.ehost_id
       HAVING COUNT(*) FILTER (WHERE nl.connection_quality = ANY($1::text[])) > 0
       ORDER BY poor_count DESC
       LIMIT $3`,
      [NETWORK_POOR_QUALITIES, sinceHours, limit]
    );

    const [users, experiences] = await Promise.all([usersQuery, experiencesQuery]);
    return {
      users: users.rows.map(decorate),
      experiences: experiences.rows.map(decorate),
      window_hours: sinceHours,
    };
  },
};

function summarise(row) {
  const total = row?.total ?? 0;
  const poor_count = row?.poor_count ?? 0;
  const poor_ratio = total > 0 ? poor_count / total : 0;
  return {
    total,
    poor_count,
    poor_ratio,
    is_poor: total >= NETWORK_POOR_MIN_SAMPLES && poor_ratio >= NETWORK_POOR_RATIO_THRESHOLD,
  };
}

function decorate(row) {
  const total = row.total ?? 0;
  const poor_count = row.poor_count ?? 0;
  const poor_ratio = total > 0 ? poor_count / total : 0;
  return {
    ...row,
    poor_ratio,
    is_poor: total >= NETWORK_POOR_MIN_SAMPLES && poor_ratio >= NETWORK_POOR_RATIO_THRESHOLD,
  };
}

module.exports = NetworkLog;
