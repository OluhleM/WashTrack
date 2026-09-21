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