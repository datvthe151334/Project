const asyncHandler = require('../utils/async-handler');
const GradeService = require('../services/grade.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findGrades: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: Grades, count: total } = await GradeService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                Grades,
                currentPage: +page || 1,
                pageSize: +size || Grades.length,
            })
        );
    }),

    findGrade: asyncHandler(async (req, res, next) => {
        const Grade = await GradeService.fncFindOne(req);

        if (Grade) return res.json(successResponse(200, Grade));
        return res.status(404).json(errorResponse(404));
    }),

    createGrade: asyncHandler(async (req, res, next) => {
        const Grade = await GradeService.fncCreateOne(req);

        if (Grade) return res.status(201).json(successResponse(201, Grade));
        return res.status(500).json(errorResponse());
    }),

    updateGrade: asyncHandler(async (req, res, next) => {
        const Grade = await GradeService.fncUpdateOne(req, next);

        if (Grade) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteGrade: asyncHandler(async (req, res, next) => {
        const Grade = await GradeService.fncDeleteOne(req, next);

        if (Grade) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
