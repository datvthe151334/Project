const asyncHandler = require('../utils/async-handler');
const TypePointService = require('../services/typePoint.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findTypePoints: asyncHandler(async (req, res, next) => {
        const TypePoints = await TypePointService.fncFindAll(req);

        return res.json(successResponse(200, TypePoints));
    }),

    findTypePoint: asyncHandler(async (req, res, next) => {
        const TypePoint = await TypePointService.fncFindOne(req);

        if (TypePoint) return res.json(successResponse(200, TypePoint));
        return res.status(404).json(errorResponse(404));
    }),

    findVoted: asyncHandler(async (req, res, next) => {
        const listvoted = await TypePointService.fncFindVoted(req);

        if (listvoted) return res.json(successResponse(200, listvoted));
        return res.status(404).json(errorResponse(404));
    }),

    createTypePoint: asyncHandler(async (req, res, next) => {
        const TypePoint = await TypePointService.fncCreateOne(req, next);

        if (TypePoint) return res.status(201).json(successResponse(201, TypePoint));
        return res.status(500).json(errorResponse());
    }),

    updateTypePoint: asyncHandler(async (req, res, next) => {
        const TypePoint = await TypePointService.fncUpdateOne(req, next);

        if (TypePoint) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteTypePoint: asyncHandler(async (req, res, next) => {
        const TypePoint = await TypePointService.fncDeleteOne(req, next);

        if (TypePoint) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse(err));
    }),
};
