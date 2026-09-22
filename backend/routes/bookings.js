const express = require('express');

const Booking = require('../models/Booking');
const Machine = require('../models/Machine');
const User = require('../models/User');
const protect = require('../middleware/auth');
const expireBookings = require('../utils/bookingExpiry');

const router = express.Router();


// ==================== CREATE BOOKING ====================

router.post('/', protect, async (req, res) => {
    try {
        const { machineId } = req.body;

        // Only students can make bookings
        if (req.user.role !== 'student') {
            return res.status(403).json({
                message: 'Only students can book machines'
            });
        }

        // Check machine ID
        if (!machineId) {
            return res.status(400).json({
                message: 'Machine ID is required'
            });
        }

        // Booking lasts 45 minutes
        const startTime = new Date();

        const endTime = new Date(
            startTime.getTime() + 45 * 60 * 1000
        );


        // Reserve the machine
        const machine = await Machine.findOneAndUpdate(
            {
                machineId,
                status: 'working'
            },
            {
                $set: {
                    status: 'occupied',
                    bookedUntil: endTime
                }
            },
            {
                returnDocument: 'after'
            }
        );

        if (!machine) {
            return res.status(400).json({
                message: 'Machine is unavailable'
            });
        }


        // Deduct 1 point from the student
        const user = await User.findOneAndUpdate(
            {
                _id: req.user.id,
                points: { $gte: 1 }
            },
            {
                $inc: {
                    points: -1
                }
            },
            {
                returnDocument: 'after'
            }
        );


        // Student does not have enough points
        if (!user) {

            // Make the machine available again
            await Machine.findByIdAndUpdate(
                machine._id,
                {
                    $set: {
                        status: 'working',
                        bookedUntil: null
                    }
                }
            );

            return res.status(400).json({
                message: 'You do not have enough points'
            });
        }


        // Save the booking
        const booking = await Booking.create({
            user: user._id,
            machine: machine._id,
            startTime,
            endTime,
            status: 'active'
        });


        res.status(201).json({
            message: 'Machine booked successfully',
            booking: {
                id: booking._id,
                machine: machine.machineId,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status
            },
            pointsRemaining: user.points
        });

    } catch (error) {

        console.error('Booking error:', error);

        res.status(500).json({
            message: 'Unable to create booking'
        });
    }
});

// ==================== GET MY BOOKINGS ====================

router.get('/my', protect, async (req, res) => {
    try {

        await expireBookings();

        const bookings = await Booking.find({
            user: req.user.id
        })
            .populate('machine')
            .sort({ startTime: -1 });

        res.json(bookings);

    } catch (error) {
        console.error('Get bookings error:', error);

        res.status(500).json({
            message: 'Unable to retrieve bookings'
        });
    }
});

router.put('/:id/cancel', protect, async (req, res) => {

    try {

        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }

        if (booking.status !== 'active') {
            return res.status(400).json({
                message: 'Only active bookings can be cancelled'
            });
        }

        booking.status = 'cancelled';
        await booking.save();

        await Machine.findByIdAndUpdate(
            booking.machine,
            {
                $set: {
                    status: 'working',
                    bookedUntil: null
                }
            }
        );

        res.json({
            message: 'Booking cancelled successfully',
            booking
        });

    } catch (error) {

        console.error(
            'Cancel booking error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to cancel booking'
        });
    }
});


module.exports = router;