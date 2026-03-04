const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { requireAuth };

/*3-4 edit ehost registionation and login by Emily 
Middleware for validating eHost application form data */
const validateApplication = (req, res, next) => {
  const { 
    name, birthday, nationality, email, 
    hasExperience, preferredCountry, 
    description, videoLink, isContractAgreed 
  } = req.body;

  
  if (!name || !birthday || !nationality || !email) {
    return res.status(400).json({ message: "Please fill in all required personal details." });
  }

  if (hasExperience === undefined || !preferredCountry) {
    return res.status(400).json({ message: "Please fill in all required experience details." });
  }

  if (!description || !videoLink) {
    return res.status(400).json({ message: "Please fill in all required details." });
  }

  
  if (isContractAgreed !== true) {
    return res.status(400).json({ message: "You must agree to the privacy policy to submit the application" });
  }

  
  next();
};

module.exports = { validateApplication };
