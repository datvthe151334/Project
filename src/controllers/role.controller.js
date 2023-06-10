const asyncHandler = require('../utils/async-handler');
const roleService = require('../services/role.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findroles: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: roles, count: total } = await roleService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                roles,
                currentPage: +page || 1,
                pageSize: +size || roles.length,
            })
        );
    }),

    findrole: asyncHandler(async (req, res, next) => {
        const role = await roleService.fncFindOne(req);

        if (role) return res.json(successResponse(200, role));
        return res.status(404).json(errorResponse(404));
    }),

    createrole: asyncHandler(async (req, res, next) => {
        const role = await roleService.fncCreateOne(req, next);

        if (role) return res.json(successResponse(201, role));
        return res.status(500).json(errorResponse());
    }),

    updaterole: asyncHandler(async (req, res, next) => {
        const role = await roleService.fncUpdateOne(req, next);

        if (role) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleterole: asyncHandler(async (req, res, next) => {
        const role = await roleService.fncDeleteOne(req, next);

        if (role) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
