const { sequelize } = require('../config/dbConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("request: ", req.body);

        if (!username || !password) {
            return res.status(400).json({ 
                status: false,
                message: 'Username and password are required' 
            });
        }

        // First, get the user by email
        const users = await sequelize.query(
            'SELECT id, name, email, phone, password, photo, status FROM users WHERE email = :email',
            {
                replacements: { email: username },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (!users || users.length === 0) {
            return res.status(401).json({ 
                status: false,
                message: 'Invalid credentials' 
            });
        }

        const user = users[0];

        // Compare the provided password with the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                status: false,
                message: 'Invalid credentials' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, phone: user.phone },
            process.env.TOKEN_KEY,
            { expiresIn: '7d' }
        );

        // Remove password from user object
        delete user.password;

        res.status(200).json({
            status: true,
            message: 'Login successful',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            status: false,
            message: 'An error occurred during login' 
        });
    }
};


exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                status: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUsers = await sequelize.query(
            'SELECT id FROM users WHERE email = :email',
            {
                replacements: { email },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({
                status: false,
                message: 'User with this email already exists'
            });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user
        const result = await sequelize.query(
            `INSERT INTO users (name, email, phone, password, status, created_at, updated_at) 
             VALUES (:name, :email, :phone, :password, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
             RETURNING id`,
            {
                replacements: {
                    name,
                    email,
                    phone: phone || null,
                    password: hashedPassword
                },
                type: sequelize.QueryTypes.INSERT,
            }
        );

        const userId = result[0][0].id;

        // Generate JWT token
        const token = jwt.sign(
            { userId, email, phone: phone || null },
            process.env.TOKEN_KEY,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            status: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: userId,
                    name,
                    email,
                    phone: phone || null,
                    status: true
                },
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: false,
            message: 'An error occurred during registration'
        });
    }
};

exports.registerWithProcedure = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                status: false,
                message: 'Name, email, and password are required'
            });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Call the stored procedure
        const result = await sequelize.query(
            'SELECT * FROM user_create(:name, :email, :phone, :password)',
            {
                replacements: {
                    name,
                    email,
                    phone: phone || null,
                    password: hashedPassword
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (!result || result.length === 0) {
            return res.status(500).json({
                status: false,
                message: 'Failed to create user'
            });
        }

        const userId = result[0].user_id;

        // If user creation failed due to existing email
        if (userId === -1) {
            return res.status(400).json({
                status: false,
                message: 'User with this email already exists'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId, email, phone: phone || null },
            process.env.TOKEN_KEY,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            status: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: userId,
                    name,
                    email,
                    phone: phone || null,
                    status: true
                },
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: false,
            message: 'An error occurred during registration'
        });
    }
};