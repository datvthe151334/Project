const Joi = require('joi');
const asyncHandler = require('../utils/async-handler');

module.exports = {
    validatePOST: asyncHandler(async (req, res, next) => {
        await Joi.object({
            RuleDefinitionID: Joi.number().integer().min(1000).not(null).required(),
            UserType: Joi.number().integer().min(1).not(null).required(),
            UserMasterID: Joi.number().integer().min(1000).not(null).required(),
            CreatedBy: Joi.string().not(null),
            UpdatedBy: Joi.string().allow(null),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            RuleDefinitionID: Joi.number().integer().min(1000).not(null),
            UserType: Joi.number().integer().min(1).not(null),
            UserMasterID: Joi.number().integer().min(1000).not(null),
            CreatedBy: Joi.string().not(null),
            UpdatedBy: Joi.string().allow(null),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
