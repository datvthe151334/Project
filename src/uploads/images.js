const multer = require('multer');
const appRootPath = require('app-root-path');
const Point = require('../services/point.service');
const asyncHandler = require('../utils/async-handler');
const fsExtra = require('fs-extra');
const fs = require('fs');

module.exports = {
    uploadEvidence: multer({
        limits: {
            fileSize: 3 * 1024 * 1024, // limit 3MB
        },
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                // const pathProduct = `${appRootPath}/public/images`;
                const pathProduct = `/var/www/akarank_test/BE/public/images`;
                fs.mkdirSync(pathProduct, { recursive: true });
                cb(null, pathProduct);
            },
            filename: (req, file, cb) => {
                let ext = file.mimetype.split('/')[1];

                if (ext === 'svg+xml') {
                    ext = 'svg';
                }
                if (ext != 'img' && ext != 'svg' && ext != 'png' && ext != 'jpg' && ext != 'jpeg') {
                    return cb(new Error('Invalid file type'));
                }
                cb(null, `evidence-${Date.now()}.${ext}`);
            },
        }),
    }),
    removeEvidence: asyncHandler(async (req, res, next) => {
        if (req.file != undefined) {
            const point = await Point.fncFindOne(req);
            if (point) {
                if (point.Evidence !== '' || point.Evidence !== null) {
                    // const remove = await fsExtra.remove(`${appRootPath}/${point.Evidence}`);
                    const remove = await fsExtra.remove(`/var/www/akarank_test/BE${point.Evidence}`);
                    if (remove !== undefined) return res.status(400).json(errorResponse(400, 'can not remove evidence'));
                }
            } else return next(new errorResponse(404, 'Point not found'));
        }
        return next();
    }),
};
