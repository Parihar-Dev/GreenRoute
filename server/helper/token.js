const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.hashPassword = async(password) => {
    return await bcrypt.hash(password, 10);
};

exports.comparePassword = async(password, hash) => {
    return await bcrypt.compare(password, hash);
};

exports.generateToken = (user) => {
    return jwt.sign({id: user.id, email: user.email}, process.env.JWT_SECRET, {expiresIn: '3d'});
}