'use strict';
module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({ Role }) {
            // define association here
            this.belongsTo( Role, {
                foreignKey: 'RoleID',
            });

        }
    }
    User.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            RoleID: DataTypes.INTEGER,
            Account: DataTypes.TEXT,
            Password: DataTypes.TEXT,
            Status: {
                defaultValue: 1,
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            modelName: 'User',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
        }
    );
    return User;
};
