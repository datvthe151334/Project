const multer = require('multer');
const appRootPath = require('app-root-path');
const fsExtra = require('fs-extra');
const SettingService = require('../services/setting.service');
const asyncHandler = require('../utils/async-handler');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    uploadLogo: multer({
        limits: {
            fileSize: 3 * 1024 * 1024, // limit 3MB
        },
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                // cb(null, `${appRootPath}/public/logo`);
                cb(null, `/var/www/akarank_test/BE/public/logo`);
            },
            filename: (req, file, cb) => {
                let ext = file.mimetype.split('/')[1];

                if (ext === 'svg+xml') {
                    ext = 'svg';
                }
                if (ext != 'img' && ext != 'svg' && ext != 'png' && ext != 'jpg' && ext != 'jpeg') {
                    return cb(new Error('Invalid file type'));
                }
                cb(null, `${file.originalname.split('.')[0]}-${Date.now()}.${ext}`);
            },
        }),
    }),

    removeLogo: asyncHandler(async (req, res, next) => {
        if (req.file) {
            const setting = await SettingService.fncFindOne(req);

            if (setting) {
                if (setting.Logo !== '') {
                    // const remove = await fsExtra.remove(`${appRootPath}/${setting.Logo}`);
                    const remove = await fsExtra.remove(`/var/www/akarank_test/BE${setting.Logo}`);
                    if (remove !== undefined) return res.status(400).json(errorResponse(400, 'can not remove image'));
                }
            }
        }
        return next();
    }),
};
