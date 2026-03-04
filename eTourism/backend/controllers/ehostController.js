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