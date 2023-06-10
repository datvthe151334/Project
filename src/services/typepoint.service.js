const { Op, where } = require('sequelize');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/error-response');
const moment = require('moment');
const schedule = require('node-schedule');
// @ts-ignore
const { MoocCampaign, Campaign, UserMoocCampaign, UserCampaign, Setting, UserWallet, UserMaster, sequelize } = require('../models');
const getAccountFromToken = require('../utils/account-token');
class MoocCampaignService {
    async fncFindOne(req) {
        const { id } = req.params;

        return MoocCampaign.findOne({
            where: { ID: id },
            include: [
                {
                    model: Campaign,
                },
            ],
        });
    }

    async fncCreateOne(req) {
        const { StartDate, EndDate } = req.body;
        const create = await MoocCampaign.create({
            ...req.body,
            CreatedBy: getAccountFromToken(req),
        });
        return create;
        // const startDateCamp = moment(StartDate).format();
        // const EndDateCamp = moment(EndDate).format();

        // if (startDateCamp) {
        //     const updateCamp = await MoocCampaign.update({ Status: 2 }, { where: { ID: create.ID } });
        // }
        // const listUser = await UserMoocCampaign.findAll({
        //     where: { MoocCampaignID: create.ID, Status: 5 },
        //     raw: true,
        //     order: [['UpdatedDate', 'ASC']],
        // });
        // if (EndDateCamp) {
        //     const updateCamp = await MoocCampaign.update({ Status: 3 }, { where: { ID: create.ID } });
        //     // console.log(EndDateCamp);

        //     if (updateCamp) {
        //         const listUser = await UserMoocCampaign.findAll({ where: { CampaignID: create.ID, Status: 5 }, order: UpdatedDate, raw: true });
        //         let budget = create.Budget;

        //         for await (let el of listUser) {
        //             const campaign = await Campaign.findOne({
        //                 where: { ID: create.CampaignID },
        //             });
        //             const setting = await Setting.findOne({
        //                 where: { DepartmentID: campaign.DepartmentID },
        //             });
        //             const user = await UserMaster.findOne({
        //                 where: { ID: el.UserMasterID },
        //             });
        //             if (setting && setting.ConversionRatio) {
        //                 if (setting.AllowMinus === 1) {
        //                     const bonusCoinJoinner = await UserWallet.create({
        //                         CoinNumber: create.CoinNumber === null ? 0 : create.CoinNumber,
        //                         TransactionType: 3,
        //                         UserReceive: el.UserMasterID,
        //                         DepartmentID: campaign.DepartmentID,
        //                         Message: `Bonus ${create.CoinNumber} coin from mooc of Campaign(${campaign.Name})`,
        //                     });

        //                     if (bonusCoinJoinner && budget >= create.CoinNumber) {
        //                         await UserMaster.update({ TotalCoin: create.CoinNumber + user.TotalCoin }, { where: { ID: user.ID } });
        //                         budget = budget - create.CoinNumber;
        //                     }
        //                 } else {
        //                     const bonusCoinJoinner = await UserWallet.create({
        //                         CoinNumber: create.CoinNumber === null ? 0 : create.CoinNumber,
        //                         TransactionType: 3,
        //                         UserReceive: el.UserMasterID,
        //                         DepartmentID: campaign.campaign,
        //                         Message: `Bonus ${create.CoinNumber} coin from Campaign(${campaign.Name})`,
        //                     });
        //                     if (+campaign.CoinNumber >= 0) {
        //                         if (bonusCoinJoinner && budget > create.CoinNumber) {
        //                             await UserMaster.update({ TotalCoin: create.CoinNumber + user.TotalCoin }, { where: { ID: user.ID } });
        //                         }
        //                         budget = budget - create.CoinNumber;
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
    }

    async fncFindAll(req) {
        const queries = queryParams(
            req.query,
            Op,
            //
            [''],
            ['CampaignID', 'StartDate', 'EndDate', 'UpdatedBy', 'CreatedBy', 'Status', 'CreatedDate', 'UpdatedDate']
        );

        return MoocCampaign.findAndCountAll({
            order: [['StartDate', 'ASC']],
            where: queries.searchOr,
            include: [
                {
                    model: Campaign,
                },
            ],
            distinct: true,
            limit: queries.limit,
            offset: queries.offset,
        });
    }

    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Mooc campaign not found'));

        const update = MoocCampaign.update(
            {
                ...req.body,
                UpdatedBy: getAccountFromToken(req),
            },
            {
                where: { ID: id },
            }
        );

        return update;
    }

    async fncUpdateList(req, next) {
        const { CampaignID } = req.query;
        const { moocCampaign } = req.body;

        const t = await sequelize.transaction();
        try {
            await MoocCampaign.destroy(
                {
                    where: { CampaignID: CampaignID },
                },
                { transaction: t }
            );

            for await (let element of moocCampaign) {
                const create = await MoocCampaign.create({
                    CampaignID: CampaignID,
                    StartDate: element.StartDate,
                    EndDate: element.EndDate,
                    Budget: element.Budget ?? 0,
                    CoinNumber: element.CoinNumber ?? 0,
                    CreatedBy: getAccountFromToken(req),
                });

                if (create) {
                    const startDateCamp = moment(element.StartDate).format();
                    const EndDateCamp = moment(element.EndDate).format();

                    const jobStartMoocCamp = schedule.scheduleJob(startDateCamp, async function () {
                        const updateCamp = await MoocCampaign.update({ Status: 2 }, { where: { ID: create.ID } });
                    });

                    const jobEndMoocCamp = schedule.scheduleJob(EndDateCamp, async function () {
                        const updateCamp = await MoocCampaign.update({ Status: 3 }, { where: { ID: create.ID } });

                        if (updateCamp) {
                            const listUser = await UserMoocCampaign.findAll({
                                where: { CampaignID: create.ID, Status: 5 },
                                raw: true,
                                order: [['UpdatedDate', 'ASC']],
                            });
                            let budget = create.Budget;

                            for await (let el of listUser) {
                                const campaign = await Campaign.findOne({
                                    where: { ID: create.CampaignID },
                                });
                                const setting = await Setting.findOne({
                                    where: { DepartmentID: campaign.DepartmentID },
                                });
                                const user = await UserMaster.findOne({
                                    where: { ID: el.UserMasterID },
                                });
                                if (setting && setting.ConversionRatio) {
                                    if (setting.AllowMinus === 1) {
                                        const bonusCoinJoinner = await UserWallet.create({
                                            CoinNumber: create.CoinNumber === null ? 0 : create.CoinNumber,
                                            TransactionType: 3,
                                            UserReceive: el.UserMasterID,
                                            DepartmentID: campaign.DepartmentID,
                                            Message: `Bonus ${create.CoinNumber} coin from mooc of Campaign(${campaign.Name})`,
                                        });

                                        if (bonusCoinJoinner && budget >= create.CoinNumber) {
                                            await UserMaster.update({ TotalCoin: create.CoinNumber + user.TotalCoin }, { where: { ID: user.ID } });
                                            budget = budget - create.CoinNumber;
                                        }
                                    } else {
                                        const bonusCoinJoinner = await UserWallet.create({
                                            CoinNumber: create.CoinNumber === null ? 0 : create.CoinNumber,
                                            TransactionType: 3,
                                            UserReceive: el.UserMasterID,
                                            DepartmentID: campaign.campaign,
                                            Message: `Bonus ${create.CoinNumber} coin from Campaign(${campaign.Name})`,
                                        });
                                        if (+campaign.CoinNumber >= 0) {
                                            if (bonusCoinJoinner && budget > create.CoinNumber) {
                                                await UserMaster.update(
                                                    { TotalCoin: create.CoinNumber + user.TotalCoin },
                                                    { where: { ID: user.ID } }
                                                );
                                            }
                                            budget = budget - create.CoinNumber;
                                        }
                                    }
                                }
                            }
                        }

                        // jobEndMoocCamp.cancel();
                        // jobStartMoocCamp.cancel();
                    });
                }
            }

            await t.commit();

            const listMoocCamp = await MoocCampaign.findAll({ where: { CampaignID: CampaignID }, raw: true });
            const listUser = await UserCampaign.findAll({ where: { CampaignID: CampaignID }, raw: true });

            for await (let mooc of listMoocCamp) {
                for await (let user of listUser) {
                    UserMoocCampaign.create({
                        UserMasterID: user.UserMasterID,
                        MoocCampaignID: mooc.ID,
                        Confirmer: user.Confirmer,
                        Status: 1,
                    });
                }
            }
            return 1;
        } catch (err) {
            await t.rollback();
            return next(new ErrorResponse(400, err.message));
        }
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Mooc campaign not found'));

        return MoocCampaign.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }
}

module.exports = new MoocCampaignService();
