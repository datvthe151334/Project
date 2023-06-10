'use strict';

module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class Semester extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({ }) {
          

            // this.belongsTo(UserMaster, {
            //     foreignKey: 'UserMasterID',
            // });
        }
    }
    Semester.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            Name: DataTypes.STRING,
            Weight: DataTypes.INTEGER,
            CreatedBy: DataTypes.STRING,
            UpdatedBy: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: 'Semester',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
        }
    );
    return Semester;
};
