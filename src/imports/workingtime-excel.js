const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { WorkingTime, UserMaster } = require('../models');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = asyncHandler(async (req, res, next) => {
    if (req.file === undefined) {
        return res.status(400).send('Please upload an excel file!');
    }
    // @ts-ignore
    // const importExcel = await readXlsxFile(`${appRootPath}/assets/uploads/` + req.file.filename);
    const importExcel = await readXlsxFile(`/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename);

    const storeData = [];
    const { DepartmentID } = req.query;
    // skip header
    await importExcel.shift();

    let InputUsermasterName = [];
    let InputUsermasterId = [];
    let arrFail = [];
    for await (let row of importExcel) {
        InputUsermasterName.push(row[0]);
    }

    for await (let row of InputUsermasterName) {
        const findUsermaster = await UserMaster.findOne({
            where: { Account: row, DepartmentID: DepartmentID },
        });
        InputUsermasterId.push(findUsermaster == null ? null : findUsermaster.ID);
    }

    let i = 0;
    for await (let row of importExcel) {
        if (InputUsermasterId[i] !== null) {
            const check = await WorkingTime.findOne({
                where: { UserMasterID: InputUsermasterId[i], Month: row[1], Year: row[2] },
            });
            if (check) {
                const update = await WorkingTime.update({ WorkDateNumber: row[3] }, { where: { ID: check.ID } });
            } else {
                const dataInRow = {
                    UserMasterID: InputUsermasterId[i],
                    Month: row[1],
                    Year: row[2],
                    WorkDateNumber: row[3],
                };
                storeData.push(dataInRow);
            }
        } else arrFail.push(i);

        i++;
    }

    const workingTimes = await WorkingTime.bulkCreate(storeData);
    if (arrFail.length !== 0) {
        return res.status(400).json(errorResponse(400, `Import fail at row ${arrFail.toString()}, user not found`));
    }
    if (workingTimes) return res.status(201).json(successResponse(201, workingTimes));
    else return res.status(400).json(errorResponse(400));
});
