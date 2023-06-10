'use strict';
module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class Role extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({ UserMaster}) {
          
        }
    }
    Role.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
           Role:DataTypes.STRING,
            CreatedBy: DataTypes.STRING,
            UpdatedBy: DataTypes.STRING,
            Status: {
                defaultValue: 1,
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            modelName: 'Role',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
        }
    );
    return Role;
};
