const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { UserBadge } = require('../models');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = asyncHandler(async (req, res, next) => {
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
        const dataInRow = {
            UserMasterID: row[0],
            BadgeID: row[1],
        };
        storeData.push(dataInRow);
    }

    const userBadges = await UserBadge.bulkCreate(storeData);

    if (userBadges) return res.status(201).json(successResponse(201, userBadges));
    else return res.status(400).json(errorResponse(400));
});
