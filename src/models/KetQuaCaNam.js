'use strict';

module.exports = (sequelize) => {
    const { Model, DataTypes } = require('sequelize');
    class KetQua_CaNam extends Model {
        // /**
        //  * Helper method for defining associations.
        //  * This method is not a part of Sequelize lifecycle.
        //  * The `models/index` file will call this method automatically.
        //  */
        static associate({
            Student,
            Class,
            Year,
            HocLuc,
            HanhKiem,
            KetQua_MonHoc
        }) {
            // define association here
            this.hasMany(Student, {
                foreignKey: 'KetQua_CaNamID',
            });

            this.hasMany(Year, {
                foreignKey: 'YearID',
            });

            this.hasMany(Class, {
                foreignKey: 'ClassID',
            });

            this.hasMany(HocLuc, {
                foreignKey: 'HocLucID',
            });
            
            this.hasMany(HanhKiem, {
                foreignKey: 'HanhKiemmID',
            });

            this.hasMany(KetQua_MonHoc, {
                foreignKey: 'KetQua_MonHocID',
            });

           
        }
    }
    KetQua_CaNam.init(
        {
            ID: {
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            StudentID: DataTypes.STRING,
            ClassID: DataTypes.STRING,
            YearID: DataTypes.STRING,
            HocLucID:DataTypes.STRING,
            HanhKiemID: DataTypes.STRING,
            KetQua_MonHocID: DataTypes.STRING,
            Diem15Phut: DataTypes.FLOAT,
            DiemTBHK1: DataTypes.FLOAT,
            DiemTBHK2: DataTypes.FLOAT,
        },
        {
            sequelize,
            modelName: 'KetQua_CaNam',
            freezeTableName: true,
            initialAutoIncrement: '1000',
            createdAt: 'CreatedDate',
            updatedAt: 'UpdatedDate',
           
        }
    );
    return KetQua_CaNam;
};
