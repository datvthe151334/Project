'use strict';

module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class Class extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({
            Teacher,KetQuaMonHoc,Grade}) 
            {
            // define association here
            this.belongsTo(Teacher, {
                foreignKey: 'TeacherID',
            });
            this.belongsTo(Grade, {
                foreignKey: 'GradeID',
            });
        }
    }
    Class.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            Code: DataTypes.STRING,
            GradeID: DataTypes.INTEGER,
            Name: DataTypes.STRING,
            YearCode:DataTypes.STRING,
            TeacherID: DataTypes.INTEGER,
            NumberOfStudent: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: 'Class',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
            
        }
    );
    return Class;
};
