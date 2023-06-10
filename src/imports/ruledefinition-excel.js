const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const appRootPath = require('app-root-path');
// @ts-ignore
const { RuleDefinition } = require('../models');
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
    let InputRuleName = [];
    const { DepartmentID } = req.query;
    for await (let row of importExcel) {
        InputRuleName.push(row[1]);
        const dataInRow = {
            RuleType: row[0],
            Name: row[1],
            Category: row[2],
            PointNumber: row[3],
            Note: row[4],
            DepartmentID: DepartmentID,
            Status: row[5] === 'Active' ? 1 : 2,
        };
        storeData.push(dataInRow);
    }

    let result = [];
    let i = 0;
    for await (let row of InputRuleName) {
        const findRulenameNotExist = await RuleDefinition.findOne({
            where: {
                Name: row,
                DepartmentID: DepartmentID,
            },
        });

        if (findRulenameNotExist !== null) {
            await RuleDefinition.update(
                {
                    UpdatedBy: `${req.authInfo.preferred_username.split('@')[0]}`,
                    RuleType: storeData[i].RuleType,
                    Category: storeData[i].Category,
                    PointNumber: storeData[i].PointNumber,
                    Note: storeData[i].Note,
                    DepartmentID: DepartmentID,
                    Status: storeData[i].Status,
                },
                {
                    where: {
                        Name: row,
                        DepartmentID: DepartmentID,
                    },
                }
            );
        } else {
            result.push(storeData[i]);
        }
        i++;
    }

    const ruleDefinitions = await RuleDefinition.bulkCreate(result);

    if (ruleDefinitions) return res.status(201).json(successResponse(201, ruleDefinitions));
    else return res.status(400).json(errorResponse(400));
});
