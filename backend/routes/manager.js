const express = require('express');

const Machine = require('../models/Machine');
const Booking = require('../models/Booking');
const FaultReport = require('../models/FaultReport');
const protect = require('../middleware/auth');
const expireBookings = require('../utils/bookingExpiry');

const router = express.Router();


// =====================================
// MANAGER ACCESS CHECK
// =====================================

const managerOnly = (req, res, next) => {

    if (req.user.role !== 'manager') {
        return res.status(403).json({
            message: 'Manager access required'
        });
    }

    next();
};


// =====================================
// DASHBOARD SUMMARY
// =====================================

router.get('/summary', protect, managerOnly, async (req, res) => {
    try {

        await expireBookings();

        const machines = await Machine.find();

        const openFaults = await FaultReport.countDocuments({
            status: 'open'
        });

        const activeBookings = await Booking.countDocuments({
            status: 'active'
        });

        const summary = {
            totalMachines: machines.length,

            available: machines.filter(
                machine => machine.status === 'working'
            ).length,

            occupied: machines.filter(
                machine => machine.status === 'occupied'
            ).length,

            broken: machines.filter(
                machine => machine.status === 'broken'
            ).length,

            openFaults,

            activeBookings
        };

        res.json(summary);

    } catch (error) {

        console.error(
            'Manager summary error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to retrieve dashboard summary'
        });
    }
});


// =====================================
// VIEW ALL MACHINES
// =====================================

router.get('/machines', protect, managerOnly, async (req, res) => {
    try {

        await expireBookings();

        const machines = await Machine.find()
            .sort({
                room: 1,
                type: 1,
                machineId: 1
            });

        res.json(machines);

    } catch (error) {

        console.error(
            'Manager machines error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to retrieve machines'
        });
    }
});


// =====================================
// UPDATE MACHINE STATUS
// =====================================

router.put(
    '/machines/:machineId/status',
    protect,
    managerOnly,
    async (req, res) => {

        try {

            const { status } = req.body;

            if (!['working', 'broken'].includes(status)) {
                return res.status(400).json({
                    message: 'Invalid machine status'
                });
            }

            const machine = await Machine.findOne({
                machineId: req.params.machineId
            });

            if (!machine) {
                return res.status(404).json({
                    message: 'Machine not found'
                });
            }

            // A machine with an open fault report
            // cannot be manually marked as working.
            if (status === 'working') {

                const openFault = await FaultReport.findOne({
                    machine: machine._id,
                    status: 'open'
                });

                if (openFault) {
                    return res.status(400).json({
                        message:
                            'This machine has an open fault report. Resolve the fault report first.'
                    });
                }
            }

            machine.status = status;

            if (status === 'broken') {
                machine.bookedUntil = null;
            }

            if (status === 'working') {
                machine.bookedUntil = null;
            }

            await machine.save();

            res.json({
                message: 'Machine status updated',
                machine
            });

        } catch (error) {

            console.error(
                'Update machine error:',
                error.message
            );

            res.status(500).json({
                message: 'Unable to update machine'
            });
        }
    }
);


// =====================================
// VIEW ALL FAULT REPORTS
// =====================================

router.get('/fault-reports', protect, managerOnly, async (req, res) => {

    try {

        const reports = await FaultReport.find()
            .populate(
                'student',
                'name surname email'
            )
            .populate(
                'machine',
                'machineId name room type status'
            )
            .sort({
                createdAt: -1
            });

        res.json(reports);

    } catch (error) {

        console.error(
            'Manager fault reports error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to retrieve fault reports'
        });
    }
});


// =====================================
// RESOLVE FAULT REPORT
// =====================================

router.put(
    '/fault-reports/:id/resolve',
    protect,
    managerOnly,
    async (req, res) => {

        try {

            const report = await FaultReport.findByIdAndUpdate(
                req.params.id,
                {
                    $set: {
                        status: 'resolved'
                    }
                },
                {
                    new: true
                }
            )
                .populate(
                    'machine',
                    'machineId name room type status'
                );

            if (!report) {
                return res.status(404).json({
                    message: 'Fault report not found'
                });
            }

            // Mark machine as working again
            await Machine.findByIdAndUpdate(
                report.machine._id,
                {
                    $set: {
                        status: 'working',
                        bookedUntil: null
                    }
                }
            );

            res.json({
                message: 'Fault resolved successfully',
                report
            });

        } catch (error) {

            console.error(
                'Resolve fault error:',
                error.message
            );

            res.status(500).json({
                message: 'Unable to resolve fault'
            });
        }
    }
);


// =====================================
// VIEW ALL BOOKINGS
// =====================================

router.get('/bookings', protect, managerOnly, async (req, res) => {
    try {

        await expireBookings();

        const bookings = await Booking.find()
            .populate(
                'user',
                'name surname email'
            )
            .populate(
                'machine',
                'machineId name room type'
            )
            .sort({
                startTime: -1
            });

        res.json(bookings);

    } catch (error) {

        console.error(
            'Manager bookings error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to retrieve bookings'
        });
    }
});


module.exports = router;