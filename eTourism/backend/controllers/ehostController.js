const pool = require('../config/db');


//ehost-03: Experience Creation API (for eHosts to submit experience details for review and listing)
const createExperience = async (req, res) => {
 
try {
    const ehostId = req.user ? req.user.id : req.userId;
    const { 
        location_name, 
        country, 
        latitude, 
        longitude,
        // Details 
        category, 
        description, 
        price, 
        duration_minutes,
        max_visitors,
        cover_image 
    } = req.body;

    // 3-13 update by Emily 
    if (!location_name || !country || !price || !description) {
        return res.status(400).json({ 
            success: false, 
            message: 'Required fields are missing: Location name, country, price, and description cannot be empty.' 
        });
    }

   // 3-14 update by Emily sql insert 
    const { rows } = await pool.query(
        `INSERT INTO experiences 
        (ehost_id, location_name, country, latitude, longitude, category, description, price, duration_minutes, max_visitors, cover_image, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
        RETURNING *`,
        [
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
            cover_image
        ]
    );

    //3-15 update by Emily response
    res.status(201).json({
        success: true,
        message: 'The project has been successfully submitted; please wait for platform review.核',
        data: rows[0]
    });

  } catch (error) {
    console.error("EH-03 Submission of location and experience details failed:", error);
    res.status(500).json({ 
        success: false, 
        message: 'Server internal error, failed to save experience details. Please try again later.' 
    });
  }

  res.status(200).json({ message: "Create API Placeholder" });
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
    const { location_name, description, category, price } = req.body;

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
             status = 'pending', 
             rejection_reason = NULL
         WHERE id = $5 AND ehost_id = $6
         RETURNING *`,
        [location_name, description, category, price, experienceId, ehostId]
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
  submitApplication 
};