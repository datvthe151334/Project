const multer = require('multer');
const fsExtra = require('fs-extra');
const appRootPath = require('app-root-path');
const asyncHandler = require('../utils/async-handler');
const UserCampaignService = require('../services/usercampaign.service');
const { errorResponse } = require('../libs/response');

module.exports = {
    uploadEvidence: multer({
        limits: {
            fileSize: 3 * 1024 * 1024, // limit 3MB
        },
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                // cb(null, `${appRootPath}/public/images`);
                cb(null, `/var/www/akarank_test/BE/public/images`);
            },
            filename: (req, file, cb) => {
                const ext = file.mimetype.split('/')[1];
                cb(null, `evidence-${Date.now()}.${ext}`);
            },
        }),
    }),

    removeEvidence: asyncHandler(async (req, res, next) => {
        if (req.file != undefined) {
            const userCampaign = await UserCampaignService.fncFindOne(req);
            if (userCampaign) {
                if (userCampaign.Evidence !== '' || userCampaign.Evidence !== null) {
                    // const remove = await fsExtra.remove(`${appRootPath}/${userCampaign.Evidence}`);
                    const remove = await fsExtra.remove(`/var/www/akarank_test/BE${userCampaign.Evidence}`);
                    if (remove !== undefined) return res.status(400).json(errorResponse(400, 'can not remove evidence'));
                }
            } else return next(new errorResponse(404, 'User campain not found'));
        }
        return next();
    }),
};
