const Excel = require('exceljs');
const asyncHandler = require('../utils/async-handler');
const queryParams = require('../utils/query-params');
const { Op, QueryTypes } = require('sequelize');

// @ts-ignore
const { WorkingTime, UserMaster } = require('../models');

module.exports = asyncHandler(async (req, res, next) => {
    try {
        const { DepartmentID } = req.query;

        const workbook = new Excel.Workbook();

        const queries = queryParams(
            req.query,
            Op,
            ['Month', 'Year', 'Status', 'WorkDateNumber'],
            ['Month', 'Year', 'Status', 'WorkDateNumber', 'CreatedDate', 'UpdatedDate']
        );

        const allUser = await UserMaster.findAll({
            attributes: ['ID'],
            where: { DepartmentID: DepartmentID },
            raw: true,
        });
        let allUserWorkingTime = [];
        if (allUser) allUserWorkingTime = allUser.map((x) => x.ID);

        const allWorkingTIme = await WorkingTime.findAll({
            order: queries.order,
            include: [
                {
                    model: UserMaster,
                },
            ],
            where: {
                [Op.or]: [
                    { [Op.and]: [queries.searchOr, { UserMasterID: allUserWorkingTime }] },
                    { [Op.and]: [{ '$UserMaster.Account$': { [Op.like]: `%${req.query.keyword}%` } }, { UserMasterID: allUserWorkingTime }] },
                ],
            },
            distinct: true,
            // limit: queries.limit,
            // offset: queries.offset,
            raw: true,
        });
        // if (allRule.length !== 0) {
        //     allRule.forEach((element) => {
        //         if (element.Status === 1) element.Status = 'Active';
        //         else if (element.Status === 2) element.Status = 'Inactive';
        //     });
        // }

        // create sheet
        const projectList = workbook.addWorksheet('RuleDefinition_List');
        // create sheet header
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
        projectList.columns = [
            { header: 'Account', key: 'UserMaster.Account', width: 20 },
            { header: 'Month', key: 'Month', width: 10 },
            { header: 'Year', key: 'Year', width: 10 },
            { header: 'WorkDateNumber', key: 'WorkDateNumber', width: 20 },
        ];

        projectList.getRow(1).eachCell((cell) => {
            cell.style = headerStyle;
        });

        // fill in data for each sheet
        projectList.addRows(allWorkingTIme);
        const columnA = projectList.getColumn('A');
        columnA.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnB = projectList.getColumn('B');
        columnB.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'right' };
            }
        });

        const columnC = projectList.getColumn('C');
        columnC.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'right' };
            }
        });

        const columnD = projectList.getColumn('D');
        columnD.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'right' };
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'WokringTime-excel.xlsx');

        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (err) {
        console.log('error: ' + err);
    }
});
