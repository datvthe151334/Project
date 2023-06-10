const Excel = require('exceljs');
const asyncHandler = require('../utils/async-handler');
// @ts-ignore
const { Project, ProjectMembers } = require('../models');

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

        // create sheet
        const Account = workbook.addWorksheet('ProjectMembers');
        const projectList = workbook.addWorksheet('Project_List', { state: 'hidden' });
        //

        // create sheet header
        projectList.columns = [{ header: 'PROJECT_CODE', key: 'Code', width: 40 }];

        Account.columns = [
            { header: 'ACCOUNT', key: 'ACCOUNT', width: 20 },
            { header: 'PROJECT_CODE', key: 'PROJECT_CODE', width: 20 },
        ];

        // fill in data for each sheet
        projectList.addRows(allDepartmentProject);

        // data validate project
        // @ts-ignore
        Account.dataValidations.add('B2:B9999', {
            type: 'list',
            allowBlank: true,
            formulae: [allDepartmentProject.length !== 0 ? `=Project_List!$A$2:$A$${allDepartmentProject.length + 1}` : '"NO PROJECT"'],
        });

        // month
        // @ts-ignore

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'ProjectMember-excel.xlsx');

        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (err) {
        console.log('error: ' + err);
    }
});
