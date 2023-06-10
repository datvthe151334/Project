const asyncHandler = require('../utils/async-handler');
const StudentService = require('../services/student.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findStudentServices: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: StudentService, count: total } = await StudentService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                StudentService,
                currentPage: +page || 1,
                pageSize: +size || StudentService.length,
            })
        );
    }),

    findStudentService: asyncHandler(async (req, res, next) => {
        const StudentService = await StudentService.fncFindOne(req);

        if (StudentService) return res.json(successResponse(200, StudentService));
        return res.status(404).json(errorResponse(404));
    }),

    createStudentService: asyncHandler(async (req, res, next) => {
        const StudentService = await StudentService.fncCreateOne(req, next);

        if (StudentService) return res.status(201).json(successResponse(201, StudentService));
        return res.status(500).json(errorResponse(error));
    }),

    updateStudentService: asyncHandler(async (req, res, next) => {
        const StudentService = await StudentService.fncUpdateOne(req, next);

        if (StudentService) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteStudentService: asyncHandler(async (req, res, next) => {
        const StudentService = await StudentService.fncDeleteOne(req, next);

        if (StudentService) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
