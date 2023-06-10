const logger = require('../helpers/logger');

/**
 * @param {*} err catch errors send
 * @param {*} req
 * @param {*} res
 * @returns status error and message error
 */
module.exports = function errorHandler(err, req, res, next) {
    // log error into file
    logger.error(err);

    return res.status(err.statusCode || 500).json({
        success: false,
        statusCode: err.statusCode || 500,
        error: err.message || 'Server Error',
    });
};
