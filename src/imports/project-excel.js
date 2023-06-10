const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { Project, Department, UserMaster } = require('../models');
const { errorResponse, successResponse } = require('../libs/response');
const getAccountFromToken = require('../utils/account-token');
module.exports = asyncHandler(async (req, res, next) => {
    if (req.file === undefined) {
        return res.status(400).send('Please upload an excel file!');
    }
    // let path = `${appRootPath}/assets/uploads/` + req.file.filename;
    let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;
    // @ts-ignore
    const importExcel = await readXlsxFile(path);
    let storeData = [];

    // skip header
    await importExcel.shift();
    const { DepartmentID } = req.query;
    let InputUsermaterAccount = [];
    let InputUsermaterId = [];

    for await (let row of importExcel) {
        InputUsermaterAccount.push(row[2]);
    }
    let arrFail = [];
    let i = 0;

    for await (let row of InputUsermaterAccount) {
        const findUsermaster = await UserMaster.findOne({
            where: { Account: row, DepartmentID: DepartmentID },
        });
        InputUsermaterId.push(findUsermaster == null ? null : findUsermaster.ID);
    }
    for await (let row of importExcel) {
        storeData.push({
            Key: row[0],
            Code: row[1],
            DepartmentID: DepartmentID,
            ManagerID: InputUsermaterId[i],
            Type: row[3],
            Rank: row[4],
            Budget: row[5],
            StartDate: row[6],
            EndDate: row[7],
            Note: row[8],
            Status: row[9],
            CreatedBy: getAccountFromToken(req),
        });
        i++;
        if (row[9] !== 'On-going' && row[9] !== 'Cancelled' && row[9] !== 'Closed' && row[9] !== 'Other')
            return res.status(400).json(errorResponse(400, `Import fail at row ${i}, please re-check data field Status`));
        if (row[3] !== 'External' && row[3] !== 'Internal' && row[3] !== 'Other')
            return res.status(400).json(errorResponse(400, `Import fail at row ${i}, please re-check data field Type`));
        if (row[4] !== 'B' && row[4] !== 'C' && row[4] !== 'D' && row[4] !== 'A' && row[4] !== 'N/A' && row[4] !== 'Other')
            return res.status(400).json(errorResponse(400, `Import fail at row ${i}, please re-check data field Rank`));
    }

    let result = [];

    i = 0;
    for await (let row of importExcel) {
        const findProjectIsExsit = await Project.findOne({
            where: { Code: row[1], Key: row[0], DepartmentID: DepartmentID },
        });
        if (findProjectIsExsit !== null) {
            const update = await Project.update(
                {
                    ...storeData[i],
                    UpdatedBy: getAccountFromToken(req),
                },
                {
                    where: { Code: row[1], Key: row[0], DepartmentID: DepartmentID },
                }
            );

            if (!update) {
                arrFail.push(i);
            }
        } else {
            result.push(storeData[i]);
        }
        i++;
    }

    if (arrFail.length !== 0) {
        return res.status(400).json(errorResponse(400, `Import fail at row ${arrFail.toString()}, please re-check data`));
    }
    const projects = await Project.bulkCreate(result);

    if (projects) return res.status(201).json(successResponse(201, projects));
    else return res.status(400).json(errorResponse(400));
});
