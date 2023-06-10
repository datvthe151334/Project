const asyncHandler = require('../utils/async-handler');
const { errorResponse, successResponse } = require('../libs/response');
const ClassService = require('../services/class.service');

module.exports = {
    

    createClass: asyncHandler(async (req, res, next) => {
        const Class = await ClassService.fncCreateOne(req, next);

        if (Class) return res.status(201).json(successResponse(201, Class));
        return res.status(500).json(errorResponse());
    }),
    findClasss: asyncHandler(async (req, res, next) => {
        const Classs = await ClassService.fncFindAll(req);

        return res.json(
            successResponse(200,Classs)
        );
    }),
    updateClass: asyncHandler(async (req, res, next) => {
        const Class = await ClassService.fncUpdateOne(req, next);

        if (Class) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    
    deleteClass: asyncHandler(async (req, res, next) => {
        const Class = await ClassService.fncDeleteOne(req, next);

        if (Class) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
    findClass: asyncHandler(async (req, res, next) => {
        const Class = await ClassService.fncFindOne(req);

        if (Class) return res.json(successResponse(200, Class));
        return res.status(404).json(errorResponse(404));
    }),
   
};
