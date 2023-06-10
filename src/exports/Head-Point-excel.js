const Excel = require('exceljs');
const asyncHandler = require('../utils/async-handler');
// @ts-ignore
const { Project, RuleDefinition } = require('../models');

module.exports = asyncHandler(async (req, res, next) => {
    try {
        const { DepartmentID } = req.query;

        const workbook = new Excel.Workbook();

        const allDepartmentProject = await Project.findAll({
            attributes: ['Code'],
            where: {
                DepartmentID: DepartmentID,
                Status: 'On-going',
            },
            raw: true,
        });

        const allDepartmentRule = await RuleDefinition.findAll({
            attributes: ['Name', 'PointNumber'],
            where: {
                DepartmentID: DepartmentID,
                Status: 1,
            },
            raw: true,
        });

        // create sheet
        const requestPoint = workbook.addWorksheet('Request_Point');
        const ruleDefinition = workbook.addWorksheet('Rule_Definition', { state: 'hidden' });
        const projectList = workbook.addWorksheet('Project_List', { state: 'hidden' });
        //

        // create sheet header
        requestPoint.columns = [
            { header: 'ACCOUNT', key: 'ACCOUNT', width: 20 },
            { header: 'RULE_DEFINITION', key: 'RULE_DEFINITION', width: 50 },
            { header: 'POINT_NUMBER', key: 'POINT_NUMBER', width: 20 },
            { header: 'NOTE', key: 'NOTE', width: 30 },
            { header: 'PROJECT_CODE', key: 'PROJECT_CODE', width: 20 },
            { header: 'TIMES', key: 'TIMES', width: 20 },
            { header: 'MONTH', key: 'MONTH', width: 20 },
            { header: 'YEAR', key: 'YEAR', width: 20 },
            { header: 'EFFORT', key: 'EFFORT', width: 20 },
            { header: 'KPER', key: 'KPER', width: 20 },
            { header: 'TOTAL_POINT', key: 'TOTAL_POINT', width: 20 },
        ];

        ruleDefinition.columns = [
            { header: 'RULE_DEFINITION', key: 'Name', width: 50 },
            { header: 'POINT_NUMBER', key: 'PointNumber', width: 20 },
        ];

        projectList.columns = [{ header: 'PROJECT_CODE', key: 'Code', width: 40 }];
        //

        // fill in data for each sheet
        projectList.addRows(allDepartmentProject);
        ruleDefinition.addRows(allDepartmentRule);

        // data validate rule
        // @ts-ignore
        requestPoint.dataValidations.add('B2:B9999', {
            type: 'list',
            allowBlank: true,
            formulae: [allDepartmentRule.length !== 0 ? `=Rule_Definition!$A$2:$A$${allDepartmentRule.length + 1}` : '"NO RULE"'],
        });

        // show rule point
        requestPoint.fillFormula('C2:C9999', '=IF(TRIM(B2)="","",IF(TRIM(B2)="Other","",VLOOKUP(B2,Rule_Definition!$A$2:$B$999,2,FALSE)))');

        // data validate project
        // @ts-ignore
        requestPoint.dataValidations.add('E2:E9999', {
            type: 'list',
            allowBlank: true,
            formulae: [allDepartmentProject.length !== 0 ? `=Project_List!$A$2:$A$${allDepartmentProject.length + 1}` : '"NO PROJECT"'],
        });

        // month
        // @ts-ignore
        requestPoint.dataValidations.add('G2:G9999', {
            type: 'list',
            allowBlank: true,
            formulae: ['"1,2,3,4,5,6,7,8,9,10,11,12"'],
        });

        // total-point
        requestPoint.fillFormula(
            'K2:K9999',
            '=IF(TRIM(B2)="", "",IF(TRIM(B2)="Other","", IF(TRIM(B2)="[Plus][BU]Monthly Performance",C2*I2*J2*F2,C2*F2)))'
        );

        requestPoint.getCell('L2').value =
            'if rule is monthly performance => Total-Point = Rule-Point * Effort * Kper * Times if rule is not monthly performance => Total-Point = Rule-Point * Times';

        //

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'Head-POINT-EXCEL.xlsx');

        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (err) {
        console.log('OOOOOOO this is the error: ' + err);
    }
});
