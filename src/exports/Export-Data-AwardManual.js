const path = require('path');
const XLSX = require('xlsx');
const asyncHandler = require('../utils/async-handler');
const moment = require('moment');
const appRootPath = require('app-root-path');
module.exports = {
    fncExportDataXLSX: asyncHandler(async (name, data) => {
        try {
            // format date in data
            const newDataSuccess = [];
            for (const i of data[0]) {
                newDataSuccess.push(i);
            }
            const newDataFail = [];
            for (const i of data[1]) {
                newDataFail.push(i);
            }
            const newErrorDetails = [];
            for (const i of data[2]) {
                newErrorDetails.push([i]);
            }
            // create new book
            const success = XLSX.utils.book_new();
            const failed = XLSX.utils.book_new();

            // set the header name and length
            const headerName = ' '.repeat(180) + name + ' Report' + ' '.repeat(180);

            // convert json data to sheet
            // const jtsSuccess = XLSX.utils.json_to_sheet(data[0], { origin: 1 });
            const jtsSuccess = XLSX.utils.json_to_sheet(newDataSuccess, { origin: 1 });
            const jtsFailed = XLSX.utils.json_to_sheet(newDataFail, { origin: 1 });
            const jtsErrorDetails = XLSX.utils.aoa_to_sheet(newErrorDetails);

            // add a default header to the sheet
            const header = [headerName];
            XLSX.utils.sheet_add_aoa(jtsSuccess, [[header], ['Account', 'Medal', 'Month']], { origin: 0 });
            XLSX.utils.sheet_add_aoa(jtsFailed, [[header], ['Account', 'Medal', 'Month']], { origin: 0 });

            //add sheet to file.xlsx and create sheet name
            XLSX.utils.book_append_sheet(success, jtsSuccess, `${name}-Success`);
            XLSX.utils.book_append_sheet(failed, jtsFailed, `${name}-Failed`);
            XLSX.utils.book_append_sheet(failed, jtsErrorDetails, `${name}-ErrorDetails`);

            //get time now and format
            const timestamp = Date.now();
            const DMYExport = moment(timestamp).format('YYYY-MM-DD');

            // create name file.xlsx
            const fileSuccess = `${name}_Success(${DMYExport}).xlsx`;
            const fileFailed = `${name}_Failed(${DMYExport}).xlsx`;
            const filePathSuccess = path.join(`/var/www/akarank_test/BE/public/assets/userbadges/`, fileSuccess);
            // const filePathSuccess = path.join(`${appRootPath}/public/assets/userbadges/`, fileSuccess);
            const filePathFailed = path.join(`/var/www/akarank_test/BE/public/assets/userbadges/`, fileFailed);
            // const filePathFailed = path.join(`${appRootPath}/public/assets/userbadges/`, fileFailed);

            XLSX.writeFile(success, filePathSuccess);
            XLSX.writeFile(failed, filePathFailed);
            return { filePathSuccess, filePathFailed };
        } catch (error) {
            // await t.rollback();

            return error.message + 'in creating excel file';
        }
    }),
};
