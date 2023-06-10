'use strict';
module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class Subject extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        // static associate({ UserMaster, RuleDefinition }) {
        //     // define association here
        //     // this.belongsTo(RuleDefinition, {
        //     //     foreignKey: 'RuleDefinitionID',
        //     // });

        //     // this.belongsTo(UserMaster, {
        //     //     foreignKey: 'UserMasterID',
        //     // });
        // }
    }
    Subject.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            Name: DataTypes.STRING,
            Code: DataTypes.STRING,
            NumberOfSlot: DataTypes.INTEGER,
            CreatedBy: DataTypes.STRING,
            UpdatedBy: DataTypes.STRING,
            Status: {
                defaultValue: 1,
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            modelName: 'Subject',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
        }
    );
    return Subject;
};
