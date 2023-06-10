const winston = require('winston');
require('winston-daily-rotate-file');
const AppRootPath = require('app-root-path');

module.exports = winston.createLogger({
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp({
            format: 'DD-MM-YYYY HH:mm:ss',
        }),
        winston.format.colorize(),
        winston.format.printf((log) => {
            if (log.stack) return `[${log.timestamp}] [${log.level}] ${log.stack}`;
            return `[${log.timestamp}] [${log.level}] ${log.message}`;
        })
    ),
    levels: winston.config.syslog.levels,
    transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
            // @ts-ignore
            filename: `${AppRootPath}/logs/logging-%DATE%.log`,
            // zippedArchive: true,
            // maxSize: 30,
            datePattern: 'DD-MM-YYYY',
        }),
    ],
});
