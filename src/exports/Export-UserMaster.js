const Excel = require('exceljs');
const asyncHandler = require('../utils/async-handler');
const { Op } = require('sequelize');
const queryParams = require('../utils/query-params');
// @ts-ignore
const { Project, Department, UserMaster } = require('../models');

module.exports = asyncHandler(async (req, res, next) => {
    try {
        const { DepartmentID } = req.query;

        const workbook = new Excel.Workbook();

        const queries = queryParams(
            req.query,
            Op,
            [
                'DisplayName',
                'Account',
                'Email',
                'NickName',
                'Skill',
                'Note',
                'ForeignLanguage',
                'PhoneNumber',
                'Supporter',
                'ManagedBy',
                'SeatCode',
                'MaritalStatus',
                'Certificate',
                'Group',
            ],
            [
                'ID',
                'DisplayName',
                'Account',
                'DepartmentID',

                'Group',
                'Email',
                'NickName',
                'JobTitle',
                'DOB',
                'SeatCode',
                'Location',
                'Supporter',
                'Gender',
                'MaritalStatus',
                'Certificate',
                'ManagedBy',
                'PhoneNumber',
                'ContractType',
                'RoleID',
                'DateJoinUnit',
                'UpdatedBy',
                'CreatedBy',
                'Status',
                'CreatedDate',
                'UpdatedDate',
            ]
        );

        const allUser = await UserMaster.findAll({
            order: queries.order,
            where: queries.searchOr,
            include: [
                {
                    model: Department,
                },
            ],
            distinct: true,
            // limit: queries.limit,
            // offset: queries.offset,
            raw: true,
        });
        if (allUser.length !== 0) {
            allUser.forEach((element) => {
                if (element.RoleID === 2) element.RoleID = 'Head';
                else if (element.RoleID === 3) element.RoleID = 'PM';
                else element.RoleID = 'Member';

                if (element.Status === 1) element.Status = 'Active';
                else if (element.Status === 2) element.Status = 'Inactive';
                else if (element.Status === 3) element.Status = 'Away';
                else element.Status = 'Not Ranking';

                if (element.ContractType === 1) element.ContractType = 'NVCT';
                else if (element.ContractType === 2) element.ContractType = 'SVTT';
            });
        }
        // create sheet
        const memberList = workbook.addWorksheet('Member_List');
        //
        const headerStyle = {
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'ff3271a8' }, // Change to desired color code
            },
            font: {
                name: 'Times New Roman',
                size: 11,
                bold: true,
                color: { argb: 'FFFFFF' },
                // Set any other font properties as needed
            },

            border: {
                bottom: { style: 'thin' },
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            },
            alignment: {
                horizontal: 'center',
            },
        };
        // create sheet header

        memberList.columns = [
            { header: 'Full Name', key: 'DisplayName', width: 25 },
            { header: 'Department', key: 'Department.Code', width: 10 },
            { header: 'Group', key: 'Group', width: 9 },
            { header: 'Account', key: 'Account', width: 13 },
            { header: 'Email', key: 'Email', width: 25 },
            { header: 'EmployeeID', key: 'EmployeeID', width: 12 },
            { header: 'Skill', key: 'Skill', width: 25 },
            { header: 'Date of birth', key: 'DOB', width: 14 },
            { header: 'Phone Number', key: 'PhoneNumber', width: 16 },
            { header: 'Contract_Type', key: 'ContractType', width: 16 },
            { header: 'Note', key: 'Note', width: 15 },
            { header: 'JobTitle', key: 'JobTitle', width: 9 },
            { header: 'DateJoinUnit', key: 'DateJoinUnit', width: 15 },
            { header: 'Role', key: 'RoleID', width: 9 },
            { header: 'TotalCoin', key: 'TotalCoin', width: 9 },
            { header: 'Status', key: 'Status', width: 9 },
        ];

        memberList.getRow(1).eachCell((cell) => {
            cell.style = headerStyle;
        });
        // fill in data for each sheet
        memberList.addRows(allUser);

        const columnA = memberList.getColumn('A');
        columnA.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnB = memberList.getColumn('B');
        columnB.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        const columnC = memberList.getColumn('C');
        columnC.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        const columnD = memberList.getColumn('D');
        columnD.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnE = memberList.getColumn('E');
        columnE.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnF = memberList.getColumn('F');
        columnF.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        const columnG = memberList.getColumn('G');
        columnG.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnH = memberList.getColumn('H');
        columnH.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnI = memberList.getColumn('I');
        columnI.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnJ = memberList.getColumn('J');
        columnJ.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        const columnK = memberList.getColumn('K');
        columnK.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });
        const columnL = memberList.getColumn('L');
        columnL.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });
        const columnM = memberList.getColumn('M');
        columnM.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });
        const columnN = memberList.getColumn('N');
        columnN.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });
        const columnO = memberList.getColumn('O');
        columnO.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });
        const columnP = memberList.getColumn('P');
        columnP.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= memberList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        // data validate project
        // @ts-ignore

        // month
        // @ts-ignore

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'Usermaster-excel.xlsx');

        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (err) {
        console.log('error: ' + err);
    }
});
