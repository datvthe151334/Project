const appRootPath = require('app-root-path');
const path = require('path');
const xlsx = require('xlsx');
const asyncHandler = require('../utils/async-handler');
const moment = require('moment');
module.exports = {
    fncImportDataTypeXLSXhaveHeader: asyncHandler(async (req, res, next) => {
        if (req.file === undefined) {
            return res.status(400).send('Please upload an excel file!');
        }
        // let path = `${appRootPath}/public/assets/uploads/` + req.file.filename;
        let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;

        const importExcel = await xlsx.readFile(path);
        const sheet_name_list = importExcel.SheetNames;
        var data = xlsx.utils.sheet_to_json(importExcel.Sheets[sheet_name_list[0]], { range: 1 });
        return data;
    }),
    fncImportDataTypeXLSXnoHeader: asyncHandler(async (req, res, next) => {
        if (req.file === undefined) {
            return res.status(400).send('Please upload an excel file!');
        }

        // let path = `${appRootPath}/public/assets/uploads/` + req.file.filename;
        let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;

        const importExcel = await xlsx.readFile(path);
        const sheet_name_list = importExcel.SheetNames;
        var data = xlsx.utils.sheet_to_json(importExcel.Sheets[sheet_name_list[0]]);

        return data;
    }),
    fncImportDataBadgeManualhaveHeader: asyncHandler(async (req, res, next) => {
        if (req.file === undefined) {
            return res.status(400).send('Please upload an excel file!');
        }

        // let path = `${appRootPath}/public/assets/uploads/` + req.file.filename;
        let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;

        const importExcel = await xlsx.readFile(path);
        const sheet_name_list = importExcel.SheetNames;
        var data = xlsx.utils.sheet_to_json(importExcel.Sheets[sheet_name_list[0]], { range: 0, blankrows: true, skipHidden: true });
        var filteredData = data.filter((row) =>
            Object.values(row).some((cellValue) => cellValue !== '' && cellValue !== null && cellValue !== undefined)
        );
        return filteredData;
    }),

    fncImportDataTypeXLSonFirstSheet: asyncHandler(async (req, res, next) => {
        if (req.file === undefined) {
            return res.status(400).send('Please upload an excel file!');
        }

        // let path = `${appRootPath}/public/assets/uploads/` + req.file.filename;
        let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;
        // @ts-ignore
        const importXLS = await xlsx.readFile(path);
        const sheet_name_list = importXLS.SheetNames;
        var data = xlsx.utils.sheet_to_json(importXLS.Sheets[sheet_name_list[0]]);

        return data;
    }),
    fncImportDataTypeXLSonSecondSheet: asyncHandler(async (req, res, next) => {
        if (req.file === undefined) {
            return res.status(400).send('Please upload an excel file!');
        }

        // let path = `${appRootPath}/public/assets/uploads/` + req.file.filename;
        let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;
        // @ts-ignore
        const importXLS = await xlsx.readFile(path);
        const sheet_name_list = importXLS.SheetNames;
        var data = xlsx.utils.sheet_to_json(importXLS.Sheets[sheet_name_list[1]]);

        return data;
    }),
};
