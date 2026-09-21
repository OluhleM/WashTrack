const express = require('express');

const FaultReport = require('../models/FaultReport');
const Machine = require('../models/Machine');
const Booking = require('../models/Booking');
const User = require('../models/User');
const protect = require('../middleware/auth');

const router = express.Router();


// =====================================
// STUDENT: REPORT A FAULT
// =====================================

router.post('/', protect, async (req, res) => {

    try {

        if (req.user.role !== 'student') {
            return res.status(403).json({
                message: 'Only students can report faults'
            });
        }

        const {
            machineId,
            description
        } = req.body;

        if (!machineId || !description) {
            return res.status(400).json({
                message: 'Machine and description are required'
            });
        }

        const machine = await Machine.findOne({
            machineId
        });

        if (!machine) {
            return res.status(404).json({
                message: 'Machine not found'
            });
        }

        const faultReport = await FaultReport.create({
            student: req.user.id,
            machine: machine._id,
            description,
            status: 'open'
        });
        // Cancel any active booking affected by the fault
        const affectedBooking = await Booking.findOne({
            machine: machine._id,
            status: 'active'
        });

        console.log(
            'Affected booking:',
            affectedBooking ? affectedBooking._id : 'NONE'
        );

        if (affectedBooking) {

            affectedBooking.status = 'cancelled';

            await affectedBooking.save();

            // Refund the point because the machine fault
            // was not caused by the student's cancellation.
            await User.findByIdAndUpdate(
                affectedBooking.user,
                {
                    $inc: {
                        points: 1
                    }
                }
            );
        }

        // Mark the machine as broken
        await Machine.findByIdAndUpdate(
            machine._id,
            {
                $set: {
                    status: 'broken',
                    bookedUntil: null
                }
            }
        );

        const populatedReport =
            await FaultReport.findById(
                faultReport._id
            )
                .populate('machine', 'machineId name room type');

        res.status(201).json({
            message: affectedBooking
                ? 'Fault reported successfully. The active booking was cancelled and the point was refunded.'
                : 'Fault reported successfully',
            report: populatedReport,
            bookingCancelled: !!affectedBooking
        });

    } catch (error) {

        console.error(
            'Fault report error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to submit fault report'
        });
    }
});


// =====================================
// STUDENT: VIEW MY FAULT REPORTS
// =====================================

router.get('/my', protect, async (req, res) => {

    try {

        const reports = await FaultReport.find({
            student: req.user.id
        })
            .populate(
                'machine',
                'machineId name room type'
            )
            .sort({
                createdAt: -1
            });

        res.json(reports);

    } catch (error) {

        console.error(
            'Get fault reports error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to retrieve fault reports'
        });
    }
});


module.exports = router;