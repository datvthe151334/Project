'use strict';
module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class TypePoint extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        // static associate({ UserMaster, RuleDefinition, Project, Department, Pic }) {
        //     // define association here
        //     this.belongsTo(UserMaster, {
        //         foreignKey: 'UserMasterID',
        //     });

        //     this.belongsTo(RuleDefinition, {
        //         foreignKey: 'RuleDefinitionID',
        //     });

        //     this.belongsTo(Project, {
        //         foreignKey: 'ProjectID',
        //     });

        //     this.belongsTo(Department, {
        //         foreignKey: 'DepartmentID',
        //     });

        //     this.hasMany(Pic, {
        //         foreignKey: 'RuleDefinitionID',
        //     });
        // }
    }
    TypePoint.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            Type: DataTypes.INTEGER,
            Note: DataTypes.TEXT,
            Weight: DataTypes.INTEGER,
            Name: DataTypes.STRING,
            CreatedBy: DataTypes.STRING,
            UpdatedBy: DataTypes.STRING,
            Status: {
                defaultValue: 1,
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            modelName: 'TypePoint',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
        }
    );
    return TypePoint;
};
