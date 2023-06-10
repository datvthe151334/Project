const { QueryTypes } = require('sequelize');
const { sequelize, UserMaster, Department, Setting, Badge } = require('../models');
const path = require('path');
const asyncHandler = require('../utils/async-handler');
const moment = require('moment');
const appRootPath = require('app-root-path');
const exceljs = require('exceljs');

module.exports = asyncHandler(async (req, res, next) => {
    try {
        const getDMYCurrent = moment(Date.now()).format('M');
        let listMonth = [];
        for (let month = 1; month <= getDMYCurrent; month++) {
            listMonth.push(month);
        }
        const getBadge = await Badge.findAll({
            attributes: ['Name', 'ID'],
            where: { AwardType: 'manual', DepartmentID: req.query.DepartmentID, Status: 1 },
            raw: true,
        });

        const workbook = new exceljs.Workbook();

        const worksheet = workbook.addWorksheet('Manual Award');
        const worksheetHidden = workbook.addWorksheet('Hidden', { state: 'hidden' });

        worksheet.columns = [
            { header: 'Account', key: 'Account', width: 50 },
            { header: 'Medal', key: 'Medal', width: 50 },
            { header: 'ID', key: 'ID', hidden: true },
            { header: 'Month', key: 'Month', width: 20 },
        ];

        worksheetHidden.columns = [
            { header: 'Name', key: 'Name' },
            { header: 'ID', key: 'ID' },
        ];

        // add rows from data array
        getBadge.forEach((rowData) => {
            worksheetHidden.addRow([rowData.Name, rowData.ID]);
        });
        worksheet.dataValidations.add(`B2:B9999`, {
            type: 'list',
            allowBlank: true,
            formulae: [getBadge.length !== 0 ? `=Hidden!$A$2:$A$${getBadge.length + 1}` : '"No Badge"'],
        });
        worksheet.dataValidations.add('D2:D9999', {
            type: 'list',
            allowBlank: true,
            formulae: [`"${listMonth.join(',')}"`],
        });
        worksheet.fillFormula('C2:C9999', `=IF(TRIM(B2)="","",IF(TRIM(B2)="Other","",VLOOKUP(B2,Hidden!$A$2:$B$${getBadge.length + 1},2,FALSE)))`);

        const fileSuccess = `Template-Manual.xlsx`;
        const outputPath = path.join(`${appRootPath}/public/assets/synchronizes/`, fileSuccess);
        await workbook.xlsx.writeFile(outputPath);
        res.sendFile(outputPath);
        // return outputPath;
    } catch (error) {
        next(error);
    }
});
