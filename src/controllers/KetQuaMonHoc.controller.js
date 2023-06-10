const asyncHandler = require('../utils/async-handler');
const KetQuaMonHocService = require('../services/KetQuaMonHoc.service');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    findGroupChildofFSU: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncFindGroupChildOfFSU(req);

        if (KetQuaMonHoc) return res.json(successResponse(200, KetQuaMonHoc));
        return res.status(404).json(errorResponse(404));
    }),
    findKetQuaMonHocs: asyncHandler(async (req, res, next) => {
        const { page, size } = req.query;
        const { rows: KetQuaMonHocs, count: total } = await KetQuaMonHocService.fncFindAll(req);

        return res.json(
            successResponse(200, {
                total,
                KetQuaMonHocs,
                currentPage: +page || 1,
                pageSize: +size || KetQuaMonHocs.length,
            })
        );
    }),

    findKetQuaMonHocValid: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncFindKetQuaMonHocNotBelongToFsu(req);
        if (KetQuaMonHoc) return res.json(successResponse(200, KetQuaMonHoc));
        return res.status(404).json(errorResponse(404));
    }),
    findKetQuaMonHocsByUserID: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncFindAllByUserID(req);
        if (KetQuaMonHoc) return res.json(successResponse(200, KetQuaMonHoc));
        return res.status(404).json(errorResponse(404));
    }),

    findAllFSU: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncFindFsu(req, res, next);
        if (KetQuaMonHoc) return res.json(successResponse(200, KetQuaMonHoc));
        return res.status(404).json(errorResponse(404));
    }),

    findSubKetQuaMonHoc: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncFindSubKetQuaMonHoc(req);

        if (KetQuaMonHoc) return res.json(successResponse(200, KetQuaMonHoc));
        return res.status(404).json(errorResponse(404));
    }),

    findSubKetQuaMonHocOfFSU: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncFindSubKetQuaMonHocOfFSU(req);

        if (KetQuaMonHoc) return res.json(successResponse(200, KetQuaMonHoc));
        return res.status(404).json(errorResponse(404));
    }),
    syncDataWithJira: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncSyncDataWithJira();

        return res.json(successResponse(200, KetQuaMonHoc));
    }),

    findKetQuaMonHoc: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncFindOne(req);

        if (KetQuaMonHoc) return res.json(successResponse(200, KetQuaMonHoc));
        return res.status(404).json(errorResponse(404));
    }),

    createKetQuaMonHoc: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncCreateOne(req, next);

        if (KetQuaMonHoc) return res.status(201).json(successResponse(201, KetQuaMonHoc));
        return res.status(500).json(errorResponse());
    }),

    createFSU: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncCreateFsu(req, next);

        if (KetQuaMonHoc) return res.status(201).json(successResponse(201, KetQuaMonHoc));
        return res.status(500).json(errorResponse());
    }),

    updateFsu: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncUpdateFsu(req, next);

        if (KetQuaMonHoc) return res.status(201).json(successResponse(201, KetQuaMonHoc));
        return res.status(500).json(errorResponse());
    }),
    updateFsuToBu: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncUpdateFsuToBu(req, next);

        if (KetQuaMonHoc) return res.status(200).json(successResponse(200, KetQuaMonHoc));
        return res.status(500).json(errorResponse());
    }),

    updateKetQuaMonHoc: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncUpdateOne(req, next);

        if (KetQuaMonHoc) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),

    deleteKetQuaMonHoc: asyncHandler(async (req, res, next) => {
        const KetQuaMonHoc = await KetQuaMonHocService.fncDeleteOne(req, next);

        if (KetQuaMonHoc) return res.status(204).json(successResponse(204));
        return res.status(500).json(errorResponse());
    }),
};
