const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
    {
        machineId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        room: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: ['washer', 'dryer'],
            required: true
        },

        status: {
            type: String,
            enum: ['working', 'occupied', 'broken'],
            default: 'working'
        },

        bookedUntil: {
            type: Date,
            default: null
        },

        // true = currently part of the laundry inventory
        // false = removed from service
        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Machine', machineSchema);