const mailer = require('nodemailer');
const ErrorResponse = require('../libs/error-response');
const { MAIL_TRANSPORT_HOST, MAIL_AUTH_USERNAME, MAIL_AUTH_PASSWORD } = process.env;

/**
 * @param {*} to receiver email
 * @param {*} subject subject email
 * @param {*} content content email send to user
 * @return send mail to specify user
 */
module.exports = async function (to, subject, content) {
    try {
        const transport = mailer.createTransport({
            host: MAIL_TRANSPORT_HOST,
            auth: {
                user: MAIL_AUTH_USERNAME,
                pass: MAIL_AUTH_PASSWORD,
            },
        });

        transport.verify(function (error, success) {
            if (error) {
                throw new ErrorResponse(500, "can't create transport send mail");
            }
        });

        const sendMailToUser = await transport.sendMail({
            from: '<DatVT25@fsoft.com.vn>',
            to: `${to}@fsoft.com.vn`,
            subject: subject,
            html: content,
        });
    } catch (err) {
        throw new ErrorResponse(500, `send mail fail, ${err.message}`);
    }
};
