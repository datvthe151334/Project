const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { Ranking, UserMaster } = require('../models');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = asyncHandler(async (req, res, next) => {
    if (req.file === undefined) {
        return res.status(400).send('Please upload an excel file!');
    }
    let path = `${appRootPath}/public/assets/uploads/` + req.file.filename;
    // let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;
    // @ts-ignore
    const importExcel = await readXlsxFile(path);
    let storeData = [];

    // skip header
    await importExcel.shift();
    const { DepartmentID, month, year } = req.query;
    for await (let row of importExcel) {
        const user = await UserMaster.findOne({ where: { Account: row[3], DepartmentID: DepartmentID } });
        const find = await Ranking.findOne({ where: { UserMasterID: user.ID, Month: month, Year: year } });
        if (!find) {
            const dataInRow = {
                total_point: row[4] ?? 0,
                point_plus: row[6] ?? 0,
                point_minus: row[7] ?? 0,
                DepartmentID: DepartmentID,
                UserMasterID: user.ID,
                Month: month ?? 13,
                Year: year,
                UserStatus: user.Status,
                UserContractType: user.ContractType,
            };
            storeData.push(dataInRow);
        } else
            Ranking.update(
                {
                    total_point: row[4] ?? 0,
                    point_plus: row[6] ?? 0,
                    point_minus: row[7] ?? 0,
                    DepartmentID: DepartmentID,
                },
                { where: { UserMasterID: user.ID, Month: month, Year: year } }
            );
    }

    const rankings = await Ranking.bulkCreate(storeData);

    if (rankings) return res.status(201).json(successResponse(201, rankings));
    else return res.status(400).json(errorResponse(400));
});
