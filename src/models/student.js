'use strict';

module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');

    class Student extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        // static associate({ UserMaster, Department }) {
        //     // define association here

        //     this.belongsTo(Department, {
        //         foreignKey: 'DepartmentID', // targetKey: 'ID',
        //     });
        // }
    }

    Student.init(
        {
            ID: {
                primaryKey: true,

                autoIncrement: true,

                type: DataTypes.INTEGER,
            },
            Name: DataTypes.STRING,
            Code: DataTypes.STRING,
            Gender: DataTypes.STRING,
            DOB: DataTypes.STRING,
            Address: DataTypes.STRING,
            PhoneNumber: DataTypes.STRING, //<,>,>=,<=,max,min,=
            CreatedBy: DataTypes.STRING,
            UpdatedBy: DataTypes.STRING,
            Status: {
                defaultValue: 1,

                type: DataTypes.INTEGER,
            },
        },

        {
            sequelize,

            modelName: 'Student',

            freezeTableName: true,

            initialAutoIncrement: '1000',

            createdAt: 'CreatedDate',

            updatedAt: 'UpdatedDate',
        }
    );

    return Student;
};
