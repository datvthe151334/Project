const Joi = require('joi');
const asyncHandler = require('../utils/async-handler');
const today = new Date();
const yyyy = today.getFullYear();
let mm = today.getMonth() + 1; // Months start at 0!
let dd = today.getDate();
if (dd < 10) dd = '0' + dd;
if (mm < 10) mm = '0' + mm;
const formattedToday = yyyy + '/' + mm + '/' + dd;

module.exports = {
    validatePOST: asyncHandler(async (req, res, next) => {
        await Joi.object({
            Name: Joi.string().not(null).required().invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
            ImageURL: Joi.string().allow(null, ''),
            Description: Joi.string().not(null),
            DepartmentID: Joi.number().integer().min(1000).not(null).required(),
            ProjectID: Joi.number().integer().min(1000).not(null).required(),
            Budget: Joi.number().integer().not(null).min(0).required(),
            MaximumReceiver: Joi.number().integer().min(0).allow(null),
            CoinNumber: Joi.number().integer().min(0).allow(null),
            StartDate: Joi.date().min(formattedToday).not(null).required(),
            EndDate: Joi.date().not(null).required().min(Joi.ref('StartDate')),
            DeadLine: Joi.date().min(Joi.ref('StartDate')).not(null).required(),
            CreatedBy: Joi.string().allow(null),
            Confirmer: Joi.string().not(null),
            UpdatedBy: Joi.string().allow(null),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            Name: Joi.string().not(null).invalid('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '{', '}', '|', '?'),
            ImageURL: Joi.string().allow(null, ''),
            Description: Joi.string().not(null),
            DepartmentID: Joi.number().integer().min(1000).not(null),
            ProjectID: Joi.number().integer().min(1000).not(null),
            Budget: Joi.number().integer().not(null).min(0),
            MaximumReceiver: Joi.number().integer().min(0).allow(null),
            CoinNumber: Joi.number().integer().min(0).allow(null),
            StartDate: Joi.date().min(formattedToday).not(null),
            EndDate: Joi.date().not(null).min(Joi.ref('StartDate')),
            DeadLine: Joi.date().min(Joi.ref('StartDate')).not(null),
            CreatedBy: Joi.string().allow(null),
            Confirmer: Joi.string().not(null),
            UpdatedBy: Joi.string().allow(null),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
