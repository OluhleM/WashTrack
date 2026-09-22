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

        const activeMachines = machines.filter(
            machine => machine.active !== false
        );

        const inactiveMachines = machines.filter(
            machine => machine.active === false
        );

        const summary = {
            totalMachines: machines.length,

            activeMachines: activeMachines.length,

            inactiveMachines: inactiveMachines.length,

            available: activeMachines.filter(
                machine => machine.status === 'working'
            ).length,

            occupied: activeMachines.filter(
                machine => machine.status === 'occupied'
            ).length,

            broken: activeMachines.filter(
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
                active: -1,
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
// REGISTER NEW MACHINE
// =====================================

router.post('/machines', protect, managerOnly, async (req, res) => {
    try {

        const {
            machineId,
            name,
            room,
            type
        } = req.body;

        if (!machineId || !name || !room || !type) {
            return res.status(400).json({
                message: 'Machine ID, name, room and type are required'
            });
        }

        const cleanMachineId = machineId.trim();
        const cleanName = name.trim();
        const cleanRoom = room.trim();

        if (!['washer', 'dryer'].includes(type)) {
            return res.status(400).json({
                message: 'Machine type must be washer or dryer'
            });
        }

        if (!['Laundry Room A', 'Laundry Room B'].includes(cleanRoom)) {
            return res.status(400).json({
                message: 'Invalid laundry room'
            });
        }

        const existingMachine = await Machine.findOne({
            machineId: cleanMachineId
        });

        if (existingMachine) {
            return res.status(409).json({
                message: 'A machine with this Machine ID already exists'
            });
        }

        const machine = await Machine.create({
            machineId: cleanMachineId,
            name: cleanName,
            room: cleanRoom,
            type,
            status: 'working',
            bookedUntil: null,
            active: true
        });

        res.status(201).json({
            message: 'Machine registered successfully',
            machine
        });

    } catch (error) {

        console.error(
            'Register machine error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to register machine'
        });
    }
});


// =====================================
// REMOVE MACHINE FROM SERVICE
// =====================================

router.put(
    '/machines/:machineId/remove',
    protect,
    managerOnly,
    async (req, res) => {

        try {

            const machine = await Machine.findOne({
                machineId: req.params.machineId
            });

            if (!machine) {
                return res.status(404).json({
                    message: 'Machine not found'
                });
            }

            if (machine.active === false) {
                return res.status(400).json({
                    message: 'Machine is already out of service'
                });
            }

            // Do not allow removal while a student
            // currently has an active booking.
            const activeBooking = await Booking.findOne({
                machine: machine._id,
                status: 'active'
            });

            if (activeBooking) {
                return res.status(400).json({
                    message:
                        'This machine has an active booking and cannot be removed from service'
                });
            }

            machine.active = false;
            machine.bookedUntil = null;

            await machine.save();

            res.json({
                message: 'Machine removed from service',
                machine
            });

        } catch (error) {

            console.error(
                'Remove machine error:',
                error.message
            );

            res.status(500).json({
                message: 'Unable to remove machine'
            });
        }
    }
);


// =====================================
// RESTORE MACHINE
// =====================================

router.put(
    '/machines/:machineId/restore',
    protect,
    managerOnly,
    async (req, res) => {

        try {

            const machine = await Machine.findOne({
                machineId: req.params.machineId
            });

            if (!machine) {
                return res.status(404).json({
                    message: 'Machine not found'
                });
            }

            if (machine.active !== false) {
                return res.status(400).json({
                    message: 'Machine is already active'
                });
            }

            machine.active = true;
            machine.status = 'working';
            machine.bookedUntil = null;

            await machine.save();

            res.json({
                message: 'Machine restored successfully',
                machine
            });

        } catch (error) {

            console.error(
                'Restore machine error:',
                error.message
            );

            res.status(500).json({
                message: 'Unable to restore machine'
            });
        }
    }
);


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

            if (machine.active === false) {
                return res.status(400).json({
                    message: 'This machine is out of service'
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
            machine.bookedUntil = null;

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
                'machineId name room type status active'
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
                    returnDocument: 'after'
                }
            )
                .populate(
                    'machine',
                    'machineId name room type status active'
                );

            if (!report) {
                return res.status(404).json({
                    message: 'Fault report not found'
                });
            }

            // Only make the machine working again
            // if it has not been removed from service.
            if (report.machine.active !== false) {

                await Machine.findByIdAndUpdate(
                    report.machine._id,
                    {
                        $set: {
                            status: 'working',
                            bookedUntil: null
                        }
                    }
                );
            }

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
                'machineId name room type active'
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