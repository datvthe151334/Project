const Joi = require('joi');
const asyncHandler = require('../utils/async-handler');

module.exports = {
    validatePOST: asyncHandler(async (req, res, next) => {
        await Joi.object({
            UserMasterID: Joi.number().integer().min(1000).not(null).required(),
            RuleDefinitionID: Joi.number().integer().min(1000).not(null).required(),
            Note: Joi.string().allow(null, ''),
            Comment: Joi.string().allow(null, ''),
            Mark: Joi.number().allow(null, ''),
            ProjectID: Joi.number().integer().min(1000).not(null).required(),
            Comfirmer: Joi.string().allow(null, ''),
            IsComfirmed: Joi.number().integer().valid(0, 1),
            Approver: Joi.string().allow(null, ''),
            IsApproved: Joi.number().integer().valid(0, 1),
            Effort: Joi.number().allow(null, ''),
            KPer: Joi.number().allow(null, ''),
            Times: Joi.number().integer().not(null).required(),
            Month: Joi.number().integer().not(null).required(),
            Year: Joi.number()
                .integer()
                .min(2020)
                .max(new Date().getFullYear() + 1)
                .not(null)
                .required(),
            PointOfRule: Joi.number().integer().not(null).min(0),
            Evidence: Joi.string().allow(null, ''),
            DepartmentID: Joi.number().integer().min(1000).not(null).required(),
            Description: Joi.string().allow(null, ''),
            CreatedBy: Joi.string().not(null),
            UpdatedBy: Joi.string().allow(null),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            UserMasterID: Joi.number().integer().min(1000).not(null),
            RuleDefinitionID: Joi.number().integer().min(1000).not(null),
            Note: Joi.string().allow(null, ''),
            Comment: Joi.string().allow(null, ''),
            Mark: Joi.number().allow(null, ''),
            ProjectID: Joi.number().integer().min(1000).not(null),
            Comfirmer: Joi.string().allow(null, ''),
            IsComfirmed: Joi.number().integer().valid(0, 1),
            Approver: Joi.string().allow(null, ''),
            IsApproved: Joi.number().integer().valid(0, 1),
            Effort: Joi.number().allow(null, ''),
            KPer: Joi.number().allow(null, ''),
            Times: Joi.number().integer().not(null),
            Month: Joi.number().integer().not(null),
            Year: Joi.number()
                .integer()
                .min(2020)
                .max(new Date().getFullYear() + 1)
                .not(null),
            PointOfRule: Joi.number().integer().not(null).min(0),
            Evidence: Joi.string().allow(null, ''),
            DepartmentID: Joi.number().integer().min(1000).not(null),
            Description: Joi.string().allow(null, ''),
            CreatedBy: Joi.string().not(null),
            UpdatedBy: Joi.string().allow(null),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
