const asyncHandler = require('../utils/async-handler');
const SubjectService = require('../services/subject.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findSubjectServices: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: SubjectService, count: total } = await SubjectService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                SubjectService,
                currentPage: +page || 1,
                pageSize: +size || SubjectService.length,
            })
        );
    }),

    findSubjectService: asyncHandler(async (req, res, next) => {
        const SubjectService = await SubjectService.fncFindOne(req);

        if (SubjectService) return res.json(successResponse(200, SubjectService));
        return res.status(404).json(errorResponse(404));
    }),

    createSubjectService: asyncHandler(async (req, res, next) => {
        const SubjectService = await SubjectService.fncCreateOne(req, next);

        if (SubjectService) return res.status(201).json(successResponse(201, SubjectService));
        return res.status(500).json(errorResponse(error));
    }),

    updateSubjectService: asyncHandler(async (req, res, next) => {
        const SubjectService = await SubjectService.fncUpdateOne(req, next);

        if (SubjectService) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteSubjectService: asyncHandler(async (req, res, next) => {
        const SubjectService = await SubjectService.fncDeleteOne(req, next);

        if (SubjectService) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
