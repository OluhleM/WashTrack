const express = require('express');

const Machine = require('../models/Machine');
const expireBookings = require('../utils/bookingExpiry');

const router = express.Router();


// ==================== GET MACHINES ====================

router.get('/', async (req, res) => {
    try {

        // Release any expired bookings first
        await expireBookings();

        const machines = await Machine.find().sort({
            room: 1,
            type: 1,
            machineId: 1
        });

        res.json(machines);

    } catch (error) {

        console.error(
            'Get machines error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to retrieve machines'
        });
    }
});


module.exports = router;