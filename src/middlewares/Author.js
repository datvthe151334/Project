const _ = require('lodash');
const asyncHandler = require('../utils/async-handler');
// @ts-ignore
const { UserMaster, Permission } = require('../models');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = asyncHandler(async (req, res, next) => {
    // from token validated
    const inputAccountUser = req.authInfo.preferred_username.split('@')[0];

    const findAccountUser = await UserMaster.findOne({ where: { Account: inputAccountUser } });

    const roleUser = findAccountUser.RoleID;

    const matchUserPermission = await Permission.findAll({ where: { RoleID: roleUser } });

    let storeRoutesAndMethod = [];

    matchUserPermission.map((value) => {
        const foundIndex = storeRoutesAndMethod.findIndex((element) => element.Routes === value.Routes);

        if (foundIndex === -1) {
            storeRoutesAndMethod.push({ Routes: value.Routes, Method: [value.Method] });
        } else {
            storeRoutesAndMethod[foundIndex].Method.push(value.Method);
        }
    });

    // /api/v1/departments?keyword=FHN => /departments
    const suffixRoutes = `/${req.path.split('/')[1]}`;
    const requestMethod = `${req.method}`;

    // check if any route exists on storeUserRoutesValid array
    const checkMatchRoutesAndMethod = storeRoutesAndMethod.some(
        (value) => value.Routes === suffixRoutes && (value.Method.includes(requestMethod) || value.Method.includes('ALL'))
    );

    if (checkMatchRoutesAndMethod) {
        // next to controller api
        return next();
    } else {
        return res.status(403).json(errorResponse(403));
    }
});
