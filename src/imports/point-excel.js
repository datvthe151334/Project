const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { Point, Project } = require('../models');
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
    let InputProjectKey = [];
    let InputProjectId = [];

    for await (let row of importExcel) {
        InputProjectKey.push(row[4]);
    }

    for await (let row of InputProjectKey) {
        const findProject = await Project.findOne({
            where: { Key: row },
        });
        InputProjectId.push(findProject == null ? null : findProject.ID);
    }

    let i = 0;
    for await (let row of importExcel) {
        storeData.push({
            UserMasterID: row[0],
            RuleDefinitionID: row[1],
            Note: row[2],
            Mark: row[3],
            ProjectID: InputProjectId[i],
            Effort: row[5] != null ? parseFloat(row[5]) : null,
            KPer: row[6],
            Times: row[7],
            Month: row[8],
            Year: row[9],
            PointOfRule: row[10],
            Evidence: row[11],
            DepartmentID: DepartmentID,
            UpdatedBy: row[12],
            CreatedBy: row[13],
            Status: row[14],
            CreatedDate: row[15],
        });
        i++;
    }

    const points = await Point.bulkCreate(storeData);

    if (points) return res.status(201).json(successResponse(201, points));
    else return res.status(400).json(errorResponse(400));
});
