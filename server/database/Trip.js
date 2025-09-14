const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Trip = sequelize.define('Trip', {
    startLatitude: {
        type: DataTypes.DECIMAL(9,6),
        allowNull: false
    },
    startLongitude: {
        type: DataTypes.DECIMAL(9,6),
        allowNull: false
    },
    endLatitude: {
        type: DataTypes.DECIMAL(9,6),
        allowNull: false
    },
    endLongitude: {
        type: DataTypes.DECIMAL(9,6),
        allowNull: false
    },
    predictedConsumption: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: true
    }
}, {
    timestamps: true
})

module.exports = Trip