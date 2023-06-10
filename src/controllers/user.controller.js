const asyncHandler = require('../utils/async-handler');
const UserService = require('../services/user.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findUsers: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: Users, count: total } = await UserService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                Users,
                currentPage: +page || 1,
                pageSize: +size || Users.length,
            })
        );
    }),

    findUser: asyncHandler(async (req, res, next) => {
        const User = await UserService.fncFindOne(req);

        if (User) return res.json(successResponse(200, User));
        return res.status(404).json(errorResponse(404));
    }),

    createUser: asyncHandler(async (req, res, next) => {
        const User = await UserService.fncCreateOne(req);

        if (User) return res.status(201).json(successResponse(201, User));
        return res.status(500).json(errorResponse());
    }),

    updateUser: asyncHandler(async (req, res, next) => {
        const User = await UserService.fncUpdateOne(req, next);

        if (User) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    login: asyncHandler(async (req, res, next) => {
        const User = await UserService.fncLogin(req,res, next);

        if (User) return res.status(200).json(successResponse(200,User));

        return res.status(500).json(errorResponse(500,"Account not exsit in system"));
    }),
};
