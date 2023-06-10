const http = require('http');
const https = require('https');
const { base64StringJira, cookieJira } = require('./session-jira');

class FetchDepartment {
    async download(url, cb) {
        let http_or_https = http;
        url = 'https://insight.fsoft.com.vn';
        if (/^https:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/.test(url)) {
            // @ts-ignore
            http_or_https = https;
        }
        let getBase64 = base64StringJira();
        let cookieGet = await cookieJira();
        let options = {
            hostname: 'insight.fsoft.com.vn',
            path: '/jira9/secure/magic_user_cal_effort.jspa',
            headers: {
                Authorization: 'Basic ' + getBase64,
                cookie: cookieGet,
            },
        };
        http_or_https
            .get(options, function (response) {
                switch (response.statusCode) {
                    case 200:
                        if (cb.gotResponse) cb.gotResponse(response);
                        response
                            .on('data', function (chunk) {
                                cb.data(chunk);
                            })
                            .on('end', function () {
                                cb.end();
                            });
                        break;
                    case 301:
                    case 302:
                    case 303:
                    case 307:
                        // @ts-ignore
                        download(response.headers.location, cb);
                        break;
                    default:
                        cb.error(new Error('Server responded with status code ' + response.statusCode));
                }
            })
            .on('error', function (err) {
                cb.error(err);
            });
    }

    async downloadString(options) {
        let response;

        await this.download(options.url, {
            gotResponse: function (response) {
                response.setEncoding('utf8');
            },
            data: function (chunk) {
                response += String(chunk);
            },
            end: function () {
                options.done(response);
            },
            error: function (obj) {
                options.error(obj);
            },
        });
    }
}

module.exports = new FetchDepartment();
