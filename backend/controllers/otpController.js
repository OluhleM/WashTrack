const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/mailer');

const clean = (v) => String(v || '').trim().toLowerCase();

const hashOtp = (email, code) =>
    crypto.createHash('sha256')
        .update(`${email}:${code}:${process.env.JWT_SECRET}`)
        .digest('hex');

async function issueOtp(user) {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    user.otpHash = hashOtp(user.email, code);
    user.otpExpires = new Date(Date.now() + 10 * 60000);
    user.otpAttempts = 0;
    user.otpSentAt = new Date();
    await user.save();
    await sendOtpEmail(user.email, user.name, code);
}

const publicUser = (u) => ({
    id: u._id,
    name: u.name,
    surname: u.surname,
    email: u.email,
    role: u.role,
    points: u.points
});

// ---------- SIGN UP (creates unverified account + emails code) ----------
exports.signupWithOtp = async (req, res) => {
    try {
        const { name, surname, password, role } = req.body;
        const email = clean(req.body.email);

        if (!name || !surname || !email || !password)
            return res.status(400).json({ message: 'Please provide all required fields' });

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ message: 'Enter a valid email address' });

        let user = await User.findOne({ email });

        if (user && user.emailVerified !== false)
            return res.status(400).json({ message: 'An account with this email already exists' });

        const hashed = await bcrypt.hash(password, 10);

        if (user) {
            Object.assign(user, { name, surname, password: hashed, role: role || 'student' });
        } else {
            user = new User({
                name, surname, email,
                password: hashed,
                role: role || 'student',
                emailVerified: false
            });
        }

        await issueOtp(user);
        res.status(201).json({ message: 'Verification code sent', email });
    } catch (err) {
        console.error('Signup OTP error:', err.message);
        res.status(500).json({ message: 'Could not send the verification email. Please try again.' });
    }
};

// ---------- RESEND CODE ----------
exports.resendOtp = async (req, res) => {
    try {
        const user = await User.findOne({ email: clean(req.body.email) }).select('+otpSentAt');

        if (!user || user.emailVerified !== false)
            return res.json({ message: 'If the account needs it, a code was sent.' });

        if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() < 30000)
            return res.status(429).json({ message: 'Please wait 30 seconds before requesting another code.' });

        await issueOtp(user);
        res.json({ message: 'A new code was sent' });
    } catch (err) {
        console.error('Resend OTP error:', err.message);
        res.status(500).json({ message: 'Could not send the email. Please try again.' });
    }
};

// ---------- VERIFY CODE ----------
exports.verifyOtp = async (req, res) => {
    try {
        const email = clean(req.body.email);
        const code = String(req.body.code || '');

        const user = await User.findOne({ email }).select('+otpHash +otpExpires +otpAttempts');

        if (!user || !user.otpHash || user.otpExpires < new Date())
            return res.status(400).json({ message: 'Code expired. Request a new one.' });

        if (user.otpAttempts >= 5)
            return res.status(429).json({ message: 'Too many attempts. Request a new code.' });

        user.otpAttempts += 1;

        const a = Buffer.from(hashOtp(email, code));
        const b = Buffer.from(user.otpHash);

        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            await user.save();
            return res.status(400).json({ message: `Incorrect code. ${5 - user.otpAttempts} attempts left.` });
        }

        user.emailVerified = true;
        user.otpHash = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ message: 'Email verified', token, user: publicUser(user) });
    } catch (err) {
        console.error('Verify OTP error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};