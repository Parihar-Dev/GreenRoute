const jwt = require('jsonwebtoken');
const { sendResponse } = require('./error-handler');

const auth = (req, res ,next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return sendResponse(res, 401, {
        error: 'Authentication failed'
    });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return sendResponse(res, 401, {
            error: 'Authentication Failed'
        });
    }
}

module.exports = auth;