const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { WorkingTimeOfYear, UserMaster } = require('../models');
const { errorResponse, successResponse } = require('../libs/response');
const getAccountFromToken = require('../utils/account-token');
module.exports = asyncHandler(async (req, res, next) => {
    const { DepartmentID } = req.body;

    if (req.file === undefined) {
        return res.status(400).send('Please upload an excel file!');
    }
    // @ts-ignore
    // const importExcel = await readXlsxFile(`${appRootPath}/assets/uploads/` + req.file.filename);
    const importExcel = await readXlsxFile(`/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename);

    const storeData = [];

    // skip header
    await importExcel.shift();

    for await (let row of importExcel) {
        const check = await WorkingTimeOfYear.findOne({
            where: { DepartmentID: DepartmentID, Month: +row[0], Year: +row[1] },
        });
        if (check) {
            const update = await WorkingTimeOfYear.update(
                { WorkDateNumber: +row[2], UpdatedBy: getAccountFromToken(req) },
                { where: { DepartmentID: DepartmentID, Month: +row[0], Year: +row[1] } }
            );
        } else {
            const dataInRow = {
                CreatedBy: getAccountFromToken(req),
                Month: +row[0],
                Year: +row[1],
                WorkDateNumber: +row[2],
                DepartmentID: DepartmentID,
            };
            storeData.push(dataInRow);
        }
    }

    const WorkingTimeOfYears = await WorkingTimeOfYear.bulkCreate(storeData);

    if (WorkingTimeOfYears) return res.status(201).json(successResponse(201, WorkingTimeOfYears));
    else return res.status(400).json(errorResponse(400));
});
