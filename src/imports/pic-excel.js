const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { Pic } = require('../models');
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
            RuleDefinitionID: row[0],
            UserType: row[1],
            UserMasterID: row[2],
        };
        storeData.push(dataInRow);
    }

    const pics = await Pic.bulkCreate(storeData);

    if (pics) return res.status(201).json(successResponse(201, pics));
    else return res.status(400).json(errorResponse(400));
});
