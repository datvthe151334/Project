const { Op, QueryTypes } = require('sequelize');
// @ts-ignore
const { Badge, BadgeLevel, Department, sequelize, RuleDefinition, Schedule } = require('../models');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/error-response');
const getAccountFromToken = require('../utils/account-token');

class BadgeService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Badge.findOne({
            where: { ID: id },
            include: [
                {
                    model: Department,
                },
                {
                    model: RuleDefinition,
                },
                {
                    model: BadgeLevel,
                },
                {
                    model: Schedule,
                },
            ],
        });
    }

    async fncCreateOne(req) {
        const { Name, Description, DepartmentID, ImageURL, AwardType, Condition, RuleID } = req.body;
        if (req.body.AwardType == 'auto') {
            const result = await Badge.create({
                CreatedBy: getAccountFromToken(req),
                Name: Name,
                Description: Description,
                DepartmentID: DepartmentID,
                AwardType: AwardType,
                Condition: Condition,
                RuleDefintionID: RuleID,
                ImageURL: !req.file ? ImageURL : `/public/badge/${req.file.filename}`,
            });
            if (!result) return 'nothing';
            const updateBadgeInRule = await RuleDefinition.update({ BadgeID: result.ID }, { where: { ID: RuleID } });
            if (!updateBadgeInRule) return 'Rule has BadgeID';
            return result;
        } else if (req.body.AwardType == 'manual') {
            return Badge.create({
                CreatedBy: getAccountFromToken(req),
                Name: Name,
                Description: Description,
                DepartmentID: DepartmentID,
                AwardType: AwardType,
                ImageURL: !req.file ? ImageURL : `/public/badge/${req.file.filename}`,
            });
        }
    }

    async fncFindAll(req) {
        const { DepartmentID } = req.query;

        const queries = queryParams(
            req.query,
            Op,
            //
            ['Name', 'Description', 'DepartmentID'],
            ['Name', 'UpdatedBy', 'CreatedBy', 'Status', 'CreatedDate', 'UpdatedDate']
        );

        return Badge.findAndCountAll({
            order: queries.order,
            where: {
                [Op.and]: [
                    queries.searchOr,
                    {
                        DepartmentID: DepartmentID,
                    },
                ],
            },
            include: [
                {
                    model: Department,
                },
            ],
            distinct: true,
            limit: queries.limit,
            offset: queries.offset,
        });
    }

    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const { Name, Description, DepartmentID, Status, ImageURL, RuleID, Condition, AwardType } = req.body;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Badge not found'));
        if (!AwardType && Status) {
            return Badge.update(
                {
                    Status: Status,
                },
                {
                    where: { ID: id },
                }
            );
        }
        if (found.AwardType == 'auto') {
            if (RuleID != found.RuleDefintionID) {
                if (AwardType == 'manual') {
                    const deleteBadgeIDInRule = await RuleDefinition.update({ BadgeID: null }, { where: { ID: found.RuleDefintionID } });
                }
                if (AwardType == 'auto') {
                    const result = await Badge.update(
                        {
                            Name: Name,
                            Description: Description,
                            DepartmentID: DepartmentID,
                            Status: Status,
                            RuleDefintionID: RuleID,
                            Condition: Condition,
                            AwardType: AwardType,
                            ImageURL: !req.file ? (ImageURL ? ImageURL : found.ImageURL) : `/public/badge/${req.file.filename}`,
                            UpdatedBy: `${req.authInfo.preferred_username.split('@')[0]}`,
                        },
                        {
                            where: { ID: id },
                        }
                    );

                    const updateNewBadgeIDInRule = await RuleDefinition.update({ BadgeID: id }, { where: { ID: RuleID } });
                    return result;
                }
                if (AwardType == 'manual') {
                    const result = await Badge.update(
                        {
                            Name: Name,
                            Description: Description,
                            DepartmentID: DepartmentID,
                            Status: Status,
                            RuleDefintionID: null,
                            Condition: null,
                            AwardType: AwardType,
                            ImageURL: !req.file ? (ImageURL ? ImageURL : found.ImageURL) : `/public/badge/${req.file.filename}`,
                            UpdatedBy: `${req.authInfo.preferred_username.split('@')[0]}`,
                        },
                        {
                            where: { ID: id },
                        }
                    );

                    return result;
                }
            }
            const result = await Badge.update(
                {
                    Name: Name,
                    Description: Description,
                    DepartmentID: DepartmentID,
                    Status: Status,
                    RuleDefintionID: RuleID,
                    Condition: Condition,
                    AwardType: AwardType,
                    ImageURL: !req.file ? (ImageURL ? ImageURL : found.ImageURL) : `/public/badge/${req.file.filename}`,
                    UpdatedBy: `${req.authInfo.preferred_username.split('@')[0]}`,
                },
                {
                    where: { ID: id },
                }
            );
            return result;
        } else if (found.AwardType == 'manual') {
            if (AwardType == 'manual')
                return Badge.update(
                    {
                        Name: Name,
                        Description: Description,
                        DepartmentID: DepartmentID,
                        Status: Status,
                        AwardType: AwardType,
                        ImageURL: !req.file ? (ImageURL ? ImageURL : found.ImageURL) : `/public/badge/${req.file.filename}`,
                        UpdatedBy: `${req.authInfo.preferred_username.split('@')[0]}`,
                    },
                    {
                        where: { ID: id },
                    }
                );
            if (AwardType == 'auto') {
                const updateNewBadgeIDInRule = await RuleDefinition.update({ BadgeID: id }, { where: { ID: RuleID } });

                return Badge.update(
                    {
                        Name: Name,
                        Description: Description,
                        DepartmentID: DepartmentID,
                        Status: Status,
                        Condition: Condition,
                        RuleDefintionID: RuleID,
                        AwardType: AwardType,
                        ImageURL: !req.file ? (ImageURL ? ImageURL : found.ImageURL) : `/public/badge/${req.file.filename}`,
                        UpdatedBy: `${req.authInfo.preferred_username.split('@')[0]}`,
                    },
                    {
                        where: { ID: id },
                    }
                );
            }
        }
    }
    // async fncUpdateOne(req, next) {
    //     const { id } = req.params;
    //     const { Name, Description, DepartmentID, Status, ImageURL } = req.body;

    //     const found = await this.fncFindOne(req);

    //     if (!found) return next(new ErrorResponse(404, 'Badge not found'));

    //     return Badge.update(
    //         {
    //             Name: Name,
    //             Description: Description,
    //             DepartmentID: DepartmentID,
    //             Status: Status,
    //             ImageURL: !req.file ? ImageURL : `/public/badge/${req.file.filename}`,
    //             UpdatedBy: `${req.authInfo.preferred_username.split('@')[0]}`,
    //         },
    //         {
    //             where: { ID: id },
    //         }
    //     );
    // }
    async fncUpdateOneAndSchedule(req, next) {
        const { id } = req.params;
        const { Name, Description, DepartmentID, Status, ImageURL, date } = req.body;

        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Badge not found'));
        const checkSchedule = await Schedule.findOne({ where: { BadgeID: id } });
        if (!checkSchedule) return next(new ErrorResponse(404, 'Not Found Schedule'));
        if (checkSchedule.Status == 1) {
            const updateSchedule = await Schedule.update({ Status: 2 }, { where: { BadgeID: id } });
        } else if (checkSchedule.Status == 2) {
            const updateSchedule = await Schedule.update({ Status: 1 }, { where: { BadgeID: id } });
        }

        return Badge.update(
            {
                Name: Name,
                Description: Description,
                DepartmentID: DepartmentID,
                Status: Status,
                ImageURL: !req.file ? ImageURL : `/public/badge/${req.file.filename}`,
                UpdatedBy: getAccountFromToken(req),
            },
            {
                where: { ID: id },
            }
        );
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;
        const { DepartmentID } = req.query;

        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Badge not found'));

        return Badge.update(
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

module.exports = new BadgeService();
