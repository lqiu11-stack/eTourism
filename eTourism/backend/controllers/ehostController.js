const createExperience = async (req, res) => {
  // TODO
};

const getExperiences = async (req, res) => {
  // TODO
};

const getExperienceById = async (req, res) => {
  // TODO
};

const updateExperience = async (req, res) => {
  // TODO
};

const deleteExperience = async (req, res) => {
  // TODO
};

const getBookings = async (req, res) => {
  // TODO
};

module.exports = { createExperience, getExperiences, getExperienceById, updateExperience, deleteExperience, getBookings };

/*
3-2
account registeration and login by Emily
*/

/*
3-4
account registeration and login edit by Emily
*/

const mongoose = require('mongoose');

const eHostApplicationSchema = new mongoose.Schema({
  //page 4: Personal detail 
  name: { type: String, required: true }, 
  birthday: { type: Date, required: true }, 
  nationality: { type: String, required: true }, 
  email: { type: String, required: true, unique: true }, 

  // page 3: Your experience 
  hasExperience: { type: Boolean, required: true }, 
  yearsOfExperience: { type: Number, default: 0 }, 
  pastJourneyInfo: { type: String }, 
  preferredCountry: { type: String, required: true }, 

  // page 2: Tell us more
  preferredSpotTypes: [{ type: String }], 
  description: { type: String, required: true }, 
  videoLink: { type: String, required: true }, 

  // page 1: Contract & Status 
  isContractAgreed: { type: Boolean, required: true }, 
  
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  appliedAt: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('EHostApplication', eHostApplicationSchema);





const EHostApplication = require('../models/eHostApplication');
const submitApplication = async (req, res) => {
  try {
    
    const applicationData = req.body;

    
    const existingApplication = await EHostApplication.findOne({ email: applicationData.email });
    if (existingApplication) {
      return res.status(409).json({ message: "This email has already submitted an application. Please wait for the review." });
    }

    
    const newApplication = new EHostApplication(applicationData);
    await newApplication.save();

   
    sendConfirmationEmail(newApplication.email, newApplication.name);

  
    res.status(201).json({ 
      success: true, 
      message: "Application submitted successfully! A confirmation email will be sent to your inbox within 2-3 business days.",
      applicationId: newApplication._id
    });

  } catch (error) {
    console.error("Application submission failed:", error);
    res.status(500).json({ message: "Internal server error, please try again later" });
  }
};


const sendConfirmationEmail = (email, name) => {
  console.log(`[Email Service] is sending a confirmation email to ${email}...`);
  console.log(`Dear ${name}, we have received your eHost application. Our colleague will review it within 2-3 business days and contact you.`);
};

module.exports = { submitApplication };


/*
3-5
manage experience by Emily
*/

const pool = require('../config/db');

//page1 get experience list of current ehost
exports.getMyExperiences = async (req, res) => {
    try {
        const ehostId = req.user.id; 
        const { rows } = await pool.query(
            `SELECT id, cover_image, location_name, price, status, rejection_reason 
             FROM experiences 
             WHERE ehost_id = $1 AND status != 'deleted'
             ORDER BY created_at DESC`,
            [ehostId]
        );

        res.status(200).json({
            success: true,
            data: rows 
        });
    } catch (error) {
        console.error("Failed to retrieve experience list:", error);
        res.status(500).json({ success: false, message: 'Server internal error' });
    }
};

//page2 get experience details by id
exports.getExperienceById = async (req, res) => {
    try {
        const experienceId = req.params.id;
        const ehostId = req.user.id;

        const { rows } = await pool.query(
            `SELECT * FROM experiences WHERE id = $1 AND ehost_id = $2`,
            [experienceId, ehostId]
        );

        const experience = rows[0]; 

        if (!experience) {
            return res.status(404).json({ success: false, message: 'Failed to find the experience or you have no permission to view it' });
        }

        res.status(200).json({
            success: true,
            data: experience
        });
    } catch (error) {
        console.error("Failed to retrieve experience details", error);
        res.status(500).json({ success: false, message: 'Server internal error' });
    }
};

//page3 update experience by id
exports.updateExperience = async (req, res) => {
    try {
        const experienceId = req.params.id;
        const ehostId = req.user.id;
        
      
        const { location_name, description, category, price } = req.body;

       
        const { rows: checkRows } = await pool.query(
            `SELECT id FROM experiences WHERE id = $1 AND ehost_id = $2`,
            [experienceId, ehostId]
        );

        if (checkRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Failed to find the experience or you have no permission to update it' });
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

        res.status(200).json({
            success: true,
            message: 'Experience updated, please wait for platform re-review',
            data: updateRows[0]
        });
    } catch (error) {
        console.error("Failed to update experience:", error);
        res.status(500).json({ success: false, message: 'Server internal error' });
    }
};

//page4 deactivate experience by id (soft delete)
exports.deactivateExperience = async (req, res) => {
    try {
        const experienceId = req.params.id;
        const ehostId = req.user.id;

       
        const { rows } = await pool.query(
            `UPDATE experiences 
             SET status = 'deleted' 
             WHERE id = $1 AND ehost_id = $2
             RETURNING id`,
            [experienceId, ehostId]
        );

        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Failed to find the experience or you have no permission to deactivate it' });
        }

        res.status(200).json({
            success: true,
            message: 'Experience deactivated successfully'
        });
    } catch (error) {
        console.error("Failed to deactivate experience:", error);
        res.status(500).json({ success: false, message: 'Server internal error' });
    }
};