const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const machineRoutes = require('./routes/machines');
const bookingRoutes = require('./routes/bookings');
const faultReportRoutes = require('./routes/faultReports');
const managerRoutes = require('./routes/manager');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/fault-reports', faultReportRoutes);
app.use('/api/manager', managerRoutes);


app.get('/', (req, res) => {
    res.json({
        message: 'WashTrack API is running'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`WashTrack server running on http://localhost:${PORT}`);
});