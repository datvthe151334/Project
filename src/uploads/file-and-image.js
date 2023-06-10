const multer = require('multer');
const appRootPath = require('app-root-path');

module.exports = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.mimetype.includes('image/png' || 'image/svg')) {
                // cb(null, `${appRootPath}/public/badge`);
                cb(null, `/var/www/akarank_test/BE/public/badge`);
            } else if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml')) {
                // cb(null, `${appRootPath}/public/assets/uploads`);
                cb(null, `/var/www/akarank_test/BE/public/assets/uploads`);
            }
        },
        filename: (req, file, cb) => {
            if (file.mimetype.includes('image/png')) {
                // @ts-ignore
                // get extention image
                let ext = file.mimetype.split('/')[1];

                if (ext === 'svg+xml') {
                    ext = 'svg';
                }
                cb(null, `badge-${Date.now()}.${ext}`);
            } else if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml')) {
                cb(null, `${Date.now()}-${file.originalname}`);
            }
        },
    }),

    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml') || file.mimetype.includes('image/png')) {
            cb(null, true);
        } else {
            // @ts-ignore
            cb('Please upload only excel file', false);
        }
    },
});
