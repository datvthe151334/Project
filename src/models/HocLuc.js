'use strict';
module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class HocLuc extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({ Student }) {
            // define association here
            this.belongsTo(Student, {
                foreignKey: 'StudentID',
            });

            // this.belongsTo(UserMaster, {
            //     foreignKey: 'MemberID',
            // });
        }
    }
    HocLuc.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            Name: DataTypes.STRING,
            MaxPoint: DataTypes.FLOAT,
            MinPoint: DataTypes.FLOAT,
            Status: {
                defaultValue: 1,
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            modelName: 'HocLuc',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
           
        }
    );
    return HocLuc;
};
