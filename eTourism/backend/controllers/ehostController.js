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
ehost登录与身份验证 (Authentication)
*/

// 模型定义
const UserSchema = {
    email: { type: String, unique: true, required: true }, 
    password: { type: String, required: true },
    age: { type: Number, min: 18 }, // 满足游客必须18岁或以上的要求
    loginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date, default: null }
};

// 1.注册模块
// 实现重复性检查和年龄校验
//controllers/authController.js - register 方法
const register = async (req, res) => {
    const { email, password, age } = req.body;

    try {
        // 1. 重复性校验 
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "This email address has been registered" });
        }

        // 2. 年龄校验 (18岁以上) 
        if (age < 18) {
            return res.status(403).json({ message: "Visitors must be 18 years of age or older." });
        }

        // 3. 执行数据持久化
        const newUser = new User({ email, password, age }); // 建议此处使用 bcrypt 加密密码
        await newUser.save();

        return res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

//2.登录与锁定逻辑 (Login & Security)
//实现凭据核验、状态分流以及3次失败锁定3分钟机制 
// controllers/authController.js - login 方法
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User does not exist" });

        // 1. 检查账户是否处于锁定状态 
        if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
            return res.status(423).json({ message: "Your user account has been locked" });
        }

        // 2. 凭据核验
        const isMatch = (password === user.password); // 实际应使用 bcrypt.compare

        if (isMatch) {
            // 匹配成功：重置尝试次数并清除锁定 
            user.loginAttempts = 0;
            user.lockoutUntil = null;
            await user.save();

            // 发放访问凭证 (Token/Session) 
            return res.status(200).json({ message: "Login successful", token: "GENERATED_TOKEN" });
        } else {
            // 3. 匹配失败：记录次数并判定锁定 
            user.loginAttempts += 1;

            if (user.loginAttempts >= 3) {
                user.lockoutUntil = Date.now() + 3 * 60 * 1000; // 锁定3分钟 
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
