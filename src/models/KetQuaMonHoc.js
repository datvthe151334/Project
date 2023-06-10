'use strict';

module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class KetQua_MonHoc extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        // static associate({
        //     UserMaster,
        //     Project,
        //     RuleDefinition,
        //     Badge,
        //     Campaign,
        //     Point,
      
        // }) {
        //     // define association here
        //     this.hasMany(Product, {
        //         foreignKey: 'KetQua_MonHocID',
        //     });

        //     this.hasMany(UserMaster, {
        //         foreignKey: 'KetQua_MonHocID',
        //     });

        //     // this.belongsTo(UserMaster, {
        //     // as: 'Head',
        //     // foreignKey: 'DefaultHead',
        //     // targetKey: 'ID',
        //     // });

        //     this.hasMany(Project, {
        //         foreignKey: 'KetQua_MonHocID',
        //     });

        //     this.hasMany(Group, {
        //         foreignKey: 'KetQua_MonHocID',
        //     });

           
        // }
    }
    KetQua_MonHoc.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            StudentID: DataTypes.STRING,
            ClassID: DataTypes.STRING,
            YearID: DataTypes.STRING,
            SubjectID:DataTypes.STRING,
            SemeserID: DataTypes.STRING,
            DiemMieng: DataTypes.STRING,
            Diem15Phut: DataTypes.STRING,
            Diem45Phut: DataTypes.STRING,
            DiemThi: DataTypes.STRING,
            DiemTBHK: DataTypes.STRING,

        },
        {
            sequelize,
            modelName: 'KetQua_MonHoc',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
            
        }
    );
    return KetQua_MonHoc;
};
