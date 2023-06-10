const asyncHandler = require('../utils/async-handler');
const SemesterService = require('../services/semester.service');
const { successResponse, errorResponse } = require('../libs/response');

module.exports = {
    findManySemesters: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: Semesters, count: total } = await SemesterService.fncFindMany(req, next);

        return res.status(200).json({
            success: true,
            data: {
                total,
                Semesters,
                currentPage: +page || 1,
                pageSize: +size || Semesters.length,
            },
        });
    }),

    findSemesters: asyncHandler(async (req, res, next) => {
        const Semesters = await SemesterService.fncFindOne(req);

        if (Semesters) return res.json(successResponse(200, Semesters));
        return res.status(404).json(errorResponse(404));
    }),

    createSemesters: asyncHandler(async (req, res, next) => {
        const Semesters = await SemesterService.fncCreateOne(req, next);

        if (Semesters) return res.json(successResponse(201, Semesters));
        return res.status(500).json(errorResponse(err ? err : ''));
    }),

    updateSemesters: asyncHandler(async (req, res, next) => {
        const Semesters = await SemesterService.fncUpdateOne(req, next);

        if (Semesters) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteSemesters: asyncHandler(async (req, res, next) => {
        const Semesters = await SemesterService.fncDeleteOne(req, next);

        if (Semesters) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
