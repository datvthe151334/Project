const Joi = require('joi');
const asyncHandler = require('../utils/async-handler');

module.exports = {
    validatePOST: asyncHandler(async (req, res, next) => {
        await Joi.object({
            UserMasterID: Joi.number().integer().min(1000).not(null).required(),
            Content: Joi.string().not(null).required(),
            LinkRefer: Joi.string().allow(null, ''),
            Sender: Joi.integer().number().allow(null, ''),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            UserMasterID: Joi.number().integer().min(1000).not(null),
            Content: Joi.string().not(null),
            LinkRefer: Joi.string().allow(null, ''),
            Sender: Joi.integer().number().allow(null, ''),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
