'use strict';

module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class Grade extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({ Class }) {
            // define association here
            this.hasMany(Class, {
                foreignKey: 'ClassID',
            });
        }
    }
    Grade.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            Name: DataTypes.STRING,
            Code: DataTypes.STRING,
           
        },
        {
            sequelize,
            modelName: 'Grade',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
        }
    );
    return Grade;
};
