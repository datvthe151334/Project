const asyncHandler = require('../utils/async-handler');
const GroupMembersService = require('../services/groupmembers.service');
const { successResponse, errorResponse } = require('../libs/response');

module.exports = {
    findManyGroupMembers: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: groupMembers, count: total } = await GroupMembersService.fncFindMany(req, next);

        return res.status(200).json({
            success: true,
            data: {
                total,
                groupMembers,
                currentPage: +page || 1,
                pageSize: +size || groupMembers.length,
            },
        });
    }),

    findGroupMembers: asyncHandler(async (req, res, next) => {
        const groupMembers = await GroupMembersService.fncFindOne(req);

        if (groupMembers) return res.json(successResponse(200, groupMembers));
        return res.status(404).json(errorResponse(404));
    }),

    createGroupMembers: asyncHandler(async (req, res, next) => {
        const groupMembers = await GroupMembersService.fncCreateOne(req);

        if (groupMembers) return res.json(successResponse(201, groupMembers));
        return res.status(500).json(errorResponse());
    }),

    updateGroupMembers: asyncHandler(async (req, res, next) => {
        const groupMembers = await GroupMembersService.fncUpdateOne(req, next);

        if (groupMembers) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteGroupMembers: asyncHandler(async (req, res, next) => {
        const groupMembers = await GroupMembersService.fncDeleteOne(req, next);

        if (groupMembers) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
