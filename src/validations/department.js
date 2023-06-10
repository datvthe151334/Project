const Joi = require('joi');
const asyncHandler = require('../utils/async-handler');

module.exports = {
    validatePOST: asyncHandler(async (req, res, next) => {
        await Joi.object({
            Code: Joi.string()
                .min(1)
                .max(100)
                .not(null)
                .required()
                .invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
            Name: Joi.string()
                .min(1)
                .max(100)
                .not(null)
                .required()
                .invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
            JIRAID: Joi.string().allow(null, ''),
            Slogan: Joi.string().allow(null, ''),
            Description: Joi.string().allow(null),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            Code: Joi.string().min(1).not(null).invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
            Name: Joi.string().min(1).not(null).invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
            JIRAID: Joi.string().allow(null, ''),
            Slogan: Joi.string().allow(null, ''),
            Description: Joi.string().allow(null),
            fsu: Joi.number().integer().allow(null),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
