const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
    {
        machineId: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true
        },

        room: {
            type: String,
            required: true
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
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Machine', machineSchema);