const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        surname: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ['student', 'manager'],
            default: 'student'
        },

        // Email verification (existing users default to verified)
        emailVerified: { type: Boolean, default: true },
        otpHash: { type: String, select: false },
        otpExpires: { type: Date, select: false },
        otpAttempts: { type: Number, default: 0, select: false },
        otpSentAt: { type: Date, select: false },

        points: {
            type: Number,
            default: 10
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);