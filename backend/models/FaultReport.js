const mongoose = require('mongoose');

const faultReportSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        machine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Machine',
            required: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: ['open', 'resolved'],
            default: 'open'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    'FaultReport',
    faultReportSchema
);