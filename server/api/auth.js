const { User } = require('../database/index');
const { hashPassword, comparePassword, generateToken } = require('../helper/token');
const { asyncHandler, createError, sendResponse } = require('../auth/error-handler');

exports.register = asyncHandler(async(req, res) => {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ where: {email} });
    if (exists) {
        throw createError(409, 'User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
        name,
        email,
        password: hashedPassword
    });

    const { password: _, ...userData } = user.toJSON();
    sendResponse(res, 201, {
        success: true,
        message: 'User registered successfully',
        user: userData,
    });
});

exports.login = asyncHandler(async(req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: {email} });
    if (!user) {
        throw createError(401, 'Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw createError(401, 'Invalid email or password');
    }

    const token = generateToken(user);
    const { password: _, ...userData } = user.toJSON();
    sendResponse(res, 200, {
        success: true,
        message: 'Login successfull',
        user: userData,
        token
    });
});