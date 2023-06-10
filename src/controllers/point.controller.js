const asyncHandler = require('../utils/async-handler');
const PointService = require('../services/point.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findPoints: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: Points, count: total } = await PointService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                Points,
                currentPage: +page || 1,
                pageSize: +size || Points.length,
            })
        );
    }),

    findPoint: asyncHandler(async (req, res, next) => {
        const Point = await PointService.fncFindOne(req);

        if (Point) return res.json(successResponse(200, Point));
        return res.status(404).json(errorResponse(404));
    }),

    createPoint: asyncHandler(async (req, res, next) => {
        const Point = await PointService.fncCreateOne(req, next);

        if (Point) return res.json(successResponse(201, Point));
        return res.status(500).json(errorResponse());
    }),

    updatePoint: asyncHandler(async (req, res, next) => {
        const Point = await PointService.fncUpdateOne(req, next);

        if (Point) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deletePoint: asyncHandler(async (req, res, next) => {
        const Point = await PointService.fncDeleteOne(req, next);

        if (Point) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
