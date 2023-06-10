const asyncHandler = require('../utils/async-handler');
const HanhKiemService = require('../services/HanhKiem.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findBadgesLevel: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: badges, count: total } = await HanhKiemService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                badges,
                currentPage: +page || 1,
                pageSize: +size || badges.length,
            })
        );
    }),

    findHanhKiem: asyncHandler(async (req, res, next) => {
        const badge = await HanhKiemService.fncFindOne(req);

        if (badge) return res.json(successResponse(200, badge));
        return res.status(404).json(errorResponse(404));
    }),

    createHanhKiem: asyncHandler(async (req, res, next) => {
        const badge = await HanhKiemService.fncCreateOne(req, res, next);

        if (badge) return res.status(201).json(successResponse(201, badge));
        return res.status(500).json(errorResponse());
    }),

    updateHanhKiem: asyncHandler(async (req, res, next) => {
        const badge = await HanhKiemService.fncUpdateOne(req, next);

        if (badge) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteHanhKiem: asyncHandler(async (req, res, next) => {
        const badge = await HanhKiemService.fncDeleteOne(req, next);

        if (badge) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
