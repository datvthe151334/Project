const Joi = require('joi');
const asyncHandler = require('../utils/async-handler');

module.exports = {
    validatePOST: asyncHandler(async (req, res, next) => {
        await Joi.object({
            UserMasterID: Joi.number().integer().min(1000).not(null).required(),
            Name: Joi.string().not(null).required().invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
            CreatedBy: Joi.string().not(null),
            UpdatedBy: Joi.string().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            UserMasterID: Joi.number().integer().min(1000).not(null),
            Name: Joi.string().not(null).invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
            CreatedBy: Joi.string().not(null),
            UpdatedBy: Joi.string().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
