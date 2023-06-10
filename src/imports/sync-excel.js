const appRootPath = require('app-root-path');
const readXlsxFile = require('read-excel-file/node');
const asyncHandler = require('../utils/async-handler');
const XLSX = require('xlsx');
const { number } = require('joi');
const { split } = require('lodash');
const { Template } = require('../models');
module.exports = asyncHandler(async (req, res, next) => {
    if (req.file === undefined) {
        return res.status(400).send('Please upload an excel file!');
    }

    let { RuleDefinitionID, TemplateID, Sheet } = req.body;
    let tmpSheet = 0;
    Sheet = Sheet - 1;
    if (Sheet !== undefined) {
        tmpSheet = Sheet;
    }
    if (TemplateID !== null && TemplateID !== undefined) {
        const findTemplate = await Template.findOne({
            where: {
                ID: TemplateID,
            },
        });
        tmpSheet = findTemplate.DataSampleRow;
    }
    // let path = `${appRootPath}/public/assets/uploads/` + req.file.filename;
    let path = `/var/www/akarank_test/BE/public/assets/uploads/` + req.file.filename;

    // @ts-ignore
    var workbook = XLSX.readFile(path);
    const sheet_name_list = workbook.SheetNames;
    var data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[tmpSheet]]);
    const countCol = XLSX.utils
        .sheet_to_csv(workbook.Sheets[sheet_name_list[tmpSheet]])
        .replaceAll(' \n', '')
        .replaceAll(' \r', '')
        .split('\n')[0]
        .split(',').length;
    let count = 0;
    let ExcelArray = [];
    let tmpArray = [];
    let stringList = [];
    let stringFromExcel = XLSX.utils.sheet_to_csv(workbook.Sheets[sheet_name_list[tmpSheet]]);
    // for (let cell in worksheet) {
    // count++;
    // if (worksheet[cell].v !== undefined);
    // tmpArray[tmpArray.length] = worksheet[cell].v;
    // if (tmpArray.length == countCol + 1) {
    //     ExcelArray[ExcelArray.length] = tmpArray;
    //     tmpArray = [];
    // }
    // }
    for (let index = 0; index < stringFromExcel.length; index++) {
        if (stringFromExcel.charAt(index) == '"') stringList.push(index);
    }
    for (let index = 0; index < stringList.length; index = index + 2) {
        let test = '';
        let tmpArray = stringFromExcel
            .substring(stringList[index], stringList[index + 1] + 1)
            .replaceAll(',', '|')
            .replaceAll('\n', '|');

        if (index > 0) {
            test = stringFromExcel.substring(stringList[index - 1] + 1, stringList[index]);
            stringFromExcel =
                stringFromExcel.substring(0, stringList[index]) +
                tmpArray +
                stringFromExcel.substring(stringList[index + 1] + 1, stringFromExcel.length);
        } else {
            test = stringFromExcel.substring(0, stringList[index]);
            stringFromExcel =
                stringFromExcel.substring(0, stringList[index]) +
                tmpArray +
                stringFromExcel.substring(stringList[index + 1] + 1, stringFromExcel.length);
        }
    }

    let listExcel = stringFromExcel.replace(',\n', ',,').replaceAll(/\s\n/g, '').replaceAll(/\s\r/g, '').replaceAll('\n', ',').split(',');
    listExcel.forEach((element) => {
        count++;
        element.replaceAll('|', ',');
        if (element !== undefined) {
            if (isNumeric(element)) tmpArray[tmpArray.length] = parseFloat(element);
            else {
                tmpArray[tmpArray.length] = isDate(element);
            }
        }
        // if (ExcelArray.length == 0) {
        //     if (tmpArray.length == countCol) {
        //         ExcelArray[ExcelArray.length] = tmpArray;
        //         tmpArray = [];
        //     }
        // } else if (tmpArray.length == countCol + 1) {
        //     ExcelArray[ExcelArray.length] = tmpArray;
        //     tmpArray = [];
        // }
        if (tmpArray.length == countCol) {
            ExcelArray[ExcelArray.length] = tmpArray;
            tmpArray = [];
        }
        // if (count == 150) console.log(ExcelArray);
    });
    // skip header
    // if(importExcel.)
    //await importExcel.shift();
    // if (HeaderLine !== undefined)
    //     if (importExcel[HeaderLine] !== undefined) {
    //         if (importExcel.length > 1) {
    //             return importExcel;
    //         }
    //     }

    return ExcelArray;
});
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function isDate(value) {
    if (/^(\d+|(\.\d+))(\.\d+)?%$/.test(value)) return value;
    if (value.startsWith('https') || value.startsWith('http')) return value;
    if (isNumeric(value)) return value;
    let x = value.split('-');
    let countNum = 0;
    x.forEach((element) => {
        let checkElement = parseInt(element);
        if (isNaN(checkElement)) countNum++;
    });
    if (countNum > 1) return value;
    var date2 = Date.parse(value.replaceAll(' ', ''));
    if (new Date(date2).toString() != 'Invalid Date') {
        return new Date(date2);
    }

    return value;
}
