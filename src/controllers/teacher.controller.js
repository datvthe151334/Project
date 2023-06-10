const asyncHandler = require('../utils/async-handler');
const TeacherService = require('../services/teacher.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findTeachers: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: Teachers, count: total } = await TeacherService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                Teachers,
                currentPage: +page || 1,
                pageSize: +size || Teachers.length,
            })
        );
    }),

    findTeacher: asyncHandler(async (req, res, next) => {
        const Teacher = await TeacherService.fncFindOne(req);

        if (Teacher) return res.json(successResponse(200, Teacher));
        return res.status(404).json(errorResponse(404));
    }),

    createTeacher: asyncHandler(async (req, res, next) => {
        const Teacher = await TeacherService.fncCreateOne(req);

        if (Teacher) return res.status(201).json(successResponse(201, Teacher));
        return res.status(500).json(errorResponse());
    }),

    updateTeacher: asyncHandler(async (req, res, next) => {
        const Teacher = await TeacherService.fncUpdateOne(req, next);

        if (Teacher) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    updateMoocListCampaign: asyncHandler(async (req, res, next) => {
        const Teacher = await TeacherService.fncUpdateList(req, next);

        if (Teacher) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteTeacher: asyncHandler(async (req, res, next) => {
        const Teacher = await TeacherService.fncDeleteOne(req, next);

        if (Teacher) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
