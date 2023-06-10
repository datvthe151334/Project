const { Op, QueryTypes } = require('sequelize');
// @ts-ignore
const { BadgeLevel, Badge, Department, sequelize,RuleDefinition } = require('../models');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/error-response');
const getAccountFromToken = require('../utils/account-token');
class BadgeLevelService {
    async fncFindOne(req) {
        const { id } = req.params;

        return BadgeLevel.findOne({
            where: { ID: id },
            include: [
                {
                    model: Badge,
                },
            ],
        });
    }

    async fncCreateOne(req, res, next) {
        const { BadgeID, Name, Description, DepartmentID, ImageURL, LevelNumber, ConversionRate } = req.body;
        if(BadgeID == undefined || Name == undefined || Description == undefined || DepartmentID == undefined || LevelNumber == undefined || ConversionRate == undefined ){
            return next(new ErrorResponse(404, 'Data not enough'));
        }
        const foundBadgeLevel = await BadgeLevel.findOne({
            where: { BadgeID: BadgeID, LevelNumber: LevelNumber, DepartmentID: DepartmentID  },
            
        });
        if(foundBadgeLevel){
            return next(new ErrorResponse(404, 'Badge level is exist'));
        }
        
        if(!req.file && !ImageURL){
            return next(new ErrorResponse(404, 'Badge must have Image'));

        }
        return BadgeLevel.create({
            CreatedBy: getAccountFromToken(req),
            BadgeID: BadgeID,
            Name: Name,
            Description: Description,
            DepartmentID: DepartmentID,
            ImageURL: !req.file ? ImageURL : `/public/badge/${req.file.filename}`,
            LevelNumber: LevelNumber,
            ConversionRate: ConversionRate,
        });
    }

    async fncFindAll(req) {
        const { DepartmentID, BadgeID } = req.query;

        const getLevelBadges = await BadgeLevel.findAndCountAll({
            where: {
                DepartmentID: DepartmentID,
                BadgeID: BadgeID,
            },
            order: [['LevelNumber', 'DESC']],
        });
        return getLevelBadges;
    }

    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const { DepartmentID } = req.query;
        const { Name, Description, ConversionRate, LevelNumber, Status, ImageURL } = req.body;

        const found = await BadgeLevel.findOne({ where: { ID: id } });

        if (!found) return next(new ErrorResponse(404, 'BadgeLevel not found'));

        return BadgeLevel.update(
            {
                Name: Name,
                Description: Description,
                DepartmentID: DepartmentID,
                Status: Status,
                ImageURL: !req.file ? ImageURL : `/public/badge/${req.file.filename}`,
                ConversionRate: ConversionRate,
                LevelNumber: LevelNumber,
                UpdatedBy: getAccountFromToken(req),
            },
            {
                where: { ID: id },
            }
        );
    }

    async fncDeleteOne(req, next) {
        const { DepartmentID, id } = req.query;

        const found = await BadgeLevel.findOne({ where: { ID: id } });

        if (!found) return next(new ErrorResponse(404, 'BadgeLevel not found'));

        return BadgeLevel.update(
            { Status: 2 },
            {
                where: {
                    ID: id,
                    DepartmentID: DepartmentID,
                },
            }
        );
    }
}

module.exports = new BadgeLevelService();
