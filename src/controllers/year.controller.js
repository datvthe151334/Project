const asyncHandler = require('../utils/async-handler');
const YearService = require('../services/year.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findYears: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: Years, count: total } = await YearService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                Years,
                currentPage: +page || 1,
                pageSize: +size || Years.length,
            })
        );
    }),

    findYear: asyncHandler(async (req, res, next) => {
        const Year = await YearService.fncFindOne(req);

        if (Year) return res.json(successResponse(200, Year));
        return res.status(404).json(errorResponse(404));
    }),

    createYear: asyncHandler(async (req, res, next) => {
        const Year = await YearService.fncCreateOne(req);

        if (Year) return res.status(201).json(successResponse(201, Year));
        return res.status(500).json(errorResponse());
    }),

    updateYear: asyncHandler(async (req, res, next) => {
        const Year = await YearService.fncUpdateOne(req, next);

        if (Year) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteYear: asyncHandler(async (req, res, next) => {
        const Year = await YearService.fncDeleteOne(req, next);

        if (Year) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
