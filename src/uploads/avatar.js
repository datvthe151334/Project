const multer = require('multer');
const fsExtra = require('fs-extra');
const appRootPath = require('app-root-path');
const asyncHandler = require('../utils/async-handler');
const UserMasterService = require('../services/usermaster.service');
const { errorResponse, successResponse } = require('../libs/response');
const getAccountFromToken = require('../utils/account-token');
module.exports = {
    uploadAvatar: multer({
        limits: {
            fileSize: 3 * 1024 * 1024, // limit 3MB
        },
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                const pathProduct = `/var/www/akarank_test/BE/public/avatar`;
                // const pathProduct = `${appRootPath}/public/avatar`;
                fsExtra.mkdirSync(pathProduct, { recursive: true });
                cb(null, pathProduct);
            },
            filename: (req, file, cb) => {
                // get extention image
                let ext = file.mimetype.split('/')[1];
                if (ext === 'svg+xml') {
                    ext = 'svg';
                }
                if (ext != 'img' && ext != 'svg' && ext != 'png' && ext != 'jpg' && ext != 'jpeg') {
                    return cb(new Error('Invalid file type'));
                }
                const timestamp = Date.now();

                // get account name requesting
                // @ts-ignore
                const accountName = getAccountFromToken(req);

                cb(null, `${accountName}-${timestamp}.${ext}`);
            },
        }),
    }),

    removeAvatar: asyncHandler(async (req, res, next) => {
        const usermaster = await UserMasterService.fncFindOne(req);

        if (usermaster) {
            if (usermaster.Avatar !== '' || usermaster.Avatar !== null) {
                const remove = await fsExtra.remove(`/var/www/akarank_test/BE${usermaster.Avatar}`);

                if (remove !== undefined) {
                    return res.status(400).json(errorResponse(400, 'can not remove image'));
                }
            }
        }
        return next();
    }),

    updateAvatar: asyncHandler(async (req, res, next) => {
        const pathSaveAvatar = `/var/www/akarank_test/BE/public/avatar/${req.file.filename}`;
        // const pathSaveAvatar = `${appRootPath}/public/avatar/${req.file.filename}`;
        const imageUrl = `/public/avatar/${req.file.filename}`;
        req.body.image = pathSaveAvatar;
        req.params.account = getAccountFromToken(req);

        const update = await UserMasterService.fncUpdateOne(req, next);
        const result = { ...req.file, imageUrl };

        if (update == 0) return res.status(400).json(errorResponse(400, 'can not update image'));
        return res.status(201).json(successResponse(201, result));
    }),
};
