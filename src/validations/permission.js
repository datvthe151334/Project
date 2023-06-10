const Joi = require('joi');
const asyncHandler = require('../utils/async-handler');

module.exports = {
    validatePOST: asyncHandler(async (req, res, next) => {
        await Joi.object({
            Routes: Joi.string().not(null).required(),
            Service: Joi.string().not(null).required(),
            Method: Joi.string().valid(Joi.in('ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH')).not(null).required(),
            RoleID: Joi.number().integer().min(1).not(null).required(),
            Description: Joi.string().allow(null, ''),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            Routes: Joi.string().not(null),
            Service: Joi.string().not(null),
            Method: Joi.string().valid(Joi.in('ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH')).not(null),
            RoleID: Joi.number().integer().min(1).not(null),
            Description: Joi.string().allow(null, ''),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
