const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { Badge, Department } = require('../models');
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
        const dataInRow = {
            ImageURL: row[0],
            Name: row[1],
            Description: row[1],
            DepartmentID: DepartmentID,
        };
        storeData.push(dataInRow);
    }

    const badges = await Badge.bulkCreate(storeData);

    if (badges) return res.status(201).json(successResponse(201, badges));
    else return res.status(400).json(errorResponse(400));
});
