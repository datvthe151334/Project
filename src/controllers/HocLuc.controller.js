const asyncHandler = require('../utils/async-handler');
const HocLucService = require('../services/HocLuc.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findHocLucs: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: HocLucs, count: total } = await HocLucService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                HocLucs,
                currentPage: +page || 1,
                pageSize: +size || HocLucs.length,
            })
        );
    }),

    findHocLuc: asyncHandler(async (req, res, next) => {
        const HocLuc = await HocLucService.fncFindOne(req);

        if (HocLuc) return res.json(successResponse(200, HocLuc));
        return res.status(404).json(errorResponse(404));
    }),

    createHocLuc: asyncHandler(async (req, res, next) => {
        const HocLuc = await HocLucService.fncCreateOne(req, next);

        if (HocLuc) return res.json(successResponse(201, HocLuc));
        return res.status(500).json(errorResponse());
    }),

    createHocLucs: asyncHandler(async (req, res, next) => {
        const HocLucs = await HocLucService.fncCreateMany(req, next);

        if (HocLucs) return res.status(201).json(successResponse(201, HocLucs));
        return res.status(500).json(errorResponse());
    }),

    updateHocLuc: asyncHandler(async (req, res, next) => {
        const HocLuc = await HocLucService.fncUpdateOne(req, next);

        if (HocLuc) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteHocLuc: asyncHandler(async (req, res, next) => {
        const HocLuc = await HocLucService.fncDeleteOne(req, next);

        if (HocLuc) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
