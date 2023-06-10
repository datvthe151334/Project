'use strict';
module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class Point extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({ Student,Subject,Semester,Year,Class,TypePoint }) {
            // define association here
            this.belongsTo(Student, {
                foreignKey: 'StudentID',
            });
            this.belongsTo(Subject, {
                foreignKey: 'SubjectID',
            });
            this.belongsTo(Semester, {
                foreignKey: 'SemesterID',
            });
            this.belongsTo(Year, {
                foreignKey: 'YearID',
            });
            this.belongsTo(Class, {
                foreignKey: 'ClassID',
            });
        }
    }
    Point.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            StudentID: DataTypes.INTEGER,
            SubjectID: DataTypes.INTEGER,
            SemesterID: DataTypes.INTEGER,
            YearID: DataTypes.INTEGER,
            ClassID:DataTypes.INTEGER,
            TypePointID: DataTypes.INTEGER,
            Point:DataTypes.FLOAT,
            Status: {
                defaultValue: 1,
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            modelName: 'Point',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
        }
    );
    return Point;
};
