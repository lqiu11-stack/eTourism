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
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      if (!roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.userId = payload.userId;
      req.userRole = payload.role;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}



/*3-4 edit ehost registionation and login by Emily 
Middleware for validating eHost application form data */
const validateApplication = (req, res, next) => {
  const {
    name, birthday, country, email, password,
    hasExperience, preferredCountry,
    description, videoLink, isContractAgreed
  } = req.body;


  if (!name || !birthday || !country || !email) {
    return res.status(400).json({ message: "Please fill in all required personal details." });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
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

module.exports = { requireAuth, requireRole, validateApplication };
