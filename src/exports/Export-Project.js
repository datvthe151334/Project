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

        const { fsu } = req.query;
        const queries = queryParams(
            req.query,
            Op,
            //
            ['Key', 'Code', 'Type'],
            ['Key', 'Code', 'ManagerID', 'DepartmentID', 'Type', 'Rank', 'StartDate', 'EndDate', 'UpdatedBy', 'CreatedBy', 'Status']
        );

        const allDepartmentProject = await Project.findAll({
            order: queries.order,

            include: [
                {
                    model: UserMaster,
                    as: 'Manager',
                    attribute: 'Account',
                },
                fsu !== undefined
                    ? {
                          model: Department,
                          as: 'Department',
                          where: {
                              Code: {
                                  [Op.like]: `%${fsu}%`,
                              },
                          },
                      }
                    : {
                          model: Department,
                          as: 'Department',
                      },
            ],
            where: {
                [Op.or]: [
                    [queries.searchOr],

                    {
                        [Op.or]: [
                            { '$Manager.Account$': { [Op.like]: `%${req.query.keyword}%` } },

                            { '$Department.Code$': { [Op.like]: `%${req.query.keyword}%` } },
                        ],
                    },
                ],
            },
            distinct: true,
            // limit: queries.limit,
            // offset: queries.offset,
            raw: true,
        });
        // create sheet
        const projectList = workbook.addWorksheet('Project_List');
        //
        const status = workbook.addWorksheet('status', { state: 'hidden' });
        const Type = workbook.addWorksheet('type', { state: 'hidden' });
        const Rank = workbook.addWorksheet('rank', { state: 'hidden' });

        status.columns = [{ header: 'Status', key: 'Status', width: 50 }];
        Type.columns = [{ header: 'type', key: 'Type', width: 50 }];
        Rank.columns = [{ header: 'rank', key: 'rank', width: 50 }];
        const Status = [{ Status: 'On-going' }, { Status: 'Closed' }, { Status: 'Cancelled' }, { Status: 'Other' }];
        const type = [{ Type: 'External' }, { Type: 'Internal' }, { Type: 'Other' }];
        const rank = [{ rank: 'A' }, { rank: 'B' }, { rank: 'C' }, { rank: 'D' }, { rank: 'N/A' }, { rank: 'Other' }];

        status.addRows(Status);
        Type.addRows(type);
        Rank.addRows(rank);

        // data validate rule
        // @ts-ignore
        projectList.dataValidations.add('J2:J9999', {
            type: 'list',
            allowBlank: true,
            formulae: [Status.length !== 0 ? `=status!$A$2:$A$${Status.length + 1}` : '"NO STATUS"'],
        });
        projectList.dataValidations.add('D2:D9999', {
            type: 'list',
            allowBlank: true,
            formulae: [type.length !== 0 ? `=type!$A$2:$A$${type.length + 1}` : '"NO Type"'],
        });
        projectList.dataValidations.add('E2:E9999', {
            type: 'list',
            allowBlank: true,
            formulae: [rank.length !== 0 ? `=rank!$A$2:$A$${rank.length + 1}` : '"NO STATUS"'],
        });
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
            { header: 'PROJECT_KEY', key: 'Key', width: 30 },
            { header: 'PROJECT_CODE', key: 'Code', width: 30 },
            { header: 'Manager', key: 'Manager.Account', width: 15 },
            { header: 'Type', key: 'Type', width: 13 },
            { header: 'Rank', key: 'Rank', width: 10 },
            { header: 'Budget', key: 'Budget', width: 15 },
            { header: 'Start Date', key: 'StartDate', width: 15 },
            { header: 'End Date', key: 'EndDate', width: 15 },
            { header: 'Note', key: 'Note', width: 40 },
            { header: 'Status', key: 'Status', width: 15 },
        ];

        projectList.getRow(1).eachCell((cell) => {
            cell.style = headerStyle;
        });

        // fill in data for each sheet
        projectList.addRows(allDepartmentProject);

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
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnD = projectList.getColumn('D');
        columnD.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnE = projectList.getColumn('E');
        columnE.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnF = projectList.getColumn('F');
        columnF.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'right' };
            }
        });

        const columnG = projectList.getColumn('G');
        columnG.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'right' };
            }
        });

        const columnH = projectList.getColumn('H');
        columnH.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'right' };
            }
        });

        const columnI = projectList.getColumn('I');
        columnI.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnJ = projectList.getColumn('J');
        columnJ.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= projectList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        // data validate project
        // @ts-ignore

        // month
        // @ts-ignore

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'Project-excel.xlsx');

        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (err) {
        console.log('error: ' + err);
    }
});
