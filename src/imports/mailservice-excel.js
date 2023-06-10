const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { MailService } = require('../models');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = asyncHandler(async (req, res, next) => {
    if (req.file === undefined) {
        return res.status(400).send('Please upload an excel file!');
    }
    let path = `${appRootPath}/assets/uploads/` + req.file.filename;
    // @ts-ignore
    const importExcel = await readXlsxFile(path);
    const storeData = [];

    // skip header
    await importExcel.shift();
    const { DepartmentID } = req.query;
    for await (let row of importExcel) {
        const dataInRow = {
            ID: row[0],
            Content: row[1],
            Subject: row[2],
            ServiceKey: row[3],
            Service: row[4],
            DepartmentID: DepartmentID,
        };
        storeData.push(dataInRow);
    }

    const mailservice = await MailService.bulkCreate(storeData);

    if (mailservice) return res.status(201).json(successResponse(201, mailservice));
    else return res.status(400).json(errorResponse(400));
});
