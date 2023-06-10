const Joi = require('joi');
const _ = require('lodash');
const { Op } = require('sequelize');
const schedule = require('node-schedule');
// @ts-ignore
const {
    Campaign,
    Department,
    MoocCampaign,
    UserCampaign,
    GroupCampaign,
    Group,
    UserMaster,
    ProjectMembers,
    Project,
    UserWallet,
    Setting,
    sequelize,
} = require('../models');
const ErrorResponse = require('../libs/error-response');
const queryParams = require('../utils/query-params');
const moment = require('moment');
const getAccountFromToken = require('../utils/account-token');
class CampaignService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Campaign.findOne({
            where: { ID: id },
            include: [
                {
                    model: MoocCampaign,
                },
                {
                    model: Group,
                },
                {
                    model: UserMaster,
                },
                {
                    model: Project,
                },
            ],
            order: [[MoocCampaign, 'StartDate', 'ASC']],
        });
    }

    async fncCreateOne(req, next) {
        const { CampaignData, GroupCampaignData, UserCampaignData } = req.body;
        const { DepartmentID } = req.query;

        const t = await sequelize.transaction();
        try {
            let validateInputData;
            let coinNumber;
            // @ts-ignore
            // if (CampaignData.Budget > 0) coinNumber = Number.parseInt(CampaignData.Budget / CampaignData.MaximumReceiver);
            // else if (CampaignData.Budget === 0) if (!CampaignData.coinNumber) return next(new ErrorResponse(400, `missing property coinNumber`));

            const campData = {
                Name: CampaignData.Name,
                ImageURL: CampaignData.ImageURL,
                Description: CampaignData.Description,
                Budget: CampaignData.Budget,
                MaximumReceiver: CampaignData.MaximumReceiver,
                Confirmer: CampaignData.Confirmer,
                CoinNumber: CampaignData.CoinNumber,
                StartDate: CampaignData.StartDate,
                EndDate: CampaignData.EndDate,
                Deadline: CampaignData.Deadline,
                DepartmentID: DepartmentID,
                Status: 1,
                CreatedBy: getAccountFromToken(req),
            };

            // validateInputData = await Joi.object({
            //     Name: Joi.string().required().min(3).max(200).not('').messages({
            //         'string.base': `Name should be a text`,
            //         'string.min': `Name should have a minimum length of {#limit}`,
            //         'string.max': `Name should have a maximum length of {#limit}`,
            //         'any.required': `Name can not be empty`,
            //     }),
            //     ImageURL: Joi.string().required().not('').messages({
            //         'any.required': `ImageURL can not be empty`,
            //     }),
            //     Description: Joi.string().required().not('').messages({
            //         'string.base': `Description should be a text`,
            //         'any.required': `Description can not be empty`,
            //     }),
            //     StartDate: Joi.date().required().not('').messages({
            //         'any.required': `StartDate can not be empty`,
            //     }),
            //     EndDate: Joi.date().required().not('').greater(Joi.ref('StartDate')).messages({
            //         'date.base': `EndDate must be date`,
            //         'any.required': `EndDate can not be empty`,
            //         'date.greater': `EndDate cannot be less than StartDate`,
            //     }),
            //     Deadline: Joi.date().required().not('').greater(Joi.ref('StartDate')).less(Joi.ref('EndDate')).messages({
            //         'date.base': `Deadline must be date`,
            //         'any.required': `Deadline can not be empty`,
            //         'date.greater': `Deadline must be greater than StartDate`,
            //         'date.less': `Deadline must be less than EndDate`,
            //     }),
            // })
            //     .validateAsync(campData, { abortEarly: false })
            //     // display error into array
            //     .catch((err) => next(new ErrorResponse(400, err.message.split('.'))));

            // //* if not pass validate, stop (Joi will return the valid object after validate, so that need to compare that with input data object)
            // if (!_.isEqual(campData, validateInputData)) {
            //     console.log(validateInputData);
            //     console.log(campData);
            //     return;}

            const startDateCamp = moment(CampaignData.StartDate).format();
            const deadLineCamp = moment(CampaignData.Deadline).format();
            const endDateCamp = moment(CampaignData.EndDate).format();

            if (!CampaignData.ProjectID) {
                //Create Campaign
                const createCampaign = await Campaign.create({ ...campData }, { transaction: t });

                //Create GroupCampaign
                let groupCampData = [];
                for await (let element of GroupCampaignData) {
                    const findGroup = await Group.findOne({ where: { ID: element } });
                    if (!findGroup) return next(new ErrorResponse(400, `GroupID ${element} cannot found`));

                    const groupCamp = {
                        CampaignID: createCampaign.ID,
                        GroupID: element,
                    };
                    groupCampData.push(groupCamp);
                }
                const createGroupCampaign = await GroupCampaign.bulkCreate(groupCampData, { transaction: t });

                //Create UserCampaign
                let userCampData = [];
                for await (let element of UserCampaignData) {
                    const findUser = await UserMaster.findOne({ where: { ID: element } });

                    if (!findUser) return next(new ErrorResponse(400, `User ${findUser.Account} cannot found`));
                    if (findUser.Status !== 1) return next(new ErrorResponse(400, `UserID ${findUser.Account} is not active`));
                    const userCamp = {
                        CampaignID: createCampaign.ID,
                        UserMasterID: element,
                        Status: 1,
                    };
                    userCampData.push(userCamp);
                }
                const createUserCampaign = await UserCampaign.bulkCreate(userCampData, { transaction: t });

                // Automative job
                if (createCampaign && createGroupCampaign && createUserCampaign) {
                    /**
                     * At this StartDate Campaign, Campaign -> Start.
                     */
                    const jobStartCamp = schedule.scheduleJob(startDateCamp, async function () {
                        // update Campaign: Pending -> On-going
                        const updateCamp = await Campaign.update({ Status: 2 }, { where: { ID: createCampaign.ID } });

                        //Logic Start_Campaign
                    });

                    /**
                     * At this Deadline Campaign, ...
                     */
                    const jobDeadline = schedule.scheduleJob(deadLineCamp, async function () {
                        //Logic DeadLine_Camp
                        //Send warning
                    });

                    /**
                     * At this EndDate Campaign , Campaign -> End.
                     */
                    const jobEndCamp = schedule.scheduleJob(endDateCamp, async function () {
                        //update Campaign: On-going -> End
                        const updateCamp = await Campaign.update({ Status: 3 }, { where: { ID: createCampaign.ID } });

                        //Logic endDateCamp

                        if (updateCamp) {
                            const reciever = createCampaign.MaximumReceiver;
                            let i = 0;
                            const listUser = await UserCampaign.findAll({
                                where: { CampaignID: createCampaign.ID, Status: 5 },
                                raw: true,
                                order: [['UpdatedDate', 'ASC']],
                            });
                            let budget = createCampaign.Budget;

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
                                            CoinNumber: createCampaign.CoinNumber === null ? 0 : createCampaign.CoinNumber,
                                            TransactionType: 3,
                                            UserReceive: el.UserMasterID,
                                            DepartmentID: campaign.DepartmentID,
                                            Message: `Bonus ${createCampaign.CoinNumber} coin from mooc of Campaign(${campaign.Name})`,
                                        });

                                        if (bonusCoinJoinner && budget >= createCampaign.CoinNumber && i <= reciever) {
                                            await UserMaster.update(
                                                { TotalCoin: createCampaign.CoinNumber + user.TotalCoin },
                                                { where: { ID: user.ID } }
                                            );
                                            budget = budget - createCampaign.CoinNumber;
                                            i++;
                                        }
                                    } else {
                                        const bonusCoinJoinner = await UserWallet.create({
                                            CoinNumber: createCampaign.CoinNumber === null ? 0 : createCampaign.CoinNumber,
                                            TransactionType: 3,
                                            UserReceive: el.UserMasterID,
                                            DepartmentID: campaign.campaign,
                                            Message: `Bonus ${createCampaign.CoinNumber} coin from Campaign(${campaign.Name})`,
                                        });
                                        if (+campaign.CoinNumber >= 0) {
                                            if (bonusCoinJoinner && budget > createCampaign.CoinNumber && i <= reciever) {
                                                await UserMaster.update(
                                                    { TotalCoin: createCampaign.CoinNumber + user.TotalCoin },
                                                    { where: { ID: user.ID } }
                                                );
                                            }
                                            budget = budget - createCampaign.CoinNumber;
                                            i++;
                                        }
                                    }
                                }
                            }
                        }

                        //Send warning

                        // Stop AutoJob
                        // jobStartCamp.cancel();
                        // jobDeadline.cancel();
                        // jobEndCamp.cancel();
                    });
                }
                await t.commit();
                return Campaign.findOne({
                    where: { ID: createCampaign.ID },
                    include: { model: UserMaster },
                });
            } else {
                //Without ProjectID

                //Create Campaign
                const createCampaign = await Campaign.create(
                    {
                        ...campData,
                        ProjectID: CampaignData.ProjectID,
                    },
                    { transaction: t }
                );

                //Create UserCampaign
                const findMember = await ProjectMembers.findAll({ where: { ProjectID: CampaignData.ProjectID } });
                let userCampData = [];
                for await (let element of findMember) {
                    const found = await UserMaster.findOne({
                        where: { ID: element.MemberID },
                    });

                    if (found.Status !== 1) return next(new ErrorResponse(400, `User ${found.Account} is not active`));
                    const userCamp = {
                        CampaignID: createCampaign.ID,
                        UserMasterID: element.MemberID,
                        Status: 1,
                    };
                    userCampData.push(userCamp);
                }
                const createUserCampaign = await UserCampaign.bulkCreate(userCampData, { transaction: t });

                // Automative job
                if (createCampaign && createUserCampaign) {
                    /**
                     * At this StartDate Campaign, Campaign -> Start.
                     */
                    const jobStartCamp = schedule.scheduleJob(startDateCamp, async function () {
                        // update Campaign: Pending -> On-going
                        const updateCamp = await Campaign.update({ Status: 2 }, { where: { ID: createCampaign.ID } });

                        //Logic Start_Campaign
                    });

                    /**
                     * At this Deadline Campaign, ...
                     */
                    const jobDeadline = schedule.scheduleJob(deadLineCamp, async function () {
                        //Logic DeadLine_Camp
                        //Send warning
                    });

                    /**
                     * At this EndDate Campaign , Campaign -> End.
                     */
                    const jobEndCamp = schedule.scheduleJob(endDateCamp, async function () {
                        //update Campaign: On-going -> End

                        const updateCamp = await Campaign.update({ Status: 3 }, { where: { ID: createCampaign.ID } });

                        //Logic endDateCamp

                        if (updateCamp) {
                            const c = await Campaign.findOne({
                                where: { ID: createCampaign.ID },
                            });
                            const uc = await UserCampaign.findAll({ having: { CampaignID: c.ID, Status: 5 }, order: [['UpdatedDate', 'ASC']] });
                            const maxReceive = c.MaximumReceiver;
                            var i = 0;
                            var budget = c.Budget;
                            for await (let element of uc) {
                                const uid = element.UserMasterID;
                                if (i <= maxReceive) {
                                    if (budget >= c.CoinNumber) {
                                        budget = budget - c.CoinNumber;
                                        const departmentID = c.DepartmentID;
                                        const setting = await Setting.findOne({ where: { DepartmentID: departmentID } });
                                        if (setting.AllowMinus === 1) {
                                            const bonusCoinJoinner = await UserWallet.create({
                                                CoinNumber: c.CoinNumber === null ? 0 : c.CoinNumber,
                                                TransactionType: 3,
                                                UserReceive: element.UserMasterID,
                                                DepartmentID: c.DepartmentID,
                                                Message: `Bonus ${c.CoinNumber} coin from Mooc of Campaign(${c.Name})`,
                                            });
                                            if (bonusCoinJoinner) {
                                                const uinf = await UserMaster.findOne({ where: { ID: uid } });

                                                await UserMaster.update({ TotalCoin: uinf.TotalCoin + c.CoinNumber }, { where: { ID: uid } });
                                            }
                                        } else {
                                            const bonusCoinJoinner = await UserWallet.create({
                                                CoinNumber: c.CoinNumber === null ? 0 : c.CoinNumber,
                                                TransactionType: 3,
                                                UserReceive: element.UserMasterID,
                                                DepartmentID: c.DepartmentID,
                                                Message: `Bonus ${c.CoinNumber} coin from Mooc of Campaign(${c.Name})`,
                                            });
                                            if (+c.CoinNumber >= 0) {
                                                if (bonusCoinJoinner) {
                                                    const uinf = await UserMaster.findOne({ where: { ID: uid } });

                                                    await UserMaster.update({ TotalCoin: uinf.TotalCoin + c.CoinNumber }, { where: { ID: uid } });
                                                }
                                            }
                                        }
                                    }
                                }
                                i++;
                            }
                        }
                        //Logic endDateCamp

                        //Send warning

                        // Stop AutoJob
                        // jobStartCamp.cancel();
                        // jobDeadline.cancel();
                        // jobEndCamp.cancel();
                    });
                }
                await t.commit();
                return Campaign.findOne({
                    where: { ID: createCampaign.ID },
                    include: { model: UserMaster },
                });
            }
        } catch (err) {
            await t.rollback();
            return err.message;
        }
    }

    async fncCreateMany(req, next) {
        const { CampaignData, GroupCampaignData, UserCampaignData, MoocCampaignData } = req.body;
        const { DepartmentID } = req.query;

        const t = await sequelize.transaction();
        try {
            let coinNumber;
            // @ts-ignore
            if (CampaignData.Budget > 0) coinNumber = Number.parseInt(CampaignData.Budget / CampaignData.MaximumReceiver);
            else if (CampaignData.Budget === 0) if (!CampaignData.coinNumber) return next(new ErrorResponse(400, `Missing property coinNumber`));

            const campData = {
                Name: CampaignData.Name,
                ImageURL: CampaignData.ImageURL,
                Description: CampaignData.Description,
                Budget: CampaignData.Budget,
                MaximumReceiver: CampaignData.MaximumReceiver,
                CoinNumber: coinNumber,
                Confirmer: CampaignData.Confirmer,
                StartDate: CampaignData.StartDate,
                EndDate: CampaignData.EndDate,
                Deadline: CampaignData.Deadline,
                DepartmentID: DepartmentID,
                Status: 1,
                CreatedBy: getAccountFromToken(req),
            };

            let validateInputData;
            // validateInputData = await Joi.object({
            //     Name: Joi.string().required().min(3).max(200).not('').messages({
            //         'string.base': `Name should be a text`,
            //         'string.min': `Name should have a minimum length of {#limit}`,
            //         'string.max': `Name should have a maximum length of {#limit}`,
            //         'any.required': `Name can not be empty`,
            //     }),
            //     ImageURL: Joi.string().required().not('').messages({
            //         'any.required': `ImageURL can not be empty`,
            //     }),
            //     Description: Joi.string().required().not('').messages({
            //         'string.base': `Description should be a text`,
            //         'any.required': `Description can not be empty`,
            //     }),
            //     StartDate: Joi.date().required().not('').messages({
            //         'any.required': `StartDate can not be empty`,
            //     }),
            //     EndDate: Joi.date().required().not('').greater(Joi.ref('StartDate')).messages({
            //         'date.base': `EndDate must be date`,
            //         'any.required': `EndDate can not be empty`,
            //         'date.greater': `EndDate cannot be less than StartDate`,
            //     }),
            //     Deadline: Joi.date().required().not('').greater(Joi.ref('StartDate')).less(Joi.ref('EndDate')).messages({
            //         'date.base': `Deadline must be date`,
            //         'any.required': `Deadline can not be empty`,
            //         'date.greater': `Deadline must be greater than StartDate`,
            //         'date.less': `Deadline must be less than EndDate`,
            //     }),
            // })
            //     .validateAsync(campData, { abortEarly: false })
            //     // display error into array
            //     .catch((err) => next(new ErrorResponse(400, err.message.split('.'))));

            // //* if not pass validate, stop (Joi will return the valid object after validate, so that need to compare that with input data object)
            // if (!_.isEqual(campData, validateInputData)) {
            //     console.log(validateInputData);
            //     console.log(campData);
            //     return;}

            if (!CampaignData.ProjectID) {
                //Create Campaign
                const createCampaign = await Campaign.create({ ...campData }, { transaction: t });

                //Create GroupCampaign
                let groupCampData = [];
                for await (let element of GroupCampaignData) {
                    const findGroup = await Group.findOne({ where: { ID: element } });
                    if (!findGroup) return next(new ErrorResponse(400, `GroupID ${element} cannot found`));

                    const groupCamp = {
                        CampaignID: createCampaign.ID,
                        GroupID: element,
                    };
                    groupCampData.push(groupCamp);
                }
                const createGroupCampaign = await GroupCampaign.bulkCreate(groupCampData, { transaction: t });

                //Create UserCampaign
                let userCampData = [];
                for await (let element of UserCampaignData) {
                    const findUser = await UserMaster.findOne({ where: { ID: element } });

                    if (!findUser) return next(new ErrorResponse(400, `User ${findUser.Account} cannot found`));
                    if (findUser.Status !== 1) return next(new ErrorResponse(400, `UserID ${findUser.Account} is not active`));
                    const userCamp = {
                        CampaignID: createCampaign.ID,
                        UserMasterID: element,
                        Status: 1,
                    };
                    userCampData.push(userCamp);
                }
                const createUserCampaign = await UserCampaign.bulkCreate(userCampData, { transaction: t });

                //Create MoocCampaign
                let count = 0;
                for await (let element of MoocCampaignData) {
                    if (!element.CoinNumber || !element.StartDate || !element.EndDate) return next(new ErrorResponse(400, 'Missing some property'));
                    if (element.StartDate > element.EndDate) return next(new ErrorResponse(400, 'Error MoocCamp startDate > endDate'));
                    // @ts-ignore
                    if (element.Budget > 0) element.CoinNumber = Number.parseInt(element.Budget / createCampaign.MaximumReceiver);
                    else if (element.Budget === 0) {
                        count++;
                        if (element.oinNumber > 0) return next(new ErrorResponse(400, `Error MoocCamp(${element.StartDate},${element.EndDate})`));
                        if (element.StartDate !== moment(new Date(createCampaign.Deadline)).format('YYYY-MM-DD HH:mm:ss') && count == 1)
                            return next(
                                new ErrorResponse(
                                    400,
                                    `Error MoocCampaign(${element.StartDate} -> ${element.EndDate}) StartDate must be eq Deadline Campaign`
                                )
                            );
                    }
                }
                if (
                    MoocCampaignData[MoocCampaignData.length - 1].EndDate !== moment(new Date(createCampaign.EndDate)).format('YYYY-MM-DD HH:mm:ss')
                ) {
                    return next(
                        new ErrorResponse(
                            400,
                            `Error EndDate of MoocCampaign(${MoocCampaignData[MoocCampaignData.length - 1].StartDate} -> ${
                                MoocCampaignData[MoocCampaignData.length - 1].EndDate
                            }) must be eq EndDate of Campaign)`
                        )
                    );
                }

                // Validate total Budget MoocCampaign (must be smaller than Campaign)
                const totalBudgetMoocCampaign = MoocCampaignData.reduce((previousValue, currentValue) => previousValue + currentValue.Budget, 0);

                if (totalBudgetMoocCampaign !== createCampaign.Budget)
                    return next(new ErrorResponse(400, 'Total budget (MoocCampaign) must eq budget (Campaign).'));

                const moocCamp = MoocCampaignData.map((el) => {
                    let o = Object.assign({}, el);
                    o.CampaignID = createCampaign.ID;
                    o.Status = 1;
                    return o;
                });

                const createMoocCampaign = await MoocCampaign.bulkCreate([...moocCamp], { transaction: t });

                // Automative job
                if (createCampaign && createGroupCampaign && createUserCampaign && createMoocCampaign) {
                    for await (let element of createMoocCampaign) {
                        const startMoocCamp = moment(new Date(element.StartDate)).format();
                        const endMoocCamp = moment(new Date(element.EndDate)).format();

                        const jobStartMoocCamp = schedule.scheduleJob(startMoocCamp, async function () {
                            // update MoocCampaign: Pending -> On-going
                            const updateMoocCamp = await MoocCampaign.update({ Status: 2 }, { where: { ID: element.ID } });

                            //Logic Start_MoocCampaign
                        });

                        const jobEndMoocCamp = schedule.scheduleJob(endMoocCamp, async function () {
                            //update MoocCampaign: On-going -> End
                            const updateMoocCamp = await MoocCampaign.update({ Status: 3 }, { where: { ID: element.ID } });

                            //Logic End_MoocCamp

                            //Send warning

                            // Stop AutoJob
                            jobStartMoocCamp.cancel();
                            jobEndMoocCamp.cancel();
                        });
                    }
                }
                await t.commit();
                return Campaign.findOne({ where: { ID: createCampaign.ID }, include: [{ model: MoocCampaign }] });
            } else {
                //Without ProjectID

                //Create Campaign
                const createCampaign = await Campaign.create(
                    {
                        ...campData,
                        ProjectID: CampaignData.ProjectID,
                    },
                    { transaction: t }
                );

                //Create UserCampaign
                const findMember = await ProjectMembers.findAll({ where: { ProjectID: CampaignData.ProjectID } });
                let userCampData = [];
                for await (let element of findMember) {
                    const found = await UserMaster.findOne({
                        where: { ID: element.MemberID },
                    });

                    if (found.Status !== 1) return next(new ErrorResponse(400, `User ${found.Account} is not active`));
                    const userCamp = {
                        CampaignID: createCampaign.ID,
                        UserMasterID: element.MemberID,
                        Status: 1,
                    };
                    userCampData.push(userCamp);
                }
                const createUserCampaign = await UserCampaign.bulkCreate(userCampData, { transaction: t });

                //Create MoocCampaign
                let count = 0;
                for await (let element of MoocCampaignData) {
                    if (!element.CoinNumber || !element.StartDate || !element.EndDate) return next(new ErrorResponse(400, 'Missing some property'));
                    if (element.StartDate > element.EndDate) return next(new ErrorResponse(400, 'Error moocCamp startDate > endDate'));
                    // @ts-ignore
                    if (element.Budget > 0) element.CoinNumber = Number.parseInt(element.Budget / createCampaign.MaximumReceiver);
                    else if (element.Budget === 0) {
                        count++;
                        if (element.coinNumber > 0) return next(new ErrorResponse(400, `Error moocCamp(${element.StartDate},${element.EndDate})`));
                        if (element.StartDate !== moment(new Date(createCampaign.Deadline)).format('YYYY-MM-DD HH:mm:ss') && count == 1)
                            return next(
                                new ErrorResponse(
                                    400,
                                    `Error moocCampaign(${element.StartDate} -> ${element.EndDate}) StartDate must be eq deadline campaign`
                                )
                            );
                    }
                }
                if (
                    MoocCampaignData[MoocCampaignData.length - 1].EndDate !== moment(new Date(createCampaign.EndDate)).format('YYYY-MM-DD HH:mm:ss')
                ) {
                    return next(
                        new ErrorResponse(
                            400,
                            `Error endDate this mooc campaign(${MoocCampaignData[MoocCampaignData.length - 1].StartDate} -> ${
                                MoocCampaignData[MoocCampaignData.length - 1].EndDate
                            }) must be eq endDate(Campaign)`
                        )
                    );
                }

                // Validate total Budget MoocCampaign (must be smaller than Campaign)
                const totalBudgetMoocCampaign = MoocCampaignData.reduce((previousValue, currentValue) => previousValue + currentValue.Budget, 0);

                if (totalBudgetMoocCampaign !== createCampaign.Budget)
                    return next(new ErrorResponse(400, 'Total budget (MoocCampaign) must eq budget (Campaign).'));

                const moocCamp = MoocCampaignData.map((el) => {
                    let o = Object.assign({}, el);
                    o.CampaignID = createCampaign.ID;
                    o.Status = 1;
                    return o;
                });

                const createMoocCampaign = await MoocCampaign.bulkCreate([...moocCamp], { transaction: t });

                // Automative job
                if (createCampaign && createUserCampaign && createMoocCampaign) {
                    for await (let element of createMoocCampaign) {
                        const startMoocCamp = moment(new Date(element.StartDate)).format();
                        const endMoocCamp = moment(new Date(element.EndDate)).format();

                        const jobStartMoocCamp = schedule.scheduleJob(startMoocCamp, async function () {
                            // update MoocCampaign: Pending -> On-going
                            const updateMoocCamp = await MoocCampaign.update({ Status: 2 }, { where: { ID: element.ID } });

                            //Logic Start_MoocCampaign
                        });

                        const jobEndMoocCamp = schedule.scheduleJob(endMoocCamp, async function () {
                            //update MoocCampaign: On-going -> End
                            const updateMoocCamp = await MoocCampaign.update({ Status: 3 }, { where: { ID: element.ID } });

                            //Logic End_MoocCamp

                            //Send warning

                            // Stop AutoJob
                            jobStartMoocCamp.cancel();
                            jobEndMoocCamp.cancel();
                        });
                    }
                }
                await t.commit();
                return Campaign.findOne({ where: { ID: createCampaign.ID }, include: [{ model: MoocCampaign }] });
            }
        } catch (err) {
            await t.rollback();
            console.log(err.message);
        }
    }

    async fncFindAll(req) {
        const queries = queryParams(
            req.query,
            Op,
            ['Name', 'Description'],
            ['DepartmentID', 'Type', 'Name', 'UpdatedBy', 'CreatedBy', 'Status', 'StartDate', 'EndDate', 'CreatedDate', 'UpdatedDate']
        );

        return Campaign.findAndCountAll({
            order: queries.order,
            where: queries.searchOr,
            include: [
                {
                    model: Department,
                },
                {
                    model: Group,
                },
                {
                    model: Project,
                },
                {
                    model: UserMaster,
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

        if (!found) return next(new ErrorResponse(404, 'Campaign not found'));

        return Campaign.update(
            {
                ...req.body,
                UpdatedBy: getAccountFromToken(req),
            },
            {
                where: { ID: id },
            }
        );
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Campaign not found'));

        return Campaign.update(
            { Status: 3 },
            {
                where: { ID: id },
            }
        );
    }
}

module.exports = new CampaignService();
