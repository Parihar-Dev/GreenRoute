const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vehicle = sequelize.define('Vehicle', {
    make: {
        type: DataTypes.STRING,
        allowNull: false
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false
    },
    batteryCapacity: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
    },
    efficiency: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId','make','model']
        }
    ]
});

module.exports = Vehicle;