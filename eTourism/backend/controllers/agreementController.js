const User = require('../models/User');
const UserAgreement = require('../models/UserAgreement');

const AGREEMENT_TITLE = 'eTourism User Agreement & Terms of Service';

const AGREEMENT_CONTENT = `By registering for or using the eTourism platform, you agree to be bound by this User Agreement. You must be at least 18 years old. You are responsible for your account security and for complying with conduct and payment rules when booking or hosting experiences. For the full text, contact support or refer to product documentation.

We may update this agreement; continued use after changes constitutes acceptance.`;

const getAgreement = async (req, res) => {
  try {
    return res.status(200).json({
      title: AGREEMENT_TITLE,
      content: AGREEMENT_CONTENT,
    });
  } catch (err) {
    console.error('[getAgreement]', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

const acceptAgreement = async (req, res) => {
  try {
    const userId = req.body.userId != null ? Number(req.body.userId) : NaN;
    if (Number.isNaN(userId) || userId < 1) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const existing = await UserAgreement.findByUser(userId);
    if (existing) {
      return res.status(200).json({
        message: 'Agreement already on file',
        record: existing,
      });
    }

    const record = await UserAgreement.create({
      user_id: userId,
      is_over_18: true,
      accepted_terms: true,
      accepted_behaviour: true,
      accepted_recording: true,
      payment_method_on_file: false,
    });

    return res.status(201).json({
      message: 'Agreement accepted',
      record,
    });
  } catch (err) {
    console.error('[acceptAgreement]', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

module.exports = { getAgreement, acceptAgreement };
