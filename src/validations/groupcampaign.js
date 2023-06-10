const Joi = require('joi');
const asyncHandler = require('../utils/async-handler');

module.exports = {
    validatePOST: asyncHandler(async (req, res, next) => {
        await Joi.object({
            GroupID: Joi.array().items(Joi.number().integer().min(1000).allow(null).required()),
            CampaignID: Joi.number().integer().min(1000).not(null).required(),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            GroupID: Joi.array().items(Joi.number().integer().min(1000).allow(null)),
            CampaignID: Joi.number().integer().min(1000).not(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
