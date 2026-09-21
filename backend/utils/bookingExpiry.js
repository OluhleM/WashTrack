const Booking = require('../models/Booking');
const Machine = require('../models/Machine');

const expireBookings = async () => {
    try {
        const now = new Date();

        // Find active bookings whose 45-minute period has ended
        const expiredBookings = await Booking.find({
            status: 'active',
            endTime: { $lte: now }
        });

        for (const booking of expiredBookings) {

            // Mark the booking as completed
            booking.status = 'completed';
            await booking.save();

            // Make the machine available again
            await Machine.findByIdAndUpdate(
                booking.machine,
                {
                    $set: {
                        status: 'working',
                        bookedUntil: null
                    }
                }
            );
        }

        if (expiredBookings.length > 0) {
            console.log(
                `${expiredBookings.length} booking(s) expired.`
            );
        }

    } catch (error) {
        console.error(
            'Booking expiry error:',
            error.message
        );
    }
};

module.exports = expireBookings;