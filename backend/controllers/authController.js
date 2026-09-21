const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// ==================== SIGN UP ====================

const signup = async (req, res) => {
    try {
        const { name, surname, email, password, role } = req.body;

        // Check required fields
        if (!name || !surname || !email || !password) {
            return res.status(400).json({
                message: 'Please provide all required fields'
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'An account with this email already exists'
            });
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            surname,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'student'
        });

        res.status(201).json({
            message: 'Account created successfully',
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role,
                points: user.points
            }
        });

    } catch (error) {
        console.error('Signup error:', error);

        res.status(500).json({
            message: 'Server error'
        });
    }
};


// ==================== LOGIN ====================

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role,
                points: user.points
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            message: 'Server error'
        });
    }
};


module.exports = {
    signup,
    login
};