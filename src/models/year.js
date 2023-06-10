'use strict';
module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class Year extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({ Campaign, UserMaster, UserYear }) {
            // define association here
            // this.belongsTo(Campaign, {
            //     foreignKey: 'CampaignID',
            // });

            // this.belongsToMany(UserMaster, {
            //     foreignKey: 'YearID',
            //     through: UserYear,
            // });
        }
    }
    Year.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            Code: DataTypes.TEXT,
            Status: {
                defaultValue: 1,
                type: DataTypes.INTEGER,
            }
        },
        {
            sequelize,
            modelName: 'Year',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
        }
    );
    return Year;
};
