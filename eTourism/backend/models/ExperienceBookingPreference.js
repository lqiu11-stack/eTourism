const pool = require('../config/db');

const ExperienceBookingPreference = {
  async findByExperienceId(experience_id) {
    const { rows } = await pool.query(
      `SELECT id, experience_id, min_notice_minutes, min_group_size, max_group_size,
              group_rule, cancellation_policy, created_at, updated_at
       FROM experience_booking_preferences
       WHERE experience_id = $1`,
      [experience_id]
    );
    return rows[0] || null;
  },

  async upsertByExperienceId({
    experience_id,
    min_notice_minutes,
    min_group_size,
    max_group_size,
    group_rule,
    cancellation_policy,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO experience_booking_preferences
         (experience_id, min_notice_minutes, min_group_size, max_group_size, group_rule, cancellation_policy)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (experience_id)
       DO UPDATE SET
         min_notice_minutes = EXCLUDED.min_notice_minutes,
         min_group_size = EXCLUDED.min_group_size,
         max_group_size = EXCLUDED.max_group_size,
         group_rule = EXCLUDED.group_rule,
         cancellation_policy = EXCLUDED.cancellation_policy
       RETURNING id, experience_id, min_notice_minutes, min_group_size, max_group_size, group_rule, cancellation_policy, created_at, updated_at`,
      [
        experience_id,
        min_notice_minutes,
        min_group_size,
        max_group_size,
        group_rule,
        cancellation_policy,
      ]
    );
    return rows[0];
  },
};

module.exports = ExperienceBookingPreference;
