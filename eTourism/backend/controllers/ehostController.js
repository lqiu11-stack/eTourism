const pool = require('../config/db');
const ExperienceMeetingLink = require('../models/ExperienceMeetingLink');
const ExperienceBookingPreference = require('../models/ExperienceBookingPreference');

const DEFAULT_CANCELLATION_POLICY = {
  type: 'tiered_refund_v1',
  tiers: [
    { min_days: 14, refund_pct: 100 },
    { min_days: 7, refund_pct: 50 },
    { min_days: 0, refund_pct: 0 },
  ],
};

const normalizePolicyInput = (policy) => {
  if (policy == null) return DEFAULT_CANCELLATION_POLICY;
  if (typeof policy === 'string') {
    try {
      return JSON.parse(policy);
    } catch {
      return null;
    }
  }
  return policy;
};

const validateCancellationPolicy = (policy) => {
  const normalized = normalizePolicyInput(policy);
  if (!normalized || normalized.type !== 'tiered_refund_v1' || !Array.isArray(normalized.tiers)) {
    return null;
  }
  const tiers = normalized.tiers
    .map((t) => ({
      min_days: Number(t?.min_days),
      refund_pct: Number(t?.refund_pct),
    }))
    .filter((t) => Number.isFinite(t.min_days) && Number.isFinite(t.refund_pct));
  if (tiers.length === 0) {
    return null;
  }
  return { type: 'tiered_refund_v1', tiers };
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
   
    const { rows } = await pool.query(
        `INSERT INTO experiences 
        (title,ehost_id, location_name, country, latitude, longitude, category, description, price, duration_minutes, max_visitors, cover_image, gender_preference, allows_piggyback, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
        RETURNING *`,
        [
            title,
            ehostId, 
            location_name, 
            country, 
            latitude || null,     
            longitude || null, 
            category, 
            description, 
            price, 
            duration_minutes || 60, 
            max_visitors || 10,  
            cover_image,            
            gender_preference || 'Any', 
            allows_piggyback || false  
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
    const { location_name, description, category, price, gender_preference, allows_piggyback  } = req.body;

    const { rows: checkRows } = await pool.query(
        `SELECT id FROM experiences WHERE id = $1 AND ehost_id = $2`,
        [experienceId, ehostId]
    );
    
    if (checkRows.length === 0) {
        return res.status(404).json({ success: false, message: 'This experience was not found or you do not have permission to modify it.' });
    }


    const { rows: updateRows } = await pool.query(
        `UPDATE experiences 
         SET location_name = COALESCE($1, location_name),
             description = COALESCE($2, description),
             category = COALESCE($3, category),
             price = COALESCE($4, price),
             gender_preference = COALESCE($5, gender_preference),
             allows_piggyback = COALESCE($6, allows_piggyback),
             status = 'pending', 
             rejection_reason = NULL
         WHERE id = $7 AND ehost_id = $8
         RETURNING *`,
        [location_name, description, category, price, gender_preference, allows_piggyback, experienceId, ehostId]
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


const getBookings = async (req, res) => {
 
  // TODO: Implement EH-04 order and meeting link management later.
  res.status(200).json({ message: "Bookings API Placeholder" });
};

const getExperienceMeetingLink = async (req, res) => {
  try {
    const experienceId = req.params.id;
    const ehostId = req.user ? req.user.id : req.userId;

    const { rows } = await pool.query(
      `SELECT id, date_time
       FROM experiences
       WHERE id = $1 AND ehost_id = $2`,
      [experienceId, ehostId]
    );

    const experience = rows[0];
    if (!experience) {
      return res.status(404).json({ success: false, message: 'This experience was not found or you do not have permission to view it.' });
    }

    const config = await ExperienceMeetingLink.findByExperienceId(experience.id);
    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to retrieve meeting link config:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const upsertExperienceMeetingLink = async (req, res) => {
  try {
    const experienceId = req.params.id;
    const ehostId = req.user ? req.user.id : req.userId;
    const { platform, meeting_url, meeting_password } = req.body || {};

    if (!platform || String(platform).trim() === '') {
      return res.status(400).json({ success: false, message: 'platform is required' });
    }
    if (!meeting_url || String(meeting_url).trim() === '') {
      return res.status(400).json({ success: false, message: 'meeting_url is required' });
    }

    const { rows } = await pool.query(
      `SELECT id, date_time
       FROM experiences
       WHERE id = $1 AND ehost_id = $2`,
      [experienceId, ehostId]
    );

    const experience = rows[0];
    if (!experience) {
      return res.status(404).json({ success: false, message: 'This experience was not found or you do not have permission to modify it.' });
    }

    if (experience.date_time && new Date(experience.date_time) <= new Date()) {
      return res.status(400).json({ success: false, message: 'Meeting link can only be configured for upcoming experiences.' });
    }

    const saved = await ExperienceMeetingLink.upsertByExperienceId({
      experience_id: experience.id,
      platform: String(platform).trim(),
      meeting_url: String(meeting_url).trim(),
      meeting_password: meeting_password == null ? null : String(meeting_password),
    });

    return res.status(200).json({ success: true, data: saved });
  } catch (error) {
    console.error('Failed to save meeting link config:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const getExperienceBookingPreferences = async (req, res) => {
  try {
    const experienceId = req.params.id;
    const ehostId = req.user ? req.user.id : req.userId;

    const { rows } = await pool.query(
      `SELECT id, date_time
       FROM experiences
       WHERE id = $1 AND ehost_id = $2`,
      [experienceId, ehostId]
    );

    const experience = rows[0];
    if (!experience) {
      return res.status(404).json({ success: false, message: 'This experience was not found or you do not have permission to view it.' });
    }

    const config = await ExperienceBookingPreference.findByExperienceId(experience.id);
    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to retrieve booking preferences:', error);
    res.status(500).json({ success: false, message: 'Server internal error' });
  }
};

const upsertExperienceBookingPreferences = async (req, res) => {
  try {
    const experienceId = req.params.id;
    const ehostId = req.user ? req.user.id : req.userId;
    const {
      min_notice_minutes,
      min_group_size,
      max_group_size,
      group_rule,
      cancellation_policy,
    } = req.body || {};

    const { rows } = await pool.query(
      `SELECT id, date_time
       FROM experiences
       WHERE id = $1 AND ehost_id = $2`,
      [experienceId, ehostId]
    );

    const experience = rows[0];
    if (!experience) {
      return res.status(404).json({ success: false, message: 'This experience was not found or you do not have permission to modify it.' });
    }

    if (experience.date_time && new Date(experience.date_time) <= new Date()) {
      return res.status(400).json({ success: false, message: 'Booking preferences can only be configured for upcoming experiences.' });
    }

    const minNotice = min_notice_minutes == null ? 0 : Number(min_notice_minutes);
    const minGroup = min_group_size == null ? 1 : Number(min_group_size);
    const maxGroup = max_group_size == null ? null : Number(max_group_size);
    const groupRule = String(group_rule || 'any');
    const allowedGroupRules = ['any', 'no_all_male_groups'];

    if (!Number.isFinite(minNotice) || minNotice < 0) {
      return res.status(400).json({ success: false, message: 'min_notice_minutes must be a non-negative number' });
    }
    if (!Number.isFinite(minGroup) || minGroup < 1) {
      return res.status(400).json({ success: false, message: 'min_group_size must be at least 1' });
    }
    if (maxGroup != null && (!Number.isFinite(maxGroup) || maxGroup < minGroup)) {
      return res.status(400).json({ success: false, message: 'max_group_size must be greater than or equal to min_group_size' });
    }
    if (!allowedGroupRules.includes(groupRule)) {
      return res.status(400).json({ success: false, message: 'group_rule is invalid' });
    }

    const validatedPolicy = cancellation_policy == null
      ? DEFAULT_CANCELLATION_POLICY
      : validateCancellationPolicy(cancellation_policy);

    if (!validatedPolicy) {
      return res.status(400).json({ success: false, message: 'cancellation_policy is invalid' });
    }

    const saved = await ExperienceBookingPreference.upsertByExperienceId({
      experience_id: experience.id,
      min_notice_minutes: Math.trunc(minNotice),
      min_group_size: Math.trunc(minGroup),
      max_group_size: maxGroup == null ? null : Math.trunc(maxGroup),
      group_rule: groupRule,
      cancellation_policy: validatedPolicy,
    });

    return res.status(200).json({ success: true, data: saved });
  } catch (error) {
    console.error('Failed to save booking preferences:', error);
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
  getExperienceMeetingLink,
  upsertExperienceMeetingLink,
  getExperienceBookingPreferences,
  upsertExperienceBookingPreferences,
  submitApplication 
};
