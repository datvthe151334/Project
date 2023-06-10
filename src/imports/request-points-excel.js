const appRootPath = require('app-root-path');
const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');

module.exports = asyncHandler(async (req, res, next) => {
    if (req.file === undefined) {
        return res.status(400).send('Please upload an excel file!');
    }
    const storeData = [];

    // let path = `${appRootPath}/assets/uploads/` + req.file.filename;
    let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;
    // @ts-ignore
    const importExcel = await readXlsxFile(path);

    // skip header
    await importExcel.shift();

    return importExcel;
});
