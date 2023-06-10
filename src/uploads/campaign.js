const multer = require('multer');
const appRootPath = require('app-root-path');
const fsExtra = require('fs-extra');
const CampaignService = require('../services/campaign.service');
const asyncHandler = require('../utils/async-handler');
const { errorResponse, successResponse } = require('../libs/response');

module.exports = {
    uploadCampaignImage: multer({
        limits: {
            fileSize: 3 * 1024 * 1024, // limit 3MB
        },
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, `${appRootPath}/public/campaign`);
            },
            filename: (req, file, cb) => {
                const ext = file.mimetype.split('/')[1];
                cb(null, `${Date.now()}.${ext}`);
            },
        }),
    }),

    removeCampaignImage: asyncHandler(async (req, res, next) => {
        if (req.file != undefined) {
            const campaign = await CampaignService.fncFindOne(req);
            if (campaign.ImageURL != '' || campaign.ImageURL != null) {
                const remove = await fsExtra.remove(`${appRootPath}/public/campaign/${campaign.ImageURL}`);

                if (remove != undefined) {
                    if (remove !== undefined) return res.status(400).json(errorResponse(400, 'can not remove image'));
                }
            }
        }
        return next();
    }),

    updateCampaignImage: asyncHandler(async (req, res, next) => {
        const pathSaveCampaign = `/public/images/campaign-${Date.now()}`;
        req.body.ImageURL = pathSaveCampaign;

        const update = await CampaignService.fncUpdateOne(req, next);

        if (update == 0) return res.status(400).json(errorResponse(400, 'can not update image'));
        return res.status(201).json(errorResponse(201, req.file));
    }),
};
