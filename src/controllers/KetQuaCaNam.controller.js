const asyncHandler = require('../utils/async-handler');
const KetQuaCaNamService = require('../services/KetQuaCaNam.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findKetQuaCaNams: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: KetQuaCaNams, count: total } = await KetQuaCaNamService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                KetQuaCaNams,
                currentPage: +page || 1,
                pageSize: +size || KetQuaCaNams.length,
            })
        );
    }),

    findKetQuaCaNam: asyncHandler(async (req, res, next) => {
        const KetQuaCaNam = await KetQuaCaNamService.fncFindOne(req);

        if (KetQuaCaNam) return res.json(successResponse(200, KetQuaCaNam));
        return res.status(404).json(errorResponse(404));
    }),

    createKetQuaCaNam: asyncHandler(async (req, res, next) => {
        const KetQuaCaNam = await KetQuaCaNamService.fncCreateOne(req);

        if (KetQuaCaNam) return res.status(201).json(successResponse(201, KetQuaCaNam));
        return res.status(500).json(errorResponse());
    }),

    updateKetQuaCaNam: asyncHandler(async (req, res, next) => {
        const KetQuaCaNam = await KetQuaCaNamService.fncUpdateOne(req, next);

        if (KetQuaCaNam) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteKetQuaCaNam: asyncHandler(async (req, res, next) => {
        const KetQuaCaNam = await KetQuaCaNamService.fncDeleteOne(req, next);

        if (KetQuaCaNam) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
