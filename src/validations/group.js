const Joi = require('joi');

const asyncHandler = require('../utils/async-handler');

module.exports = {
    validatePOST: asyncHandler(async (req, res, next) => {
        await Joi.object({
            GroupData: Joi.object().keys({
                Name: Joi.string().not(null).required().invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
                ShortDescription: Joi.string().allow(null, ''),
                DetailDescription: Joi.string().allow(null, ''),
                Status: Joi.number().integer().allow(null),
            }),
            GroupMemberData: Joi.array().items(Joi.number().integer().min(1000)),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            GroupData: Joi.object().keys({
                Name: Joi.string().not(null).invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
                ShortDescription: Joi.string().allow(null, ''),
                DetailDescription: Joi.string().allow(null, ''),
                Status: Joi.number().integer().allow(null),
            }),
            GroupMemberData: Joi.array().items(Joi.number().integer().min(1000)),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
