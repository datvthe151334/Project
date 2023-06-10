'use strict';
module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class Teacher extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        // static associate({ Badge }) {
        //     // define association here
        //     this.belongsTo(Badge, {
        //         foreignKey: 'BadgeID',
        //     });
        // }
    }
    Teacher.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            Code: DataTypes.STRING,
            Name: DataTypes.STRING,
            PhoneNumber: DataTypes.STRING,
            Address: DataTypes.STRING,
            Email: DataTypes.STRING,
            Gender: DataTypes.INTEGER,
            DOB: DataTypes.STRING,
            Status: {
                defaultValue: 1,
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            modelName: 'Teacher',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
        }
    );
    return Teacher;
};
