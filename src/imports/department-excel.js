const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { Department } = require('../models');
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

    for await (let row of importExcel) {
        const dataInRow = {
            ID: row[0],
            Code: row[1],
            Name: row[2],
            Slogan: row[3],
            Status: row[4],
        };
        storeData.push(dataInRow);
    }

    const departments = await Department.bulkCreate(storeData);

    if (departments) return res.status(201).json(successResponse(201, departments));
    else return res.status(400).json(errorResponse(400));
});
