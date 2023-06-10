const { ENVIROMENT, LOCAL_UPLOAD_PATH, SERVER_UPLOAD_PATH } = process.env;
const fs = require('fs');
module.exports = (req) => {
    try {
        const pathProduct = ENVIROMENT === 'local' ? `${appRootPath}${LOCAL_UPLOAD_PATH}` : SERVER_UPLOAD_PATH;
        // const pathProduct = `${appRootPath}/public/product`;
        fs.mkdirSync(pathProduct, { recursive: true });

        importExcel = readXlsxFile(`${pathProduct + req.file.filename}`);

        return importExcel;
    } catch (err) {
        throw new ErrorResponse(500, `Open file excel fail`);
    }
};
