const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { Project, ProjectMembers, UserMaster } = require('../models');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = asyncHandler(async (req, res, next) => {
    if (req.file === undefined) {
        return res.status(400).send('Please upload an excel file!');
    }
    // let path = `${appRootPath}/assets/uploads/` + req.file.filename;
    let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;
    // @ts-ignore
    const importExcel = await readXlsxFile(path);
    const storeData = [];

    // skip header

    await importExcel.shift();
    const { DepartmentID } = req.query;

    for await (let row of importExcel) {
        let usermaster = await UserMaster.findOne({
            where: { Account: row[0], DepartmentID: DepartmentID },
        });

        if (!usermaster) return res.status(400).json(errorResponse(404, `user ${row[0]} not found`));

        let project = await Project.findOne({
            where: { Code: row[1], DepartmentID: DepartmentID },
        });

        if (!project) return res.status(400).json(errorResponse(404, `project ${row[1]} not found`));

        const exist = await ProjectMembers.findOne({
            where: { ProjectID: project.ID, MemberID: usermaster.ID },
        });
        if (!exist) {
            storeData.push({
                ProjectID: project.ID,
                MemberID: usermaster.ID,
            });
        }
    }
    const projectMembers = await ProjectMembers.bulkCreate(storeData);

    if (projectMembers) return res.status(201).json(successResponse(201, projectMembers));
    else return res.status(400).json(errorResponse(400));
});
