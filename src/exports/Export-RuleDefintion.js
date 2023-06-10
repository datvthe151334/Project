const Excel = require('exceljs');
const asyncHandler = require('../utils/async-handler');
const queryParams = require('../utils/query-params');
const { Op, QueryTypes } = require('sequelize');

// @ts-ignore
const { RuleDefinition } = require('../models');

module.exports = asyncHandler(async (req, res, next) => {
    try {
        const { DepartmentID } = req.query;

        const workbook = new Excel.Workbook();

        const queries = queryParams(
            req.query,
            Op,
            ['Name', 'Note', 'RuleType', 'Category'],
            ['Name', 'DepartmentID', 'RuleType', 'Category', 'UpdatedBy', 'CreatedBy', 'Status', 'CreatedDate', 'UpdatedDate']
        );

        const allRule = await RuleDefinition.findAll({
            order: queries.order,
            where: {
                [Op.and]: [queries.searchOr, { DepartmentID: DepartmentID }],
            },

            distinct: true,
            // limit: queries.limit,
            // offset: queries.offset,
            raw: true,
        });

        if (allRule.length !== 0) {
            allRule.forEach((element) => {
                if (element.Status === 1) element.Status = 'Active';
                else if (element.Status === 2) element.Status = 'Inactive';
            });
        }

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
            { header: 'Rule Type', key: 'RuleType', width: 10 },
            { header: 'Rule Name', key: 'Name', width: 73 },
            { header: 'Category', key: 'Category', width: 11 },
            { header: 'Point', key: 'PointNumber', width: 8 },
            { header: 'Notes', key: 'Note', width: 20 },
            { header: 'Status', key: 'Status', width: 8 },
        ];

        projectList.getRow(1).eachCell((cell) => {
            cell.style = headerStyle;
        });

        // fill in data for each sheet
        projectList.addRows(allRule);
        const columnA = projectList.getColumn('A');
        columnA.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnB = projectList.getColumn('B');
        columnB.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnC = projectList.getColumn('C');
        columnC.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        const columnD = projectList.getColumn('D');
        columnD.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'right' };
            }
        });

        const columnE = projectList.getColumn('E');
        columnE.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnG = projectList.getColumn('G');
        columnG.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'RuleDefinition-excel.xlsx');

        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (err) {
        console.log('error: ' + err);
    }
});
