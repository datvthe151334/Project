const multer = require('multer');
const fsExtra = require('fs-extra');
const appRootPath = require('app-root-path');
const asyncHandler = require('../utils/async-handler');
const UserMoocCampaignService = require('../services/usermooccampaign.service');
const { errorResponse } = require('../libs/response');

module.exports = {
    uploadEvidence: multer({
        limits: {
            fileSize: 3 * 1024 * 1024, // limit 3MB
        },
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, `${appRootPath}/public/images`);
            },
            filename: (req, file, cb) => {
                const ext = file.mimetype.split('/')[1];
                cb(null, `evidence-${Date.now()}.${ext}`);
            },
        }),
    }),

    removeEvidence: asyncHandler(async (req, res, next) => {
        if (req.file != undefined) {
            const userMoocCampaign = await UserMoocCampaignService.fncFindOne(req);
            if (userMoocCampaign) {
                if (userMoocCampaign.Evidence !== '' || userMoocCampaign.Evidence !== null) {
                    const remove = await fsExtra.remove(`${appRootPath}/${userMoocCampaign.Evidence}`);

                    if (remove !== undefined) return res.status(400).json(errorResponse(400, 'can not remove evidence'));
                }
            } else return next(new errorResponse(404, 'User campain not found'));
        }
        return next();
    }),
};
