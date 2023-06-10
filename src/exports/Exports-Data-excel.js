const path = require('path');
const XLSX = require('xlsx');
const asyncHandler = require('../utils/async-handler');
const moment = require('moment');
const appRootPath = require('app-root-path');
module.exports = {
    fncExportDataXLSX: asyncHandler(async (name, data) => {
        try {
            // format date in data
            const newDataSuccess = data[0].map((i) => {
                const DMYjson = i.Date;
                const newDate = new Date(DMYjson);
                const DMY = moment(newDate).format('DD-MMM-YYYY');
                i.Date = DMY;
                return i;
            });
            const newDataFailed = data[1].map((i) => {
                const DMYjson = i.Date;
                const newDate = new Date(DMYjson);
                const DMY = moment(newDate).format('DD-MMM-YYYY');
                i.Date = DMY;
                return i;
            });
            const newErrorDetails=[];
            for (const i of data[2]) {
                newErrorDetails.push([i]);
            }
            // create new book
            const success = XLSX.utils.book_new();
            const failed = XLSX.utils.book_new();

            // set the header name and length
            const headerName = ' '.repeat(180) + name + ' Report' + ' '.repeat(180);

            // convert json data to sheet
            const jtsSuccess = XLSX.utils.json_to_sheet(newDataSuccess, { origin: 1 });
            const jtsFailed = XLSX.utils.json_to_sheet(newDataFailed, { origin: 1 });
            const jtsErrorDetails = XLSX.utils.aoa_to_sheet(newErrorDetails);

            // add a default header to the sheet
            const header = [headerName];
            XLSX.utils.sheet_add_aoa(jtsSuccess, [header], { origin: 0 });
            XLSX.utils.sheet_add_aoa(jtsFailed, [header], { origin: 0 });

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
            const filePathSuccess = path.join(`/var/www/akarank_test/BE/public/assets/synchronizes/`, fileSuccess);
            // const filePathSuccess = path.join(`${appRootPath}/public/assets/synchronizes/`, fileSuccess);
            const filePathFailed = path.join(`/var/www/akarank_test/BE/public/assets/synchronizes/`, fileFailed);
            // const filePathFailed = path.join(`${appRootPath}/public/assets/synchronizes/`, fileFailed);

            XLSX.writeFile(success, filePathSuccess);
            XLSX.writeFile(failed, filePathFailed);

            return { filePathSuccess, filePathFailed };
        } catch (error) {
            // await t.rollback();

            return error.message + "in creating excel file";
        }
    }),
    fncExportDataXLS: asyncHandler(async (name, data) => {
        try {
            // format date in data
            const newDataSuccess = data[0].map((i) => {
                const DMYjson = i.Date;
                const newDate = new Date(DMYjson);
                const DMY = moment(newDate).format('DD-MMM-YYYY');
                i.Date = DMY;
                return i;
            });
            const newDataFailed = data[1].map((i) => {
                const DMYjson = i.Date;
                const newDate = new Date(DMYjson);
                const DMY = moment(newDate).format('DD-MMM-YYYY');
                i.Date = DMY;
                return i;
            });
            const newErrorDetails=[];
            for (const i of data[2]) {
                newErrorDetails.push([i]);
            }
            // create new book
            const success = XLSX.utils.book_new();
            const failed = XLSX.utils.book_new();

            // set the header name and length
            const headerName = ' '.repeat(180) + name + ' Report' + ' '.repeat(180);

            // convert json data to sheet
            const jtsSuccess = XLSX.utils.json_to_sheet(newDataSuccess, { origin: 1 });
            const jtsFailed = XLSX.utils.json_to_sheet(newDataFailed, { origin: 1 });
            const jtsErrorDetails = XLSX.utils.aoa_to_sheet(newErrorDetails);

            // add a default header to the sheet
            const header = [headerName];
            XLSX.utils.sheet_add_aoa(jtsSuccess, [header], { origin: 0 });
            XLSX.utils.sheet_add_aoa(jtsFailed, [header], { origin: 0 });
            // XLSX.utils.sheet_add_aoa(jtsErrorDetails, [header], { origin: 0 });

            //add sheet to file.xlsx and create sheet name
            XLSX.utils.book_append_sheet(success, jtsSuccess, `${name}-Success`);
            XLSX.utils.book_append_sheet(failed, jtsFailed, `${name}-Failed`);
            XLSX.utils.book_append_sheet(failed, jtsErrorDetails, `${name}-ErrorDetails`);

            //get time now and format
            const timestamp = Date.now();
            const DMYExport = moment(timestamp).format('YYYY-MM-DD');

            // create name file.xlsx
            const fileSuccess = `${name}_Success(${DMYExport}).xls`;
            const fileFailed = `${name}_Failed(${DMYExport}).xls`;
            const filePathSuccess = path.join(`/var/www/akarank_test/BE/public/assets/synchronizes/`, fileSuccess);
            // const filePathSuccess = path.join(`${appRootPath}/public/assets/synchronizes/`, fileSuccess);
            const filePathFailed = path.join(`/var/www/akarank_test/BE/public/assets/synchronizes/`, fileFailed);
            // const filePathFailed = path.join(`${appRootPath}/public/assets/synchronizes/`, fileFailed);

            XLSX.writeFile(success, filePathSuccess);
            XLSX.writeFile(failed, filePathFailed);

            return { filePathSuccess, filePathFailed };
        } catch (error) {
            // await t.rollback();

            return error.message + "in creating excel file";;
        }
    }),
};
