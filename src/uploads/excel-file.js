const multer = require('multer');
const appRootPath = require('app-root-path');

module.exports = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `/var/www/akarank_test/BE/public/assets/uploads`);
            // cb(null, `${appRootPath}/public/assets/uploads`);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        },
    }),

    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml')) {
            cb(null, true);
        } else {
            // @ts-ignore
            cb('Please upload only excel file', false);
        }
    },
});
