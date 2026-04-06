const pool = require('../config/db');
const { CATEGORIES, LANGUAGES, CONTINENTS, GENDER_PREFERENCES } = require('../constants/enums');

const supportedGenderPreferences = GENDER_PREFERENCES;

const normalizeGenderPreference = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'any';
  }
  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases = {
    any: 'any',
    all: 'any',
    everyone: 'any',
    female: 'female_only',
    women: 'female_only',
    women_only: 'female_only',
    female_only: 'female_only',
    male: 'male_only',
    men: 'male_only',
    men_only: 'male_only',
    male_only: 'male_only',
    mixed: 'mixed',
    no_all_male: 'mixed',
    no_all_male_group: 'mixed',
    no_all_male_groups: 'mixed',
    no_all_female: 'mixed',
    no_all_female_group: 'mixed',
    no_all_female_groups: 'mixed',
  };
  return aliases[normalized] || null;
};

const bookingCancellationPolicy = [
  { min_days_before_event: 14, refund_percentage: 100 },
  { min_days_before_event: 7, refund_percentage: 50 },
  { min_days_before_event: 0, refund_percentage: 0 },
];

const parseDateTimeInput = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const parsePositiveInteger = (value) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
};

const findOverlappingSlot = async ({ ehostId, slotStart, durationMinutes, excludeExperienceId = null }) => {
  const { rows } = await pool.query(
    `SELECT id, title, date_time, duration_minutes
     FROM experiences
     WHERE ehost_id = $1
       AND status != 'deleted'
       AND date_time IS NOT NULL
       AND ($2::int IS NULL OR id <> $2)
       AND tsrange(date_time, date_time + (duration_minutes || ' minutes')::interval, '[)')
           && tsrange($3::timestamp, $3::timestamp + ($4 || ' minutes')::interval, '[)')
     LIMIT 1`,
    [ehostId, excludeExperienceId, slotStart, durationMinutes]
  );
  return rows[0] || null;
};


//ehost-03: Experience Creation API (for eHosts to submit experience details for review and listing)
const createExperience = async (req, res) => {
 
try {
    const ehostId = req.user ? req.user.id : req.userId;
    const {
        title,
        location_name,
        country,
        continent,
        latitude,
        longitude,
        category,
        language,
        description,
        price,
        duration_minutes,
        max_visitors,
        cover_image,       // frontend image link url (String)
        gender_preference, // sex preference
        allows_piggyback   // Boolean
    } = req.body;


    if (!title || !location_name || !country || !price || !description) {
        return res.status(400).json({
            success: false,
            message: 'Required fields are missing: Location name, country, price, and description cannot be empty.'
        });
    }
  //url validation can be more complex in real scenarios, here we just check if it's a non-empty string for simplicity.
    if (!cover_image || typeof cover_image !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Please upload a cover image of the experience project.'
        });
    }

    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed values: ${CATEGORIES.join(', ')}`,
      });
    }

    if (language && !LANGUAGES.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `Invalid language. Allowed values: ${LANGUAGES.join(', ')}`,
      });
    }

    if (continent && !CONTINENTS.includes(continent)) {
      return res.status(400).json({
        success: false,
        message: `Invalid continent. Allowed values: ${CONTINENTS.join(', ')}`,
      });
    }

    const normalizedGenderPreference = normalizeGenderPreference(gender_preference);
    if (!normalizedGenderPreference) {
      return res.status(400).json({
        success: false,
        message: `Invalid gender_preference. Allowed values: ${supportedGenderPreferences.join(', ')}`,
      });
    }

    const { rows } = await pool.query(
        `INSERT INTO experiences
        (title, ehost_id, location_name, country, continent, latitude, longitude, category, language, description, price, duration_minutes, max_visitors, cover_image, gender_preference, allows_piggyback, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending')
        RETURNING *`,
        [
            title,
            ehostId,
            location_name,
            country,
            continent || null,
            latitude || null,
            longitude || null,
            category || null,
            language || 'English',
            description,
            price,
            duration_minutes || 60,
            max_visitors || 10,
            cover_image,
            normalizedGenderPreference,
            allows_piggyback || false,
        ]
    );


    res.status(201).json({
        success: true,
        message: 'The project has been successfully submitted; please wait for platform review.',
        data: rows[0]
    });

  } catch (error) {
    console.error("EH-03 Submission of location and experience details failed:", error);
    res.status(500).json({ 
        success: false, 
        message: 'Server internal error, failed to save experience details. Please try again later.' 
    });
  }

};



// ehost-02: Experience Management APIs (CRUD for experiences, and booking management)
const getExperiences = async (req, res) => {
  try {
    const ehostId = req.user ? req.user.id : req.userId; 

    const { rows } = await pool.query(
        `SELECT id, cover_image, location_name, price, status, rejection_reason 
         FROM experiences 
         WHERE ehost_id = $1 AND status != 'deleted'
         ORDER BY created_at DESC`,
        [ehostId]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to retrieve experience list:", error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};


const getExperienceById = async (req, res) => {
  try {
    const experienceId = req.params.id;
    const ehostId = req.user ? req.user.id : req.userId;

    
    const { rows } = await pool.query(
        `SELECT * FROM experiences WHERE id = $1 AND ehost_id = $2`,
        [experienceId, ehostId]
    );
    
    const experience = rows[0];
    if (!experience) {
        return res.status(404).json({ success: false, message: 'This experience was not found or you do not have permission to view it.' });
    }
    
    res.status(200).json({ success: true, data: experience });
  } catch (error) {
    console.error("Failed to retrieve experience details:", error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};


const updateExperience = async (req, res) => {
  try {
    const experienceId = req.params.id;
    const ehostId = req.user ? req.user.id : req.userId;
    const { location_name, description, category, language, continent, price, gender_preference, allows_piggyback, max_visitors } = req.body;

    if (category !== undefined && !CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed values: ${CATEGORIES.join(', ')}`,
      });
    }

    if (language !== undefined && !LANGUAGES.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `Invalid language. Allowed values: ${LANGUAGES.join(', ')}`,
      });
    }

    if (continent !== undefined && !CONTINENTS.includes(continent)) {
      return res.status(400).json({
        success: false,
        message: `Invalid continent. Allowed values: ${CONTINENTS.join(', ')}`,
      });
    }

    const normalizedGenderPreference = gender_preference === undefined
      ? undefined
      : normalizeGenderPreference(gender_preference);
    if (gender_preference !== undefined && !normalizedGenderPreference) {
      return res.status(400).json({
        success: false,
        message: `Invalid gender_preference. Allowed values: ${supportedGenderPreferences.join(', ')}`,
      });
    }

    const { rows: checkRows } = await pool.query(
        `SELECT id FROM experiences WHERE id = $1 AND ehost_id = $2`,
        [experienceId, ehostId]
    );
    
    if (checkRows.length === 0) {
        return res.status(404).json({ success: false, message: 'This experience was not found or you do not have permission to modify it.' });
    }


    const { rows: updateRows } = await pool.query(
        `UPDATE experiences
         SET location_name     = COALESCE($1, location_name),
             description       = COALESCE($2, description),
             category          = COALESCE($3, category),
             language          = COALESCE($4, language),
             continent         = COALESCE($5, continent),
             price             = COALESCE($6, price),
             gender_preference = COALESCE($7, gender_preference),
             allows_piggyback  = COALESCE($8, allows_piggyback),
             max_visitors      = COALESCE($9, max_visitors),
             status            = 'pending',
             rejection_reason  = NULL
         WHERE id = $10 AND ehost_id = $11
         RETURNING *`,
        [location_name, description, category, language, continent, price, normalizedGenderPreference, allows_piggyback, max_visitors, experienceId, ehostId]
    );
    
    res.status(200).json({ success: true, data: updateRows[0] });
  } catch (error) {
    console.error("Failed to update experience:", error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};


const deleteExperience = async (req, res) => {
  try {
    const experienceId = req.params.id;
    const ehostId = req.user ? req.user.id : req.userId;

    const { rows } = await pool.query(
        `UPDATE experiences SET status = 'deleted' WHERE id = $1 AND ehost_id = $2 RETURNING id`,
        [experienceId, ehostId]
    );
    
    if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'This experience was not found or you do not have permission to modify it.' });
    }
    
    res.status(200).json({ success: true, message: 'Experience has been successfully removed.' });
  } catch (error) {
    console.error("Failed to remove experience:", error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};


const suggestedMeetingServices = ['Google Meet', 'Zoom', 'WhatsApp'];

const toMeetingConfig = (meetingLink) => {
  if (!meetingLink) {
    return null;
  }
  try {
    const parsed = JSON.parse(meetingLink);
    if (parsed && typeof parsed === 'object' && parsed.link) {
      return {
        platform: parsed.platform || 'Custom',
        link: parsed.link,
        password: parsed.password || null,
      };
    }
  } catch (error) {}
  return {
    platform: 'Custom',
    link: meetingLink,
    password: null,
  };
};

const getBookings = async (req, res) => {
  try {
    const ehostId = req.user ? req.user.id : req.userId;

    const { rows } = await pool.query(
      `SELECT
         b.id,
         b.experience_id,
         b.visitor_id,
         b.booking_date,
         b.amount_paid,
         b.status,
         b.meeting_link,
         b.qty_normal,
         b.qty_discounted,
         b.contact_name,
         b.contact_email,
         e.title AS experience_title,
         e.date_time AS experience_date_time,
         u.first_name AS visitor_first_name,
         u.last_name AS visitor_last_name,
         u.email AS visitor_email
       FROM bookings b
       JOIN experiences e ON e.id = b.experience_id
       JOIN users u ON u.id = b.visitor_id
       WHERE e.ehost_id = $1
         AND e.date_time >= NOW()
         AND b.status = 'confirmed'
       ORDER BY e.date_time ASC, b.created_at ASC`,
      [ehostId]
    );

    const data = rows.map((booking) => ({
      ...booking,
      meeting_config: toMeetingConfig(booking.meeting_link),
    }));

    res.status(200).json({
      success: true,
      suggested_services: suggestedMeetingServices,
      data,
    });
  } catch (error) {
    console.error('Failed to retrieve eHost bookings:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const getCalendarSlots = async (req, res) => {
  try {
    const ehostId = req.user ? req.user.id : req.userId;
    const { from_date, to_date } = req.query;
    const conditions = [`ehost_id = $1`, `status != 'deleted'`, `date_time IS NOT NULL`];
    const values = [ehostId];

    if (from_date !== undefined) {
      const fromDateTime = parseDateTimeInput(from_date);
      if (!fromDateTime) {
        return res.status(400).json({ success: false, message: 'Invalid from_date.' });
      }
      values.push(fromDateTime);
      conditions.push(`date_time >= $${values.length}`);
    }

    if (to_date !== undefined) {
      const toDateTime = parseDateTimeInput(to_date);
      if (!toDateTime) {
        return res.status(400).json({ success: false, message: 'Invalid to_date.' });
      }
      values.push(toDateTime);
      conditions.push(`date_time <= $${values.length}`);
    }

    if (from_date !== undefined && to_date !== undefined) {
      const fromTime = new Date(values[1]).getTime();
      const toTime = new Date(values[2]).getTime();
      if (fromTime > toTime) {
        return res.status(400).json({ success: false, message: 'from_date cannot be later than to_date.' });
      }
    }

    const { rows } = await pool.query(
      `SELECT id, title, date_time, duration_minutes, max_visitors, status
       FROM experiences
       WHERE ${conditions.join(' AND ')}
       ORDER BY date_time ASC`,
      values
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Failed to get calendar slots:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const upsertCalendarSlot = async (req, res, fallbackExperienceId = null) => {
  const ehostId = req.user ? req.user.id : req.userId;
  const sourceExperienceId = fallbackExperienceId !== null ? fallbackExperienceId : req.body.experience_id;
  const experienceId = Number(sourceExperienceId);
  const { date_time, duration_minutes } = req.body;

  if (!Number.isInteger(experienceId) || experienceId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid experience id.' });
  }

  const normalizedDateTime = parseDateTimeInput(date_time);
  if (!normalizedDateTime) {
    return res.status(400).json({ success: false, message: 'Invalid date_time.' });
  }
  if (new Date(normalizedDateTime).getTime() <= Date.now()) {
    return res.status(400).json({ success: false, message: 'date_time must be in the future.' });
  }

  const { rows: experienceRows } = await pool.query(
    `SELECT id, title, duration_minutes
     FROM experiences
     WHERE id = $1 AND ehost_id = $2 AND status != 'deleted'
     LIMIT 1`,
    [experienceId, ehostId]
  );

  if (experienceRows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Experience not found or you do not have permission.',
    });
  }

  const currentExperience = experienceRows[0];
  const resolvedDuration = duration_minutes === undefined
    ? parsePositiveInteger(currentExperience.duration_minutes || 60)
    : parsePositiveInteger(duration_minutes);
  if (!resolvedDuration) {
    return res.status(400).json({ success: false, message: 'duration_minutes must be a positive integer.' });
  }

  const overlapping = await findOverlappingSlot({
    ehostId,
    slotStart: normalizedDateTime,
    durationMinutes: resolvedDuration,
    excludeExperienceId: experienceId,
  });
  if (overlapping) {
    return res.status(409).json({
      success: false,
      message: 'Time slot overlaps with an existing slot.',
      conflict: overlapping,
    });
  }

  const { rows: updateRows } = await pool.query(
    `UPDATE experiences
     SET date_time = $1,
         duration_minutes = $2,
         status = 'pending',
         rejection_reason = NULL
     WHERE id = $3 AND ehost_id = $4 AND status != 'deleted'
     RETURNING id, title, date_time, duration_minutes, status`,
    [normalizedDateTime, resolvedDuration, experienceId, ehostId]
  );

  res.status(200).json({
    success: true,
    message: 'Calendar slot saved successfully.',
    data: updateRows[0],
  });
};

const createCalendarSlot = async (req, res) => {
  try {
    await upsertCalendarSlot(req, res, null);
  } catch (error) {
    console.error('Failed to create calendar slot:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const updateCalendarSlot = async (req, res) => {
  try {
    const experienceId = Number(req.params.id);
    await upsertCalendarSlot(req, res, experienceId);
  } catch (error) {
    console.error('Failed to update calendar slot:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const deleteCalendarSlot = async (req, res) => {
  try {
    const ehostId = req.user ? req.user.id : req.userId;
    const experienceId = Number(req.params.id);

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid experience id.' });
    }

    const { rows: experienceRows } = await pool.query(
      `SELECT id
       FROM experiences
       WHERE id = $1 AND ehost_id = $2 AND status != 'deleted'
       LIMIT 1`,
      [experienceId, ehostId]
    );
    if (experienceRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found or you do not have permission.',
      });
    }

    const { rows: bookingRows } = await pool.query(
      `SELECT COUNT(*)::int AS active_count
       FROM bookings
       WHERE experience_id = $1
         AND status IN ('confirmed', 'pending')`,
      [experienceId]
    );
    if (bookingRows[0].active_count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete slot because active bookings exist.',
      });
    }

    const { rows: updateRows } = await pool.query(
      `UPDATE experiences
       SET date_time = NULL,
           status = 'pending',
           rejection_reason = NULL
       WHERE id = $1 AND ehost_id = $2 AND status != 'deleted'
       RETURNING id, title, date_time, duration_minutes, status`,
      [experienceId, ehostId]
    );

    res.status(200).json({
      success: true,
      message: 'Calendar slot deleted successfully.',
      data: updateRows[0],
    });
  } catch (error) {
    console.error('Failed to delete calendar slot:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const setUnavailableDates = async (req, res) => {
  try {
    const ehostId = req.user ? req.user.id : req.userId;
    const { unavailable_dates } = req.body;

    if (!Array.isArray(unavailable_dates) || unavailable_dates.length === 0) {
      return res.status(400).json({ success: false, message: 'unavailable_dates must be a non-empty array.' });
    }

    const normalizedDates = [...new Set(unavailable_dates.map((value) => String(value).trim()))];
    const isValidDateList = normalizedDates.every((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));
    if (!isValidDateList) {
      return res.status(400).json({ success: false, message: 'Each unavailable date must be in YYYY-MM-DD format.' });
    }

    const { rows: targetRows } = await pool.query(
      `SELECT id, title, date_time
       FROM experiences
       WHERE ehost_id = $1
         AND status != 'deleted'
         AND date_time IS NOT NULL
         AND DATE(date_time) = ANY($2::date[])`,
      [ehostId, normalizedDates]
    );

    if (targetRows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No slots matched the unavailable dates.',
        data: {
          requested_dates: normalizedDates,
          cleared_experience_ids: [],
          blocked_experience_ids: [],
        },
      });
    }

    const targetIds = targetRows.map((item) => item.id);
    const { rows: bookedRows } = await pool.query(
      `SELECT DISTINCT experience_id
       FROM bookings
       WHERE experience_id = ANY($1::int[])
         AND status IN ('confirmed', 'pending')`,
      [targetIds]
    );

    const blockedSet = new Set(bookedRows.map((item) => item.experience_id));
    const blockedIds = targetIds.filter((id) => blockedSet.has(id));
    const clearableIds = targetIds.filter((id) => !blockedSet.has(id));

    if (clearableIds.length > 0) {
      await pool.query(
        `UPDATE experiences
         SET date_time = NULL,
             status = 'pending',
             rejection_reason = NULL
         WHERE id = ANY($1::int[])`,
        [clearableIds]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Unavailable dates processed successfully.',
      data: {
        requested_dates: normalizedDates,
        cleared_experience_ids: clearableIds,
        blocked_experience_ids: blockedIds,
      },
    });
  } catch (error) {
    console.error('Failed to set unavailable dates:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const getBookingPreferences = async (req, res) => {
  try {
    const experienceId = Number(req.params.id);
    const ehostId = req.user ? req.user.id : req.userId;

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid experience id.' });
    }

    const { rows } = await pool.query(
      `SELECT id, gender_preference, max_visitors, date_time
       FROM experiences
       WHERE id = $1 AND ehost_id = $2 AND status != 'deleted'
       LIMIT 1`,
      [experienceId, ehostId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found or you do not have permission.',
      });
    }

    const experience = rows[0];
    const normalizedGenderPreference = normalizeGenderPreference(experience.gender_preference) || 'any';

    res.status(200).json({
      success: true,
      data: {
        experience_id: experience.id,
        gender_preference: normalizedGenderPreference,
        max_visitors: experience.max_visitors,
        booking_cutoff: {
          type: 'before_experience_start',
          experience_date_time: experience.date_time,
        },
        cancellation_policy: bookingCancellationPolicy,
      },
      supported_gender_preferences: supportedGenderPreferences,
    });
  } catch (error) {
    console.error('Failed to get booking preferences:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const updateBookingPreferences = async (req, res) => {
  try {
    const experienceId = Number(req.params.id);
    const ehostId = req.user ? req.user.id : req.userId;
    const { gender_preference, max_visitors } = req.body;

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid experience id.' });
    }

    if (gender_preference === undefined && max_visitors === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one preference field is required.',
      });
    }

    const updates = [];
    const values = [];

    if (gender_preference !== undefined) {
      const normalizedGenderPreference = normalizeGenderPreference(gender_preference);
      if (!normalizedGenderPreference) {
        return res.status(400).json({
          success: false,
          message: `Invalid gender_preference. Allowed values: ${supportedGenderPreferences.join(', ')}`,
        });
      }
      values.push(normalizedGenderPreference);
      updates.push(`gender_preference = $${values.length}`);
    }

    if (max_visitors !== undefined) {
      const normalizedMaxVisitors = Number(max_visitors);
      if (!Number.isInteger(normalizedMaxVisitors) || normalizedMaxVisitors <= 0) {
        return res.status(400).json({
          success: false,
          message: 'max_visitors must be a positive integer.',
        });
      }
      values.push(normalizedMaxVisitors);
      updates.push(`max_visitors = $${values.length}`);
    }

    values.push(experienceId);
    values.push(ehostId);

    const { rows } = await pool.query(
      `UPDATE experiences
       SET ${updates.join(', ')},
           status = 'pending',
           rejection_reason = NULL
       WHERE id = $${values.length - 1} AND ehost_id = $${values.length} AND status != 'deleted'
       RETURNING id, gender_preference, max_visitors, date_time`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found or you do not have permission.',
      });
    }

    const experience = rows[0];
    const normalizedGenderPreference = normalizeGenderPreference(experience.gender_preference) || 'any';

    res.status(200).json({
      success: true,
      message: 'Booking preferences updated successfully.',
      data: {
        experience_id: experience.id,
        gender_preference: normalizedGenderPreference,
        max_visitors: experience.max_visitors,
        booking_cutoff: {
          type: 'before_experience_start',
          experience_date_time: experience.date_time,
        },
        cancellation_policy: bookingCancellationPolicy,
      },
      supported_gender_preferences: supportedGenderPreferences,
    });
  } catch (error) {
    console.error('Failed to update booking preferences:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const updateBookingMeetingLink = async (req, res) => {
  try {
    const ehostId = req.user ? req.user.id : req.userId;
    const bookingId = Number(req.params.id);
    const {
      platform = 'Custom',
      meeting_link,
      meeting_password = null,
    } = req.body;

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking id.' });
    }

    if (!meeting_link || typeof meeting_link !== 'string' || !meeting_link.trim()) {
      return res.status(400).json({ success: false, message: 'Meeting link is required.' });
    }

    const normalizedLink = meeting_link.trim();
    if (!/^https?:\/\//i.test(normalizedLink)) {
      return res.status(400).json({ success: false, message: 'Meeting link must start with http:// or https://.' });
    }

    const { rows: ownershipRows } = await pool.query(
      `SELECT b.id
       FROM bookings b
       JOIN experiences e ON e.id = b.experience_id
       WHERE b.id = $1
         AND e.ehost_id = $2
         AND e.date_time >= NOW()
         AND b.status = 'confirmed'
       LIMIT 1`,
      [bookingId, ehostId]
    );

    if (ownershipRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found, not upcoming, or you do not have permission.',
      });
    }

    const meetingConfigString = JSON.stringify({
      platform: String(platform || 'Custom').trim() || 'Custom',
      link: normalizedLink,
      password: meeting_password && String(meeting_password).trim()
        ? String(meeting_password).trim()
        : null,
    });

    const { rows: updateRows } = await pool.query(
      `UPDATE bookings
       SET meeting_link = $1
       WHERE id = $2
       RETURNING id, meeting_link`,
      [meetingConfigString, bookingId]
    );

    res.status(200).json({
      success: true,
      message: 'Meeting link configured successfully.',
      suggested_services: suggestedMeetingServices,
      data: {
        booking_id: updateRows[0].id,
        meeting_config: toMeetingConfig(updateRows[0].meeting_link),
      },
    });
  } catch (error) {
    console.error('Failed to update meeting link:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};







//ehost-01: eHost Application Submission API 

const sendConfirmationEmail = (email, name) => {
  console.log(`[Email Service] is sending a confirmation email to ${email}...`);
  console.log(`Dear ${name}, we have received your eHost application. Our colleague will review it within 2-3 business days and contact you.`);
};

const submitApplication = async (req, res) => {
  try {
    
    const { 
      name, birthday, nationality, email, 
      hasExperience, yearsOfExperience, pastJourneyInfo, preferredCountry, 
      preferredSpotTypes, description, videoLink, isContractAgreed 
    } = req.body;

    
    const { rows: existingRows } = await pool.query(
      'SELECT id FROM ehost_applications WHERE email = $1', 
      [email]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ message: "This email has already submitted an application. Please wait for the review." });
    }

    // !!!Save the data into the database.
    const { rows: newAppRows } = await pool.query(
      `INSERT INTO ehost_applications 
      (name, birthday, nationality, email, has_experience, years_of_experience, past_journey_info, preferred_country, preferred_spot_types, description, video_link, is_contract_agreed, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending') 
      RETURNING id`,
      [
        name, 
        birthday, 
        nationality, 
        email, 
        hasExperience, 
        yearsOfExperience || 0, 
        pastJourneyInfo || null, 
        preferredCountry, 
        preferredSpotTypes ? JSON.stringify(preferredSpotTypes) : null, 
        description, 
        videoLink, 
        isContractAgreed
      ]
    );

    
    sendConfirmationEmail(email, name);

    
    res.status(201).json({ 
      success: true, 
      message: "Application submitted successfully! A confirmation email will be sent to your inbox within 2-3 business days.",
      applicationId: newAppRows[0].id 
    });

  } catch (error) {
    console.error("Application submission failed:", error);
    res.status(500).json({ message: "Internal server error, please try again later" });
  }
};


module.exports = { 
  createExperience, 
  getExperiences, 
  getExperienceById, 
  updateExperience, 
  deleteExperience, 
  getBookings,
  getCalendarSlots,
  createCalendarSlot,
  updateCalendarSlot,
  deleteCalendarSlot,
  setUnavailableDates,
  updateBookingMeetingLink,
  getBookingPreferences,
  updateBookingPreferences,
  submitApplication 
};
