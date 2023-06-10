const multer = require('multer');
const fsExtra = require('fs-extra');
const appRootPath = require('app-root-path');
const asyncHandler = require('../utils/async-handler');
const BadgeService = require('../services/badge.service');
const { errorResponse, successResponse } = require('../libs/response');
const ErrorResponse = require('../libs/error-response');

module.exports = {
    uploadBadgeImage: multer({
        limits: {
            fileSize: 3 * 1024 * 1024, // limit 3MB
        },
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                // cb(null, `${appRootPath}/public/badge`);
                cb(null, `/var/www/akarank_test/BE/public/badge`);
            },
            filename: (req, file, cb) => {
                // @ts-ignore
                // get extention image
                let ext = file.mimetype.split('/')[1];

                if (ext === 'svg+xml') {
                    ext = 'svg';
                }
                if (ext != 'img' && ext != 'svg' && ext != 'png' && ext != 'jpg' && ext != 'jpeg') {
                    return cb(new Error('Invalid file type'));
                }

                cb(null, `badge-${Date.now()}.${ext}`);
            },
        }),
    }),

    removeBadgeImage: asyncHandler(async (req, res, next) => {
        if (req.file != undefined) {
            const badge = await BadgeService.fncFindOne(req);
            if (badge) {
                if (badge.ImageURL !== '' || badge.ImageURL !== null) {
                    // const remove = await fsExtra.remove(`${appRootPath}/${badge.ImageURL}`);
                    const remove = await fsExtra.remove(`/var/www/akarank_test/BE${badge.ImageURL}`);
                    if (remove !== undefined) return res.status(400).json(errorResponse(400, 'can not remove image'));
                }
            }
        }
        return next();
    }),

    updateBadgeImage: asyncHandler(async (req, res, next) => {
        const pathSaveBadgeImg = `/public/badge/${req.file.filename}`;
        req.body.ImageURL = pathSaveBadgeImg;

        const update = await BadgeService.fncUpdateOne(req, next);
        if (update == 0) return res.status(400).json(errorResponse(400, 'can not remove image'));
        return res.status(201).json(successResponse(201, req.file));
    }),
};
