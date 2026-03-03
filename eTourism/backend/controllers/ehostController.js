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
account registeration and login
*/

// Model definition
const UserSchema = {
    email: { type: String, unique: true, required: true }, 
    password: { type: String, required: true },
    age: { type: Number, min: 18 }, // Visitors must be 18 years of age or older.
    loginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date, default: null }
};

// 1.Register module
// Implement repeatability checks and age verification
//controllers/authController.js - register 方法
const register = async (req, res) => {
    const { email, password, age } = req.body;

    try {
        // 1. Repeatability check
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "This email address has been registered" });
        }

        // 2. Age verification (18 years and older)
        if (age < 18) {
            return res.status(403).json({ message: "Visitors must be 18 years of age or older." });
        }

        // 3. Perform data persistence
        const newUser = new User({ email, password, age }); // It is recommended to use bcrypt to encrypt the password here.
        await newUser.save();

        return res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

//2. Login & Security Logic
// Implements credential verification, status routing, and a 3-failure lockout mechanism for 3 minutes.
// controllers/authController.js - login method
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User does not exist" });

        // 1. Check if the account is locked.
        if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
            return res.status(423).json({ message: "Your user account has been locked" });
        }

        // 2. Credential verification
        const isMatch = (password === user.password); // In practice, bcrypt.compare should be used.

        if (isMatch) {
            // Match successful: Reset the number of attempts and clear the lock.
            user.loginAttempts = 0;
            user.lockoutUntil = null;
            await user.save();

            // Issuing access credentials (Token/Session)
            return res.status(200).json({ message: "Login successful", token: "GENERATED_TOKEN" });
        } else {
            // 3. Match failure: Record the number of times and determine if a match is locked.
            user.loginAttempts += 1;

            if (user.loginAttempts >= 3) {
                user.lockoutUntil = Date.now() + 3 * 60 * 1000; // Lock for 3 minutes
                await user.save();
                return res.status(423).json({ message: "Your user account has been locked" });
            }

            await user.save();
            return res.status(401).json({ message: "Password is incorrect" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { register, login };