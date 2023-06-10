const Excel = require('exceljs');
const asyncHandler = require('../utils/async-handler');
const queryParams = require('../utils/query-params');
const { Op, QueryTypes } = require('sequelize');

// @ts-ignore
const { ShopHistory } = require('../models');
const { Product, UserMaster } = require('../models');
const shophistory = require('../validations/shophistory');

module.exports = asyncHandler(async (req, res, next) => {
    try {
        const workbook = new Excel.Workbook();
        const allShopHistory = await ShopHistory.findAll({
          
          include: [
            { model: UserMaster, as: 'buyer', attributes: ['DisplayName'] },
            { model: Product, attributes: ['Name'] },
            { model: UserMaster, as: 'saler', attributes: ['DisplayName'] },
          ],
          raw:true
        });
        if (allShopHistory.length !== 0) {
            allShopHistory.forEach((element) => {
                if (element.Status === 1) element.Status = 'Active';
                else if (element.Status === 2) element.Status = 'Inactive';
            });
        }

        // create sheet
        const historyList = workbook.addWorksheet('ShopHistory_list');
        // create sheet header
        const headerStyle = {
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'ff3271a8' }, // Change to desired color code
            },
            font: {
                name: 'Times New Roman',
                size: 11,
                bold: true,
                color: { argb: 'FFFFFF' },
                // Set any other font properties as needed
            },

            border: {
                bottom: { style: 'thin' },
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            },
            alignment: {
                horizontal: 'center',
            },
        };
        // create sheet header
        historyList.columns = [
            { header: 'Buyer', key: 'buyer.DisplayName', width: 30 },
            { header: 'Saler', key: 'saler.DisplayName', width: 30 },
            { header: 'Message', key: 'Message', width: 74 },
            { header: 'product Name', key: 'Product.Name', width: 30 },
            { header: 'Total Coin', key: 'TotalCoin', width: 6 },
            { header: 'Status', key: 'Status', width: 8 },
        ];

        historyList.getRow(1).eachCell((cell) => { // hàng 1 định nghĩa ra style
            cell.style = headerStyle;
        });

        // fill in data for each sheet
        historyList.addRows(allShopHistory);
        const columnA = historyList.getColumn('A');
        columnA.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= historyList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnB = historyList.getColumn('B');
        columnB.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= historyList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnC = historyList.getColumn('C');
        columnC.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= historyList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnD = historyList.getColumn('D');
        columnD.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= historyList.rowCount) {
                cell.alignment = { horizontal: 'left' };
            }
        });

        const columnE = historyList.getColumn('E');
        columnE.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= historyList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        const columnG = historyList.getColumn('G');
        columnG.eachCell((cell, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= historyList.rowCount) {
                cell.alignment = { horizontal: 'center' };
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'RuleDefinition-excel.xlsx');

        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (err) {
        console.log('error: ' + err);
    }
});
