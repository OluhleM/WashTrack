require('dotenv').config();

const mongoose = require('mongoose');
const Machine = require('./models/Machine');

const machines = [
    {
        machineId: 'W1',
        name: 'Washer 1',
        room: 'Laundry Room A',
        type: 'washer'
    },
    {
        machineId: 'W2',
        name: 'Washer 2',
        room: 'Laundry Room A',
        type: 'washer'
    },
    {
        machineId: 'W3',
        name: 'Washer 3',
        room: 'Laundry Room A',
        type: 'washer'
    },
    {
        machineId: 'W4',
        name: 'Washer 4',
        room: 'Laundry Room A',
        type: 'washer'
    },
    {
        machineId: 'W5',
        name: 'Washer 5',
        room: 'Laundry Room B',
        type: 'washer'
    },
    {
        machineId: 'W6',
        name: 'Washer 6',
        room: 'Laundry Room B',
        type: 'washer'
    },
    {
        machineId: 'W7',
        name: 'Washer 7',
        room: 'Laundry Room B',
        type: 'washer'
    },
    {
        machineId: 'W8',
        name: 'Washer 8',
        room: 'Laundry Room B',
        type: 'washer'
    },

    {
        machineId: 'D1',
        name: 'Dryer 1',
        room: 'Laundry Room A',
        type: 'dryer'
    },
    {
        machineId: 'D2',
        name: 'Dryer 2',
        room: 'Laundry Room A',
        type: 'dryer'
    },
    {
        machineId: 'D3',
        name: 'Dryer 3',
        room: 'Laundry Room A',
        type: 'dryer'
    },
    {
        machineId: 'D4',
        name: 'Dryer 4',
        room: 'Laundry Room B',
        type: 'dryer'
    },
    {
        machineId: 'D5',
        name: 'Dryer 5',
        room: 'Laundry Room B',
        type: 'dryer'
    },
    {
        machineId: 'D6',
        name: 'Dryer 6',
        room: 'Laundry Room B',
        type: 'dryer'
    }
];

const seedMachines = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB connected');

        const existingMachines = await Machine.countDocuments();

        if (existingMachines > 0) {
            console.log('Machines already exist. Nothing to seed.');
            process.exit(0);
        }

        await Machine.insertMany(machines);

        console.log('14 machines added successfully.');

        process.exit(0);

    } catch (error) {
        console.error('Error seeding machines:', error.message);
        process.exit(1);
    }
};

seedMachines();