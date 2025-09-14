const User = require('./User');
const Vehicle = require('./Vehicle');
const Trip = require('./Trip');

User.hasMany(Vehicle, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
});
Vehicle.belongsTo(User, {
    foreignKey: 'userId'
});

User.hasMany(Trip, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
});
Trip.belongsTo(User, {
    foreignKey: 'userId'
});

module.exports = {
    User,
    Vehicle,
    Trip
};