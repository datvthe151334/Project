const appRootPath = require('app-root-path');
const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
// @ts-ignore
const { UserMaster, Department, UserBadge, Badge } = require('../models');
const { errorResponse, successResponse } = require('../libs/response');
const getAccountFromToken = require('../utils/account-token');
const ErrorResponse = require('../libs/error-response');
module.exports = asyncHandler(async (req, res, next) => {
    if (req.file === undefined) {
        return res.status(400).send('Please upload an excel file!');
    }
    if (!req.file.filename.includes('_member_')) {
        return res.status(400).json(errorResponse(400, 'Template file import not valid, please use template file of export'));
    }

    // let path = `${appRootPath}/public/assets/uploads/` + req.file.filename;
    let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;

    // @ts-ignore
    const importExcel = await readXlsxFile(path);
    let storeData = [];

    // skip header
    await importExcel.shift();

    let InputAccount = [];
    let InputDepartmentCode = [];
    let InputDepartmentId = [];
    let InputRoleId = [];
    let RoleName = ['Admin', 'Head', 'PM', 'Member'];
    let InputStatusId = [];
    let StatusName = ['Active', 'Inactive', 'Away', 'Not Ranking'];

    for await (let row of importExcel) {
        InputDepartmentCode.push(row[1]);
        for (let index = 0; index < RoleName.length; index++) {
            if (row[13] === RoleName[index]) {
                InputRoleId.push(index + 1);
            }
        }
        for (let index = 0; index < StatusName.length; index++) {
            if (row[14] === StatusName[index]) {
                InputStatusId.push(index + 1);
            }
        }
    }
    for await (let row of InputDepartmentCode) {
        const findDepartment = await Department.findOne({
            where: { Code: row },
        });

        InputDepartmentId.push(findDepartment == null ? null : findDepartment.ID);
    }

    let i = 0;
    for await (let row of importExcel) {
        if (!(row[9] !== 'NVCT' || row[9] !== 'SVTT'))
            return next(new ErrorResponse(400, `Invalid contract type in row ${i + 1} for account ${row[3]} (valid type 'NVCT' or 'SVTT')`));

        InputAccount.push(row[3]);
        storeData.push({
            DisplayName: row[0],
            DepartmentID: InputDepartmentId[i],
            Group: row[2],
            Account: row[3],
            Email: row[4],
            EmployeeID: row[5],
            Skill: row[6],
            DOB: row[7],
            PhoneNumber: row[8],
            ContractType: row[9] === 'NVCT' ? 1 : 2,
            Note: row[10],
            ViewMode: 1,
            JobTitle: row[11],
            RoleID: InputRoleId[i],
            Status: InputStatusId[i],
        });
        i++;
    }

    let result = [];
    i = 0;
    for await (let row of InputAccount) {
        const findAccountNotExist = await UserMaster.findOne({
            where: { Account: row, DepartmentID: storeData[i].DepartmentID },
        });
        if (findAccountNotExist !== null) {
            await UserMaster.update(
                {
                    UpdatedBy: getAccountFromToken(req),
                    DisplayName: storeData[i].DisplayName,
                    DepartmentID: storeData[i].DepartmentID,
                    Group: storeData[i].Group,
                    Account: storeData[i].Account,
                    Email: storeData[i].Email,
                    EmployeeID: storeData[i].EmployeeID,
                    Skill: storeData[i].Skill,
                    ForeignLanguage: storeData[i].ForeignLanguage,
                    DOB: storeData[i].DOB ? storeData[i].DOB : null,
                    PhoneNumber: storeData[i].PhoneNumber,
                    ContractType: storeData[i].ContractType,
                    Note: storeData[i].Note,
                    DateJoinUnit: storeData[i].DateJoinUnit,
                    JobTitle: storeData[i].JobTitle,
                    RoleID: storeData[i].RoleID,
                    Status: storeData[i].Status,
                },
                {
                    where: { Account: storeData[i].Account, DepartmentID: storeData[i].DepartmentID },
                }
            );
        }

        if (findAccountNotExist === null) {
            result.push(storeData[i]);
        }

        i++;
    }

    const userMasters = await UserMaster.bulkCreate(result);
    // if (userMasters.length !== 0) {
    //     const findAllmember = await UserMaster.findAll({ where: { DepartmentID: InputDepartmentId, RoleID: [3, 4] } });
    //     if (findAllmember.length !== 0) {
    //         const badge = await Badge.findOne({
    //             where: { Description: 'Badge award when member join department', DepartmentID: InputDepartmentId },
    //         });
    //         const arrayNewNem = findAllmember.map((x) => x.ID);
    //         for await (let el of arrayNewNem) {
    //             const check = await UserBadge.findOne({
    //                 where: { UserMasterID: el, BadgeID: badge.ID },
    //             });
    //             if (!check) {
    //                 const createNew = await UserBadge.create({
    //                     UserMasterID: el,
    //                     BadgeID: badge.ID,
    //                 });
    //             }
    //         }
    //     }
    // }

    if (userMasters) return res.status(201).json(successResponse(201, userMasters));
    else return res.status(400).json(errorResponse(400));
});
