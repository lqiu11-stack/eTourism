const pool = require('../config/db');

const ExperienceMeetingLink = {
  async findByExperienceId(experience_id) {
    const { rows } = await pool.query(
      `SELECT id, experience_id, platform, meeting_url, meeting_password, created_at, updated_at
       FROM experience_meeting_links
       WHERE experience_id = $1`,
      [experience_id]
    );
    return rows[0] || null;
  },

  async upsertByExperienceId({ experience_id, platform, meeting_url, meeting_password }) {
    const { rows } = await pool.query(
      `INSERT INTO experience_meeting_links (experience_id, platform, meeting_url, meeting_password)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (experience_id)
       DO UPDATE SET
         platform = EXCLUDED.platform,
         meeting_url = EXCLUDED.meeting_url,
         meeting_password = EXCLUDED.meeting_password
       RETURNING id, experience_id, platform, meeting_url, meeting_password, created_at, updated_at`,
      [experience_id, platform, meeting_url, meeting_password ?? null]
    );
    return rows[0];
  },
};

module.exports = ExperienceMeetingLink;
