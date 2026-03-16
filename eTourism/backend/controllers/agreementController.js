const AgreementAcceptance = require('../models/AgreementAcceptance');
const User = require('../models/User');

const AGREEMENT_TITLE = 'eTourism User Agreement & Terms of Service';

const AGREEMENT_CONTENT = `Last updated: Please refer to the date displayed when you accept this agreement.

1. ACCEPTANCE OF TERMS
By registering for or using the eTourism platform ("Platform"), you agree to be bound by this User Agreement and Terms of Service ("Agreement"). If you do not agree to these terms, you may not use the Platform or create an account.

2. ELIGIBILITY
You must be at least 18 years of age to create an account and to book or host experiences. By registering, you represent that you meet this age requirement and have the legal capacity to enter into this Agreement. The Platform may be used in different roles: as a Visitor (booking experiences) or as an E-host (creating and hosting experiences). Your use must comply with applicable local laws.

3. ACCOUNT REGISTRATION AND SECURITY
You must provide accurate, current, and complete information when registering. You are responsible for maintaining the confidentiality of your password and for all activity under your account. You must notify us promptly of any unauthorized use. One person or legal entity may maintain only one account unless we expressly permit otherwise.

4. USE AS A VISITOR (BOOKING EXPERIENCES)
When you book an experience as a Visitor:
- You agree to pay the price and any applicable fees displayed at the time of booking. Payment methods (e.g. card, supported payment providers) must be valid and you authorize us to charge them in accordance with your booking.
- Booking confirmations, meeting links, and experience details will be provided as described on the Platform. You are responsible for attending at the scheduled time or for following the cancellation/reschedule and refund policies stated at the time of booking.
- Refund and cancellation rules (including any percentage or amount refundable based on days before the event) are as stated at the time of booking and in the experience listing. We do not guarantee refunds beyond what is explicitly stated in those policies.

5. USE AS AN E-HOST (HOSTING EXPERIENCES)
If you use the Platform as an E-host to create and host experiences:
- You are responsible for the accuracy of your listings, for providing the experience as described, and for complying with all applicable laws and regulations. The Platform may require separate E-host terms or verification.
- You agree to conduct yourself professionally and to treat Visitors fairly. You must not discriminate unlawfully or violate any participant's rights.

6. CONDUCT DURING LIVE EXPERIENCES
- You agree to behave appropriately during live experiences and to comply with the E-host's reasonable instructions. Harassment, abuse, hate speech, illegal activity, or any conduct that endangers or offends others is prohibited.
- Experiences may be recorded for quality assurance, safety, and dispute resolution. By joining an experience, you consent to such recording and to the use of such recordings as described in our Privacy Policy and as permitted by law.
- The Platform and E-hosts may suspend or terminate your access to an experience or to the Platform if you violate these conduct standards.

7. PAYMENTS AND FEES
- You must have a valid payment method on file where required for bookings. All amounts are in the currency shown at the time of booking. We may use third-party payment processors (e.g. Stripe); their terms may also apply to your payments.
- Fees, taxes, and pricing are as displayed. We reserve the right to correct pricing errors and to modify fees with notice where permitted by law.

8. PRIVACY AND PERSONAL DATA
- We collect and process personal data (e.g. name, email, date of birth, payment information) as described in our Privacy Policy. By using the Platform, you consent to such processing.
- Recordings of experiences may contain your image or voice; consent is given as set out in section 6 above. We and E-hosts may use recordings for the purposes stated in this Agreement and in our Privacy Policy.

9. PROHIBITED CONDUCT
You may not: (a) use the Platform for any illegal purpose or in violation of any laws; (b) impersonate others or provide false information; (c) interfere with the Platform's operation or security; (d) scrape, copy, or misuse content or data without permission; (e) circumvent payment or booking systems; or (f) use the Platform to harm, harass, or defraud others. We may suspend or terminate accounts that violate these terms.

10. INTELLECTUAL PROPERTY
The Platform's name, logo, design, and content (other than user-generated content) are owned by us or our licensors. You may not use them without our prior written permission. You retain ownership of content you submit; you grant us a license to use it as needed to operate the Platform and as set out in our policies.

11. DISCLAIMER AND LIMITATION OF LIABILITY
The Platform and experiences are provided "as is." We do not guarantee uninterrupted or error-free service. To the fullest extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, or for any loss of data, revenue, or profits arising from your use of the Platform or experiences. Our total liability shall not exceed the amount you paid to us in the twelve months preceding the claim. Some jurisdictions do not allow certain limitations; in such cases our liability is limited to the maximum permitted by law.

12. DISPUTES AND GOVERNING LAW
Disputes between you and us shall be resolved in accordance with the dispute resolution process stated in our policies and, where applicable, the laws of the jurisdiction designated by us. Disputes between you and an E-host or another user may be subject to separate resolution procedures.

13. CHANGES TO THIS AGREEMENT
We may update this Agreement from time to time. We will notify you of material changes (e.g. by email or notice on the Platform). Continued use of the Platform after the effective date of changes constitutes acceptance of the updated Agreement. If you do not agree, you must stop using the Platform and may close your account.

14. GENERAL
If any part of this Agreement is held invalid or unenforceable, the remaining parts remain in effect. Our failure to enforce a right does not waive that right. This Agreement (together with our Privacy Policy and any other referenced policies) constitutes the entire agreement between you and us regarding the Platform.

By registering, you confirm that you have read, understood, and accept this User Agreement and Terms of Service.`;

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

    const record = await AgreementAcceptance.create(userId);
    return res.status(201).json({
      message: 'Agreement accepted',
      record: { id: record.id, user_id: record.user_id, agreed_at: record.agreed_at },
    });
  } catch (err) {
    console.error('[acceptAgreement]', err);
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

module.exports = { getAgreement, acceptAgreement };
