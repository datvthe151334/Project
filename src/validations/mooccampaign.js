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
            CampaignID: Joi.number().integer().min(1000).not(null).required(),
            CoinNumber: Joi.number().integer().not(null).min(0),
            Budget: Joi.number().integer().min(0).not(null),
            StartDate: Joi.date().min(formattedToday).not(null).required(),
            EndDate: Joi.date().not(null).required().min(Joi.ref('StartDate')),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),

    validatePUT: asyncHandler(async (req, res, next) => {
        await Joi.object({
            CampaignID: Joi.number().integer().min(1000).not(null),
            CoinNumber: Joi.number().integer().not(null).min(0),
            Budget: Joi.number().integer().min(0).not(null),
            StartDate: Joi.date().min(formattedToday).not(null),
            EndDate: Joi.date().not(null).min(Joi.ref('StartDate')),
            Status: Joi.number().integer().allow(null),
        }).validateAsync(req.body, { abortEarly: false });

        next();
    }),
};
