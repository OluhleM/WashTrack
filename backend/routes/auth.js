const express = require('express');

const {
    signup,
    login
} = require('../controllers/authController');

const User = require('../models/User');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.get('/me', protect, async (req, res) => {

    try {

        const user = await User.findById(req.user.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json(user);

    } catch (error) {

        console.error(
            'Get current user error:',
            error.message
        );

        res.status(500).json({
            message: 'Unable to retrieve user'
        });
    }
});

module.exports = router;