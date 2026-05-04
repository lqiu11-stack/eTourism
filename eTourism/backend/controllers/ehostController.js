const pool = require('../config/db');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { continentForCountry } = require('../constants/countryContinents');
const { CATEGORIES, LANGUAGES, CONTINENTS, GENDER_PREFERENCES, USER_GENDERS } = require('../constants/enums');

const YOUTUBE_URL_RE = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})([&?].*)?$/i;

const EDITABLE_PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'display_name',
  'bio',
  'profile_image',
  'country',
  'language',
  'date_of_birth',
];

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

const normalizePiggybackCap = (allowsFlag, capValue) => {
  const allows = allowsFlag === true || allowsFlag === 'true';
  if (!allows) {
    return { value: null };
  }
  if (capValue === undefined || capValue === null || String(capValue).trim() === '') {
    return { error: 'max_piggyback_visitors is required when piggyback bookings are enabled.' };
  }
  const parsed = Number(capValue);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return { error: 'max_piggyback_visitors must be a positive integer.' };
  }
  return { value: parsed };
};

const normalizeAddonPrice = (allowsFlag, priceValue, fieldLabel) => {
  const allows = allowsFlag === true || allowsFlag === 'true';
  if (!allows) {
    return { allows: false, price: null };
  }
  if (priceValue === undefined || priceValue === null || String(priceValue).trim() === '') {
    return { error: `${fieldLabel} is required when the add-on is enabled.` };
  }
  const parsed = Number(priceValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: `${fieldLabel} must be a non-negative number.` };
  }
  return { allows: true, price: parsed };
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
        allows_piggyback,  // Boolean
        sample_video_url,
        video_description,
        video_highlights,
        date_time,
        price_discounted,
        meeting_link,
        additional_images,
        allows_souvenir_addon,
        souvenir_price,
        allows_video_addon,
        video_addon_price,
        max_piggyback_visitors,
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

    if (
        !Array.isArray(additional_images) ||
        additional_images.length < 3 ||
        additional_images.length > 6 ||
        !additional_images.every((v) => typeof v === 'string' && v.trim() !== '')
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please upload between 3 and 6 additional photos.',
        });
    }
    const normalizedAdditionalImages = additional_images.map((s) => s.trim());

    if (!meeting_link || typeof meeting_link !== 'string' || !meeting_link.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Meeting link is required.'
        });
    }
    const normalizedMeetingLink = meeting_link.trim();
    if (!/^https?:\/\//i.test(normalizedMeetingLink)) {
        return res.status(400).json({
            success: false,
            message: 'Meeting link must start with http:// or https://.'
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

    const normalizedGenderPreference = normalizeGenderPreference(gender_preference);
    if (!normalizedGenderPreference) {
      return res.status(400).json({
        success: false,
        message: `Invalid gender_preference. Allowed values: ${supportedGenderPreferences.join(', ')}`,
      });
    }

    const trimmedSampleVideoUrl =
      sample_video_url !== undefined && sample_video_url !== null
        ? String(sample_video_url).trim()
        : '';
    if (!trimmedSampleVideoUrl) {
      return res.status(400).json({
        success: false,
        message: 'sample_video_url is required.',
      });
    }
    if (!YOUTUBE_URL_RE.test(trimmedSampleVideoUrl)) {
      return res.status(400).json({
        success: false,
        message: 'sample_video_url must be a valid YouTube link.',
      });
    }
    const normalizedSampleVideoUrl = trimmedSampleVideoUrl;

    let normalizedVideoHighlights = null;
    if (Array.isArray(video_highlights)) {
      const cleaned = video_highlights
        .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
        .filter(Boolean);
      normalizedVideoHighlights = cleaned.length ? cleaned : null;
    }

    const trimmedVideoDescription =
      typeof video_description === 'string' ? video_description.trim() : '';
    if (!trimmedVideoDescription) {
      return res.status(400).json({
        success: false,
        message: 'video_description is required.',
      });
    }
    const normalizedVideoDescription = trimmedVideoDescription;

    let normalizedDateTime = null;
    if (date_time !== undefined && date_time !== null && String(date_time).trim() !== '') {
      normalizedDateTime = parseDateTimeInput(date_time);
      if (!normalizedDateTime) {
        return res.status(400).json({ success: false, message: 'Invalid date_time.' });
      }
      if (new Date(normalizedDateTime).getTime() <= Date.now()) {
        return res.status(400).json({ success: false, message: 'date_time must be in the future.' });
      }
    }

    let normalizedPriceDiscounted = null;
    if (price_discounted !== undefined && price_discounted !== null && String(price_discounted).trim() !== '') {
      const parsedDiscount = Number(price_discounted);
      if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
        return res.status(400).json({ success: false, message: 'price_discounted must be a non-negative number.' });
      }
      if (parsedDiscount >= Number(price)) {
        return res.status(400).json({ success: false, message: 'price_discounted must be lower than price.' });
      }
      normalizedPriceDiscounted = parsedDiscount;
    }

    const souvenirAddon = normalizeAddonPrice(allows_souvenir_addon, souvenir_price, 'souvenir_price');
    if (souvenirAddon.error) {
      return res.status(400).json({ success: false, message: souvenirAddon.error });
    }
    const videoAddon = normalizeAddonPrice(allows_video_addon, video_addon_price, 'video_addon_price');
    if (videoAddon.error) {
      return res.status(400).json({ success: false, message: videoAddon.error });
    }

    const piggybackCap = normalizePiggybackCap(allows_piggyback, max_piggyback_visitors);
    if (piggybackCap.error) {
      return res.status(400).json({ success: false, message: piggybackCap.error });
    }

    const derivedContinent = continentForCountry(country);

    const { rows } = await pool.query(
        `INSERT INTO experiences
        (title, ehost_id, location_name, country, continent, latitude, longitude, category, language, description, price, price_discounted, duration_minutes, max_visitors, cover_image, gender_preference, allows_piggyback, sample_video_url, video_description, video_highlights, date_time, meeting_link, additional_images, allows_souvenir_addon, souvenir_price, allows_video_addon, video_addon_price, max_piggyback_visitors, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 'pending')
        RETURNING *`,
        [
            title,
            ehostId,
            location_name,
            country,
            derivedContinent,
            latitude || null,
            longitude || null,
            category || null,
            language || 'English',
            description,
            price,
            normalizedPriceDiscounted,
            duration_minutes || 60,
            max_visitors || 10,
            cover_image,
            normalizedGenderPreference,
            allows_piggyback || false,
            normalizedSampleVideoUrl,
            normalizedVideoDescription,
            normalizedVideoHighlights,
            normalizedDateTime,
            normalizedMeetingLink,
            normalizedAdditionalImages,
            souvenirAddon.allows,
            souvenirAddon.price,
            videoAddon.allows,
            videoAddon.price,
            piggybackCap.value,
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
        `SELECT id, title, cover_image, location_name, country, price, status, rejection_reason, date_time, meeting_link
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

    const { rows: checkRows } = await pool.query(
        `SELECT id, status FROM experiences WHERE id = $1 AND ehost_id = $2`,
        [experienceId, ehostId]
    );
    if (checkRows.length === 0) {
        return res.status(404).json({ success: false, message: 'This experience was not found or you do not have permission to modify it.' });
    }
    const currentStatus = checkRows[0].status;
    if (currentStatus !== 'pending' && currentStatus !== 'approved') {
        return res.status(403).json({ success: false, message: 'Experience can only be edited while pending or approved.' });
    }

    const {
        title,
        location_name,
        country,
        latitude,
        longitude,
        category,
        language,
        description,
        price,
        duration_minutes,
        max_visitors,
        cover_image,
        gender_preference,
        allows_piggyback,
        sample_video_url,
        video_description,
        video_highlights,
        date_time,
        price_discounted,
        meeting_link,
        additional_images,
        allows_souvenir_addon,
        souvenir_price,
        allows_video_addon,
        video_addon_price,
        max_piggyback_visitors,
    } = req.body;

    if (!title || !location_name || !country || !price || !description) {
        return res.status(400).json({
            success: false,
            message: 'Required fields are missing: Location name, country, price, and description cannot be empty.'
        });
    }
    if (!cover_image || typeof cover_image !== 'string') {
        return res.status(400).json({ success: false, message: 'Please upload a cover image of the experience project.' });
    }
    if (
        !Array.isArray(additional_images) ||
        additional_images.length < 3 ||
        additional_images.length > 6 ||
        !additional_images.every((v) => typeof v === 'string' && v.trim() !== '')
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please upload between 3 and 6 additional photos.',
        });
    }
    const normalizedAdditionalImages = additional_images.map((s) => s.trim());
    if (!meeting_link || typeof meeting_link !== 'string' || !meeting_link.trim()) {
        return res.status(400).json({ success: false, message: 'Meeting link is required.' });
    }
    const normalizedMeetingLink = meeting_link.trim();
    if (!/^https?:\/\//i.test(normalizedMeetingLink)) {
        return res.status(400).json({ success: false, message: 'Meeting link must start with http:// or https://.' });
    }
    if (category && !CATEGORIES.includes(category)) {
        return res.status(400).json({ success: false, message: `Invalid category. Allowed values: ${CATEGORIES.join(', ')}` });
    }
    if (language && !LANGUAGES.includes(language)) {
        return res.status(400).json({ success: false, message: `Invalid language. Allowed values: ${LANGUAGES.join(', ')}` });
    }
    const normalizedGenderPreference = normalizeGenderPreference(gender_preference);
    if (!normalizedGenderPreference) {
        return res.status(400).json({ success: false, message: `Invalid gender_preference. Allowed values: ${supportedGenderPreferences.join(', ')}` });
    }
    const trimmedSampleVideoUrl =
        sample_video_url !== undefined && sample_video_url !== null
            ? String(sample_video_url).trim()
            : '';
    if (!trimmedSampleVideoUrl) {
        return res.status(400).json({ success: false, message: 'sample_video_url is required.' });
    }
    if (!YOUTUBE_URL_RE.test(trimmedSampleVideoUrl)) {
        return res.status(400).json({ success: false, message: 'sample_video_url must be a valid YouTube link.' });
    }
    const normalizedSampleVideoUrl = trimmedSampleVideoUrl;

    let normalizedVideoHighlights = null;
    if (Array.isArray(video_highlights)) {
        const cleaned = video_highlights
            .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
            .filter(Boolean);
        normalizedVideoHighlights = cleaned.length ? cleaned : null;
    }

    const trimmedVideoDescription =
        typeof video_description === 'string' ? video_description.trim() : '';
    if (!trimmedVideoDescription) {
        return res.status(400).json({ success: false, message: 'video_description is required.' });
    }
    const normalizedVideoDescription = trimmedVideoDescription;

    let normalizedDateTime = null;
    if (date_time !== undefined && date_time !== null && String(date_time).trim() !== '') {
        normalizedDateTime = parseDateTimeInput(date_time);
        if (!normalizedDateTime) {
            return res.status(400).json({ success: false, message: 'Invalid date_time.' });
        }
        if (new Date(normalizedDateTime).getTime() <= Date.now()) {
            return res.status(400).json({ success: false, message: 'date_time must be in the future.' });
        }
    }

    let normalizedPriceDiscounted = null;
    if (price_discounted !== undefined && price_discounted !== null && String(price_discounted).trim() !== '') {
        const parsedDiscount = Number(price_discounted);
        if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
            return res.status(400).json({ success: false, message: 'price_discounted must be a non-negative number.' });
        }
        if (parsedDiscount >= Number(price)) {
            return res.status(400).json({ success: false, message: 'price_discounted must be lower than price.' });
        }
        normalizedPriceDiscounted = parsedDiscount;
    }

    if (normalizedDateTime) {
        const resolvedDuration = parsePositiveInteger(duration_minutes || 60);
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
    }

    const souvenirAddon = normalizeAddonPrice(allows_souvenir_addon, souvenir_price, 'souvenir_price');
    if (souvenirAddon.error) {
        return res.status(400).json({ success: false, message: souvenirAddon.error });
    }
    const videoAddon = normalizeAddonPrice(allows_video_addon, video_addon_price, 'video_addon_price');
    if (videoAddon.error) {
        return res.status(400).json({ success: false, message: videoAddon.error });
    }
    const piggybackCap = normalizePiggybackCap(allows_piggyback, max_piggyback_visitors);
    if (piggybackCap.error) {
        return res.status(400).json({ success: false, message: piggybackCap.error });
    }

    const derivedContinent = continentForCountry(country);

    const { rows: updateRows } = await pool.query(
        `UPDATE experiences
         SET title                  = $1,
             location_name          = $2,
             country                = $3,
             continent              = $4,
             latitude               = $5,
             longitude              = $6,
             category               = $7,
             language               = $8,
             description            = $9,
             price                  = $10,
             price_discounted       = $11,
             duration_minutes       = $12,
             max_visitors           = $13,
             cover_image            = $14,
             gender_preference      = $15,
             allows_piggyback       = $16,
             sample_video_url       = $17,
             video_description      = $18,
             video_highlights       = $19,
             date_time              = $20,
             meeting_link           = $21,
             additional_images      = $22,
             allows_souvenir_addon  = $23,
             souvenir_price         = $24,
             allows_video_addon     = $25,
             video_addon_price      = $26,
             max_piggyback_visitors = $27,
             status                 = 'pending',
             rejection_reason       = NULL
         WHERE id = $28 AND ehost_id = $29
         RETURNING *`,
        [
            title,
            location_name,
            country,
            derivedContinent,
            latitude || null,
            longitude || null,
            category || null,
            language || 'English',
            description,
            price,
            normalizedPriceDiscounted,
            duration_minutes || 60,
            max_visitors || 10,
            cover_image,
            normalizedGenderPreference,
            allows_piggyback || false,
            normalizedSampleVideoUrl,
            normalizedVideoDescription,
            normalizedVideoHighlights,
            normalizedDateTime,
            normalizedMeetingLink,
            normalizedAdditionalImages,
            souvenirAddon.allows,
            souvenirAddon.price,
            videoAddon.allows,
            videoAddon.price,
            piggybackCap.value,
            experienceId,
            ehostId,
        ]
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
        `UPDATE experiences SET status = 'deleted'
         WHERE id = $1 AND ehost_id = $2 AND status <> 'approved'
         RETURNING id`,
        [experienceId, ehostId]
    );

    if (rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Approved experiences cannot be deleted, or this experience does not belong to you.' });
    }

    res.status(200).json({ success: true, message: 'Experience has been successfully removed.' });
  } catch (error) {
    console.error("Failed to remove experience:", error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};


const getBookingsByExperience = async (req, res) => {
  try {
    const ehostId = req.user ? req.user.id : req.userId;
    const experienceId = Number(req.params.id);
    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid experience id.' });
    }

    const { rows: ownerRows } = await pool.query(
      `SELECT id, title FROM experiences WHERE id = $1 AND ehost_id = $2`,
      [experienceId, ehostId]
    );
    if (ownerRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Experience not found or you do not have permission.' });
    }

    const { rows } = await pool.query(
      `SELECT b.id, b.status, b.amount_paid, b.qty_normal, b.qty_discounted,
              b.contact_name, b.contact_email, b.created_at,
              b.souvenir_qty, b.video_addon,
              u.first_name, u.last_name, u.email, u.display_name,
              p.method AS payment_method, p.status AS payment_status
         FROM bookings b
         JOIN users u ON u.id = b.visitor_id
         LEFT JOIN payments p ON p.booking_id = b.id
        WHERE b.experience_id = $1
        ORDER BY b.created_at DESC`,
      [experienceId]
    );

    res.status(200).json({
      success: true,
      data: { experience: ownerRows[0], bookings: rows },
    });
  } catch (error) {
    console.error('Failed to load bookings for experience:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
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
         b.qty_normal,
         b.qty_discounted,
         b.contact_name,
         b.contact_email,
         e.meeting_link,
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
      meeting_config: booking.meeting_link ? { link: booking.meeting_link } : null,
    }));

    res.status(200).json({
      success: true,
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
      `SELECT id, gender_preference, max_visitors, max_piggyback_visitors, date_time
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
        max_piggyback_visitors: experience.max_piggyback_visitors,
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
    const { gender_preference, max_visitors, max_piggyback_visitors } = req.body;

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid experience id.' });
    }

    if (gender_preference === undefined && max_visitors === undefined && max_piggyback_visitors === undefined) {
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

    if (max_piggyback_visitors !== undefined) {
      if (max_piggyback_visitors === null) {
        values.push(null);
        updates.push(`max_piggyback_visitors = $${values.length}`);
      } else {
        const normalizedPiggybackCap = Number(max_piggyback_visitors);
        if (!Number.isInteger(normalizedPiggybackCap) || normalizedPiggybackCap <= 0) {
          return res.status(400).json({
            success: false,
            message: 'max_piggyback_visitors must be a positive integer.',
          });
        }
        values.push(normalizedPiggybackCap);
        updates.push(`max_piggyback_visitors = $${values.length}`);
      }
    }

    values.push(experienceId);
    values.push(ehostId);

    const { rows } = await pool.query(
      `UPDATE experiences
       SET ${updates.join(', ')},
           status = 'pending',
           rejection_reason = NULL
       WHERE id = $${values.length - 1} AND ehost_id = $${values.length} AND status != 'deleted'
       RETURNING id, gender_preference, max_visitors, max_piggyback_visitors, date_time`,
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
        max_piggyback_visitors: experience.max_piggyback_visitors,
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







// ehost profile: self-service profile read/update
const getMe = async (req, res) => {
  try {
    const ehostId = req.user ? req.user.id : req.userId;
    const user = await User.findById(ehostId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Failed to retrieve eHost profile:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const updateMe = async (req, res) => {
  try {
    const ehostId = req.user ? req.user.id : req.userId;

    const updates = {};
    for (const key of EDITABLE_PROFILE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        const value = req.body[key];
        updates[key] = value === '' ? null : value;
      }
    }

    if (updates.language !== undefined && updates.language !== null && !LANGUAGES.includes(updates.language)) {
      return res.status(400).json({
        success: false,
        message: `Invalid language. Allowed values: ${LANGUAGES.join(', ')}`,
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No editable fields provided.' });
    }

    const updated = await User.update(ehostId, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update eHost profile:', error);
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
      name, birthday, country, gender, email, password,
      hasExperience, yearsOfExperience,
      description, videoLink
    } = req.body;

    if (!gender || !USER_GENDERS.includes(gender)) {
      return res.status(400).json({ message: `Gender is required. Allowed values: ${USER_GENDERS.join(', ')}` });
    }

    const { rows: existingRows } = await pool.query(
      'SELECT id FROM ehost_applications WHERE email = $1',
      [email]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ message: "This email has already submitted an application. Please wait for the review." });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "This email is already registered. Please use a different email." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // !!!Save the data into the database.
    const { rows: newAppRows } = await pool.query(
      `INSERT INTO ehost_applications
      (name, birthday, country, gender, email, password_hash, has_experience, years_of_experience, description, video_link, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING id`,
      [
        name,
        birthday,
        country,
        gender,
        email,
        password_hash,
        hasExperience,
        yearsOfExperience || 0,
        description,
        videoLink
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
    const detail = error.detail || error.message || "Unknown error";
    res.status(500).json({ message: `Submission failed: ${detail}` });
  }
};


module.exports = { 
  createExperience, 
  getExperiences, 
  getExperienceById, 
  updateExperience, 
  deleteExperience, 
  getBookings,
  getBookingsByExperience,
  getCalendarSlots,
  createCalendarSlot,
  updateCalendarSlot,
  deleteCalendarSlot,
  setUnavailableDates,
  getBookingPreferences,
  updateBookingPreferences,
  getMe,
  updateMe,
  submitApplication
};
