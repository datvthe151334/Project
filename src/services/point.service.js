const Joi = require('joi');
const _ = require('lodash');
const { Op, QueryTypes } = require('sequelize');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/error-response');
const importPointExcel = require('../imports/request-points-excel');
const moment = require('moment');
// @ts-ignore
const { Point, UserMaster, RuleDefinition, Pic, Project, Department, Setting, UserWallet, DefaultHead, sequelize, Ranking } = require('../models');
// const MailService = require('../services/sendmail.service');
const getAccountFromToken = require('../utils/account-token');
const { query } = require('express');
class PointService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Point.findOne({
            where: { ID: id },
            include: [
                {
                    model: UserMaster,
                },
                {
                    model: RuleDefinition,
                },
                {
                    model: Project,
                },
                {
                    model: Department,
                },
            ],
        });
    }

    async fncSelfMark(req, res, next) {
        const { UserMasterID, DepartmentID, RuleDefinitionID, ProjectID, Times, Month, Year, Evidence, Approver } = req.body;
        const findUser = await UserMaster.findOne({
            where: {
                ID: UserMasterID,
                DepartmentID: DepartmentID,
            },
        });
        if (!findUser) return next(new ErrorResponse(404, 'UserMaster not found'));
        const findProject = await Project.findOne({
            where: { ID: ProjectID },
            include: [
                {
                    model: UserMaster,
                    as: 'Manager',
                },
            ],
        });
        const findPro = findProject.Manager?.Account ?? undefined;
        const findApprover = await UserMaster.findOne({
            where: { ID: Approver, DepartmentID: DepartmentID },
        });
        const findDefaultHead = await DefaultHead.findOne({
            where: { DepartmentID: DepartmentID },
        });
        const accountDefaultHead = await UserMaster.findOne({
            where: { ID: findDefaultHead?.HeadID },
        });
        if (!findProject) return next(new ErrorResponse(404, `Project not found`));
        if (findProject.Status !== 'On-going')
            return next(new ErrorResponse(400, `Status of project ${findProject.Code} is ${findProject.Status}, not 'On-going'`));

        const findRuleDefinition = await RuleDefinition.findOne({
            where: { ID: RuleDefinitionID },
        });
        if (!findRuleDefinition) return next(new ErrorResponse(404, `Rule definition not found`));

        const findPic = await Pic.findOne({
            where: { RuleDefinitionID: findRuleDefinition?.ID },
        });

        // if this rule has pic account to review point
        //check valid submit time

        const today = new Date();
        if (today.getFullYear() < Year || (today.getFullYear() === Year && today.getMonth() + 1 < Month)) {
            return next(new ErrorResponse(400, `Input time not valid`));
        }
        const findSetting = await Setting.findOne({
            where: { DepartmentID: DepartmentID },
        });

        if (findSetting) {
            today.setDate(today.getDate() - findSetting.ValidDistantTime);
            if (today.getFullYear() > Year || (today.getFullYear() === Year && today.getMonth() + 1 > Month)) {
                return next(new ErrorResponse(400, `Time of request must after ${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`));
            }
        }
        let check = 0;

        if (findApprover.Account === findPro) {
            check = 1;
        }
        let findPicAccount;
        if (findPic) findPicAccount = await UserMaster.findOne({ where: { ID: findPic?.UserMasterID } });
        let ApproveAccount = findProject.Manager?.Account ?? null;
        let ConfirmerAccount = findPicAccount?.Account ?? findApprover?.Account ?? accountDefaultHead.Account;
        const point = await Point.create({
            UserMasterID: findUser.ID,
            RuleDefinitionID: findRuleDefinition.ID,
            ProjectID: ProjectID,
            Confirmer: findProject.Manager?.Account ?? null, // get PM if exists else null
            Approver: findPicAccount?.Account ?? findApprover?.Account ?? accountDefaultHead.Account,
            Times: Times,
            RequestType: 1,
            Month: Month,
            Year: Year,
            PointOfRule: findRuleDefinition.PointNumber * Times,
            DepartmentID: findUser.DepartmentID,
            Evidence: !req.file ? Evidence : `/public/images/${req.file.filename}`,
            CreatedBy: findUser.Account,
            UserContractType: findUser.ContractType,
            UserStatus: findUser.Status,
            Status: check === 1 ? 2 : findPro ? 1 : 2,
            // Status: ApproveAccount && ConfirmerAccount ? (ApproveAccount == ConfirmerAccount ? 2 : 1) : findPro ? 1 : 2,
        });

        // if (point && findRuleDefinition.Integrate !== null) {
        //     const ruleIntegrate = await RuleDefinition.findOne({
        //         where: { ID: findRuleDefinition.Integrate },
        //     });
        //     const findUserIntegrate = await UserMaster.findOne({
        //         where: { Account: getAccountFromToken(req), DepartmentID: ruleIntegrate.DepartmentID },
        //     });

        //     let findPicAccountIntegrate;
        //     const findPicIntegrate = await Pic.findOne({
        //         where: { RuleDefinitionID: findRuleDefinition?.ID },
        //     });
        //     if (findPicIntegrate) findPicAccountIntegrate = await UserMaster.findOne({ where: { ID: findPicIntegrate?.UserMasterID } });

        //     if (findUserIntegrate) {
        //         const pointIntegrate = await Point.create({
        //             UserMasterID: findUserIntegrate?.ID ?? null,
        //             RuleDefinitionID: ruleIntegrate.ID,
        //             ProjectID: ProjectID,
        //             Confirmer: findProject.Manager?.Account ?? null, // get PM if exists else null
        //             Approver: findPicIntegrate?.Account ?? findApprover?.Account ?? accountDefaultHead.Account,
        //             Times: Times,
        //             RequestType: 3,
        //             Month: Month,
        //             Year: Year,
        //             PointOfRule: ruleIntegrate.PointNumber * Times,
        //             DepartmentID: ruleIntegrate.DepartmentID,
        //             Evidence: !req.file ? Evidence : `/public/images/${req.file.filename}`,
        //             CreatedBy: findUserIntegrate.Account,
        //             Status: check === 1 ? 2 : findPro ? 1 : 2,
        //             // Status: ApproveAccount && ConfirmerAccount ? (ApproveAccount == ConfirmerAccount ? 2 : 1) : findPro ? 1 : 2,
        //         });
        //         const findUserIntegrate = await UserMaster.findOne({
        //             where: { Account: getAccountFromToken(req), DepartmentID: ruleIntegrate.DepartmentID },
        //         });

        //         let findPicAccountIntegrate;
        //         const findPicIntegrate = await Pic.findOne({
        //             where: { RuleDefinitionID: ruleIntegrate?.ID },
        //         });
        //         if (findPicIntegrate) findPicAccountIntegrate = await UserMaster.findOne({ where: { ID: findPicIntegrate?.UserMasterID } });

        //         // if (findUserIntegrate) {
        //     const pointIntegrate = await Point.create({
        //         UserMasterID: findUserIntegrate?.ID ?? null,
        //         RuleDefinitionID: ruleIntegrate.ID,
        //         ProjectID: ProjectID,
        //         Confirmer: findProject.Manager?.Account ?? null, // get PM if exists else null
        //         Approver: findPicIntegrate?.Account ?? findApprover?.Account ?? accountDefaultHead.Account,
        //         Times: Times,
        //         RequestType: 3,
        //         Month: Month,
        //         Year: Year,
        //         PointOfRule: ruleIntegrate.PointNumber * Times,
        //         DepartmentID: ruleIntegrate.DepartmentID,
        //         Evidence: !req.file ? Evidence : `/public/images/${req.file.filename}`,
        //         CreatedBy: findUserIntegrate.Account,
        //         Status:check === 1 ? 2 : findPro ? 1 : 2,
        //     });
        // }
        //     }
        // }

        // if (point) {
        //     if (findProject.ManagerID != null) {
        //         // tim thay PM
        //         await MailService.fncSendMailToUser(req);
        //         //send mail to user
        //         await MailService.fncSendMailToPM(req);
        //         //send mail to PM notify about new point request
        //     } else {
        //         // ko tim thay PM -> BUL
        //         await MailService.fncSendMailToUserNoPM(req);
        //         //send mail to user
        //         await MailService.fncSendMailToBUL(req, point.Approver);
        //         //send mail to bul notify about new point request
        //     }
        // }

        return point;
    }

    async fncPMRequestPoint(req, res, next) {
        const { DepartmentID } = req.query;

        const dataImport = await importPointExcel(req, res, next);
        const accountUser = getAccountFromToken(req);

        const t = await sequelize.transaction();

        try {
            let storePointData = [];
            let storePointIntegrateData = [];
            let storeMailData = [];
            let validateInputData;

            //* proposal-async-iteration
            for await (let row of dataImport) {
                const inputData = {
                    Account: row[0],
                    RuleDefinition: row[1],
                    PointNumber: row[2],
                    Note: row[3],
                    ProjectCode: row[4],
                    Approver: row[5],
                    Times: +row[6],
                    Month: +row[7],
                    Year: +row[8],
                    TotalPoint: row[9],
                };

                validateInputData = await Joi.object({
                    Account: Joi.string().required().min(3).max(20).not('').messages({
                        'string.base': `Account should be a text`,
                        'string.min': `Account should have a minimum length of {#limit}`,
                        'string.max': `Account should have a maximum length of {#limit}`,
                        'any.required': `Account can not be empty`,
                    }),
                    Approver: Joi.string().required().min(3).max(50).not('').messages({
                        'string.base': `Approver should be a text`,
                        'string.min': `Approver should have a minimum length of {#limit}`,
                        'string.max': `Approver should have a maximum length of {#limit}`,
                        'any.required': `Approver can not be empty`,
                    }),
                    RuleDefinition: Joi.string().required().min(3).max(200).not('').messages({
                        'string.base': `Account should be a text`,
                        'string.min': `Account should have a minimum length of {#limit}`,
                        'string.max': `Account should have a maximum length of {#limit}`,
                        'any.required': `Account can not be empty`,
                    }),
                    // skip validate point number
                    PointNumber: Joi.any(),
                    Note: Joi.string().allow(null, '').optional().messages({
                        'string.base': `Note should be a text`,
                    }),
                    ProjectCode: Joi.string().required().max(50).not('').messages({
                        'string.base': `Project code should be a text`,
                        'string.max': `Project code should have a maximum length of {#limit}`,
                        'any.required': `Project code can not be empty`,
                    }),
                    Times: Joi.number().positive().min(1).required().messages({
                        'number.base': `Times should be a number! `,
                        'number.min': `Times should have a minimum length of {#limit}! `,
                        'any.required': `Times can not be empty! `,
                    }),
                    Month: Joi.number()
                        .positive()
                        // accept less than 2 months
                        // .min(new Date().getMonth() - 1)
                        // .max(12)
                        .required()
                        .messages({
                            'number.base': `Month should be a number`,
                            // 'number.min': `Month should have a minimum length of {#limit}`,
                            // 'number.max': `Month should have a maximum length of {#limit}`,
                            'any.required': `Month can not be empty`,
                        }),
                    Year: Joi.number()
                        // .required()
                        // .min(2021)
                        // // accept greater than 1 month
                        // .max(new Date().getFullYear() + 1)
                        .messages({
                            'number.base': `Month should be a number`,
                            // 'number.min': `Month should have a minimum length of {#limit}`,
                            // 'number.max': `Month should have a maximum length of {#limit}`,
                            'any.required': `Month can not be empty`,
                        }),
                    // skip validate total number
                    TotalPoint: Joi.any(),
                })
                    .validateAsync(inputData, { abortEarly: false })
                    // display error into array
                    .catch((err) => next(new ErrorResponse(400, err.message.split('.'))));

                // find each user from inputData

                const findUser = await UserMaster.findOne(
                    {
                        where: {
                            Account: inputData.Account,
                            DepartmentID: DepartmentID,
                        },
                    },
                    { transaction: t }
                );
                if (!findUser) return next(new ErrorResponse(404, `User ${inputData.Account} not found`));

                // find each rule from inputData
                const findRuleDefinition = await RuleDefinition.findOne(
                    {
                        where: {
                            Name: inputData.RuleDefinition,
                            DepartmentID: DepartmentID,
                        },
                    },
                    { transaction: t }
                );
                if (!findRuleDefinition) return next(new ErrorResponse(404, `Rule definition ${inputData.RuleDefinition} not found`));
                const findPic = await Pic.findOne({ where: { RuleDefinitionID: findRuleDefinition.ID } }, { transaction: t });
                const findPicAccount = (await findPic) ? UserMaster.findOne({ where: { ID: findPic?.UserMasterID } }) : null;
                // find each project from inputData
                const findProject = await Project.findOne(
                    {
                        where: {
                            Code: inputData.ProjectCode,
                            DepartmentID: DepartmentID,
                        },
                    },
                    { transaction: t }
                );
                if (!findProject) return next(new ErrorResponse(404, `Project code ${inputData.ProjectCode} not found`));
                if (findProject.Status !== 'On-going')
                    return next(new ErrorResponse(404, `Status of project ${findProject.Code} is ${findProject.Status}, not 'On-going'`));

                const today = new Date();
                if (today.getFullYear() < +row[8] || (today.getFullYear() === +row[8] && today.getMonth() + 1 < +row[7])) {
                    return next(new ErrorResponse(404, `Input time not valid`));
                }
                const findSetting = await Setting.findOne({
                    where: { DepartmentID: DepartmentID },
                });

                if (!findSetting) return next(new ErrorResponse(404, 'Department not setting RequestTime yet'));

                today.setDate(today.getDate() - findSetting.ValidDistantTime);
                if (today.getFullYear() > +row[8] || (today.getFullYear() === +row[8] && today.getMonth() + 1 > +row[7])) {
                    return next(new ErrorResponse(404, `Project valid time out`));
                }
                storeMailData.push({
                    Account: findUser.Account,
                    ProjectID: findProject.ID,
                    Approver: row[5],
                });
                storePointData.push({
                    UserMasterID: findUser.ID,
                    RuleDefinitionID: findRuleDefinition.ID,
                    Note: inputData.Note,
                    ProjectID: findProject.ID,
                    Confirmer: accountUser,
                    isConfirmed: true,
                    Approver: findPicAccount?.Account ?? row[5],
                    RequestType: 1,
                    Times: inputData.Times,
                    Month: inputData.Month,
                    Year: inputData.Year,
                    UserContractType: findUser.ContractType ?? null,
                    UserStatus: findUser.UserStatus ?? null,
                    PointOfRule: findRuleDefinition.PointNumber * inputData.Times,
                    DepartmentID: DepartmentID,
                    CreatedBy: accountUser,
                    Status: 2,
                });

                const checkIntegrate = await RuleDefinition.findAll({
                    where: { Integrate: findRuleDefinition.ID },
                });
                const arrayDepartment = checkIntegrate.map((x) => x.ID);
                if (arrayDepartment.length !== 0) {
                    for await (let el of arrayDepartment) {
                        const ruleIntegrate = await RuleDefinition.findOne({
                            where: { ID: el },
                        });
                        const findUserIntegrate = await UserMaster.findOne({
                            where: { Account: findUser.Account, DepartmentID: ruleIntegrate.DepartmentID },
                        });
                        const findPicIntegrate = await Pic.findOne({
                            where: { RuleDefinitionID: findRuleDefinition?.ID },
                        });
                        const isMonthlyPerformance = findRuleDefinition.Name.includes('Monthly Performance');
                        // if (findPicIntegrate) let findPicAccountIntegrate = await UserMaster.findOne({ where: { ID: findPicIntegrate?.UserMasterID } });
                        if (findUserIntegrate) {
                            storePointIntegrateData.push({
                                UserMasterID: findUserIntegrate?.ID ?? null,
                                RuleDefinitionID: ruleIntegrate?.ID ?? null,
                                Note: inputData.Note,
                                ProjectID: findProject.ID,
                                Approver: accountUser,
                                isApproved: true,
                                Effort: isMonthlyPerformance ? inputData.Effort : null,
                                KPer: isMonthlyPerformance ? inputData.KPer : null,
                                Times: inputData.Times,
                                RequestType: 3,
                                Month: inputData.Month,
                                Year: inputData.Year,
                                UserContractType: findUserIntegrate.ContractType ?? null,
                                UserStatus: findUserIntegrate.UserStatus ?? null,
                                // PointOfRule: isMonthlyPerformance ? inputData.Effort * inputData.KPer * findRuleDefinition.PointNumber : findRuleDefinition.PointNumber * inputData.Times,
                                PointOfRule:
                                    ruleIntegrate.Name === 'Other'
                                        ? +inputData.PointNumber * +inputData.Times
                                        : isMonthlyPerformance
                                        ? +inputData.Effort * +inputData.KPer * ruleIntegrate.PointNumber
                                        : ruleIntegrate.PointNumber * +inputData.Times,
                                DepartmentID: ruleIntegrate.DepartmentID,
                                CreatedBy: accountUser,
                                Status: 2,
                            });
                        }
                    }
                }
            }

            // if not pass, stop
            if (!validateInputData) return;

            const createBulkData = await Point.bulkCreate(storePointData, { transaction: t });
            const createBulkData1 = await Point.bulkCreate(storePointIntegrateData, { transaction: t });

            await t.commit();
            // return new array data
            if (createBulkData && storeMailData.length !== 0) {
                let listAccount = '';

                // storeMailData.forEach((element) => {
                //     listAccount += element.Account + ', ';
                //     MailService.fncSendMailToUser(req, undefined, element, element.Approver);
                //     MailService.fncSendMailToBUL(req, undefined, element, element.Approver);
                // });

                // MailService.fncSendMailToPM(req, listAccount);
            }

            return createBulkData;
        } catch (err) {
            await t.rollback();
            return next(new ErrorResponse(400, err.message));
        }
    }

    async fncHeadRequestPoint(req, res, next) {
        const { DepartmentID } = req.query;

        const dataImport = await importPointExcel(req, res, next);
        const accountUser = getAccountFromToken(req);
        let dataRule = [];
        const t = await sequelize.transaction();

        try {
            let storeMailData = [];
            let storePointData = [];
            let storePointIntegrateData = [];
            // check valid input point data
            let validateInputData;

            //* proposal-async-iteration
            for await (let row of dataImport) {
                const inputData = {
                    Account: row[0],
                    RuleDefinition: row[1],
                    PointNumber: row[2],
                    Note: row[3],
                    ProjectCode: row[4],
                    Times: row[5],
                    Month: row[6],
                    Year: row[7],
                    Effort: row[8],
                    KPer: row[9],
                    TotalPoint: row[10],
                };
                let totalPoint = 0;
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth();
                const ruleMonthlyPerformance = '[Plus][BU]Monthly Performance';

                validateInputData = await Joi.object({
                    Account: Joi.string().required().min(3).max(20).not('').messages({
                        'string.base': `Account should be a text`,
                        'string.min': `Account should have a minimum length of {#limit}`,
                        'string.max': `Account should have a maximum length of {#limit}`,
                        'any.required': `Account can not be empty`,
                    }),
                    RuleDefinition: Joi.string().required().min(3).max(200).not('').messages({
                        'string.base': `Account should be a text`,
                        'string.min': `Account should have a minimum length of {#limit}`,
                        'string.max': `Account should have a maximum length of {#limit}`,
                        'any.required': `Account can not be empty`,
                    }),
                    // skip validate PointNumber
                    PointNumber: Joi.any(),
                    Note: Joi.string().allow(null, '').optional().messages({
                        'string.base': `Note should be a text`,
                    }),
                    Effort: Joi.when('RuleDefinition', {
                        is: Joi.string().valid(`${ruleMonthlyPerformance}`),
                        then: Joi.number().required().min(0).not('').messages({
                            'number.base': `Effort should be a number`,
                            'any.required': `with Monthly Performance, Month can not be empty`,
                        }),
                        otherwise: Joi.optional().allow(null, ''),
                    }),
                    KPer: Joi.when('RuleDefinition', {
                        is: Joi.string().valid(`${ruleMonthlyPerformance}`),
                        then: Joi.number().required().min(0).not('').messages({
                            'number.base': `KPer should be a number`,
                            'any.required': `with Monthly Performance, KPer can not be empty`,
                        }),
                        otherwise: Joi.optional().allow(null, ''),
                    }),
                    ProjectCode: Joi.string().required().max(50).not('').messages({
                        'string.base': `Project code should be a text`,
                        'string.max': `Project code should have a maximum length of {#limit}`,
                        'any.required': `Project code can not be empty`,
                    }),
                    Times: Joi.number().positive().min(1).required().messages({
                        'number.base': `Times should be a number`,
                        'number.min': `, min value is {#limit}!`,
                        'any.required': `Times can not be empty! `,
                    }),
                    Month: Joi.number()
                        .required()
                        // accept less than 2 months
                        // .min(currentMonth - 1)
                        // .max(12)
                        .messages({
                            'number.base': `Month should be a number`,
                            // 'number.min': `Month should have a minimum length of {#limit}`,
                            // 'number.max': `Month should have a maximum length of {#limit}`,
                            'any.required': `Month can not be empty`,
                        }),
                    Year: Joi.number()
                        .required()
                        // .min(2021)
                        // // accept greater than 1 month
                        // .max(currentYear + 1)
                        .messages({
                            'number.base': `Year should be a number`,
                            // 'number.min': `Year should have a minimum length of {#limit}`,
                            // 'number.max': `Year should have a maximum length of {#limit}`,
                            'any.required': `Year can not be empty`,
                        }),
                    // skip validate total number
                    TotalPoint: Joi.any(),
                })
                    .validateAsync(inputData, { abortEarly: false })
                    // display error into array
                    .catch((err) => next(new ErrorResponse(400, err.message.split('.'))));

                const findUser = await UserMaster.findOne(
                    {
                        where: {
                            Account: inputData.Account,
                            DepartmentID: DepartmentID,
                        },
                    },
                    { transaction: t }
                );
                if (!findUser) return next(new ErrorResponse(404, `User ${inputData.Account} not found`));

                const findRuleDefinition = await RuleDefinition.findOne(
                    {
                        where: {
                            Name: inputData.RuleDefinition,
                            DepartmentID: DepartmentID,
                        },
                    },
                    { transaction: t }
                );
                if (!findRuleDefinition) return next(new ErrorResponse(404, `Rule definition ${inputData.RuleDefinition} not found`));

                const findProject = await Project.findOne(
                    {
                        where: {
                            Code: inputData.ProjectCode,
                            DepartmentID: DepartmentID,
                        },
                    },
                    { transaction: t }
                );
                if (!findProject) return next(new ErrorResponse(404, `Project Code ${inputData.ProjectCode} not found`));
                if (findProject.Status !== 'On-going')
                    return next(new ErrorResponse(404, `Status of project ${findProject.Code} is ${findProject.Status}, not 'On-going'`));

                const today = new Date();
                if (today.getFullYear() < row[7] || (today.getFullYear() === row[7] && today.getMonth() + 1 < row[6])) {
                    return next(new ErrorResponse(404, `Input time not valid`));
                }
                const findSetting = await Setting.findOne({
                    where: { DepartmentID: DepartmentID },
                });

                if (!findSetting) return next(new ErrorResponse(404, 'Department not setting RequestTime yet'));

                today.setDate(today.getDate() - findSetting.ValidDistantTime);
                if (today.getFullYear() > row[7] || (today.getFullYear() === row[7] && today.getMonth() + 1 > row[6])) {
                    return next(new ErrorResponse(404, `Project valid time out`));
                }

                const isMonthlyPerformance = findRuleDefinition.Name.includes('Monthly Performance');
                totalPoint =
                    findRuleDefinition.Name === 'Other'
                        ? +inputData.PointNumber * +inputData.Times
                        : isMonthlyPerformance
                        ? +inputData.Effort * +inputData.KPer * findRuleDefinition.PointNumber
                        : findRuleDefinition.PointNumber * +inputData.Times;
                storePointData.push({
                    UserMasterID: findUser.ID,
                    RuleDefinitionID: findRuleDefinition.ID,
                    Note: inputData.Note,
                    ProjectID: findProject.ID,
                    Approver: accountUser,
                    isApproved: true,
                    Effort: isMonthlyPerformance ? inputData.Effort : null,
                    KPer: isMonthlyPerformance ? inputData.KPer : null,
                    Times: inputData.Times,
                    RequestType: 1,
                    Month: inputData.Month,
                    Year: inputData.Year,
                    UserContractType: findUser.ContractType ?? null,
                    UserStatus: findUser.Status ?? null,
                    // PointOfRule: isMonthlyPerformance ? inputData.Effort * inputData.KPer * findRuleDefinition.PointNumber : findRuleDefinition.PointNumber * inputData.Times,
                    PointOfRule:
                        findRuleDefinition.Name === 'Other'
                            ? +inputData.PointNumber * +inputData.Times
                            : isMonthlyPerformance
                            ? +inputData.Effort * +inputData.KPer * findRuleDefinition.PointNumber
                            : findRuleDefinition.PointNumber * +inputData.Times,
                    DepartmentID: DepartmentID,
                    CreatedBy: accountUser,
                    Status: 3,
                });
                async function processRuleIntegrate(ruleID) {
                    const checkIntegrate = await RuleDefinition.findAll({
                        where: { Integrate: ruleID },
                    });
                    const arrayDepartment = checkIntegrate.map((x) => x.ID);

                    if (arrayDepartment.length !== 0) {
                        dataRule.push(arrayDepartment);
                        for await (let el of arrayDepartment) {
                            const ruleIntegrate = await RuleDefinition.findOne({
                                where: { ID: el },
                            });
                            const findUserIntegrate = await UserMaster.findOne({
                                where: { Account: findUser.Account, DepartmentID: ruleIntegrate.DepartmentID },
                            });
                            // if (findPicIntegrate) let findPicAccountIntegrate = await UserMaster.findOne({ where: { ID: findPicIntegrate?.UserMasterID } });
                            if (findUserIntegrate) {
                                storePointIntegrateData.push({
                                    UserMasterID: findUserIntegrate?.ID ?? null,
                                    RuleDefinitionID: ruleIntegrate?.ID ?? null,
                                    Note: inputData.Note,
                                    ProjectID: findProject.ID,
                                    Approver: accountUser,
                                    isApproved: true,
                                    Effort: isMonthlyPerformance ? inputData.Effort : null,
                                    KPer: isMonthlyPerformance ? inputData.KPer : null,
                                    Times: inputData.Times,
                                    RequestType: 3,
                                    Month: inputData.Month,
                                    Year: inputData.Year,
                                    UserContractType: findUserIntegrate.ContractType ?? null,
                                    UserStatus: findUserIntegrate.Status ?? null,
                                    // PointOfRule: isMonthlyPerformance ? inputData.Effort * inputData.KPer * findRuleDefinition.PointNumber : findRuleDefinition.PointNumber * inputData.Times,
                                    PointOfRule:
                                        ruleIntegrate.Name === 'Other'
                                            ? +inputData.PointNumber * +inputData.Times
                                            : isMonthlyPerformance
                                            ? +inputData.Effort * +inputData.KPer * ruleIntegrate.PointNumber
                                            : ruleIntegrate.PointNumber * +inputData.Times,
                                    DepartmentID: ruleIntegrate.DepartmentID,
                                    CreatedBy: accountUser,
                                    Status: 3,
                                });
                            }
                            await processRuleIntegrate(el);
                        }
                    }
                }

                // Call the recursive function with the initial ruleIntegrate
                await processRuleIntegrate(findRuleDefinition.ID);

                // //* if not pass validate, stop (Joi will return the valid object after validate, so that need to compare that with input data object)
                if (!_.isEqual(inputData, validateInputData)) return;

                // const checkIntegratePoint = await RuleDefinition.findAll({
                //     where: { Integrate: findRuleDefinition.ID },
                // });
                // const arrayDepartmentPoint = checkIntegrate.map((x) => x.ID);

                storeMailData.push({
                    Account: inputData.Account,
                    ProjectID: findProject.ID,
                });
            }
            const createBulkData = await Point.bulkCreate(storePointData);
            // const createBulkData1 = await Point.bulkCreate(storePointIntegrateData, { transaction: t });
            if (storePointData.length !== 0) {
                await this.fncUpdateRanking(storePointData);
                const setting = await Setting.findOne({
                    where: { DepartmentID: DepartmentID },
                });
                for await (let el of storePointData) {
                    const create = await Point.create(el);
                    const findRuleDefinition = await RuleDefinition.findOne({ where: { ID: el.RuleDefinitionID } });
                    if (setting && setting.ConversionRatio && create) {
                        if (el.PointOfRule < 0) {
                            if (setting.AllowMinus === 1) {
                                const findUser = await UserMaster.findOne({ where: { ID: el.UserMasterID } });

                                let currentCoin = findUser.TotalCoin;
                                if (findUser.TotalCoin === null) currentCoin = 0;
                                const plusCoin = el.PointOfRule * setting.ConversionRatio;
                                const updateCoin = await UserMaster.update(
                                    {
                                        TotalCoin: currentCoin + plusCoin,
                                    },
                                    {
                                        where: { ID: findUser.ID },
                                    }
                                );
                                const walletHistory = await UserWallet.create({
                                    UserReceive: findUser.ID,
                                    DepartmentID: DepartmentID,
                                    CoinNumber: plusCoin,
                                    TransactionMethod: 3,
                                    PointID: create.ID,
                                    Message: `Get ${plusCoin} ${setting.CoinName} from ${findRuleDefinition.Name}`,
                                    UserSend: null,
                                });
                            }
                        } else {
                            const findUser = await UserMaster.findOne({ where: { ID: el.UserMasterID } });

                            let currentCoin = findUser?.TotalCoin ?? 0;
                            if (findUser.TotalCoin === null) currentCoin = 0;
                            const plusCoin = el.PointOfRule * setting.ConversionRatio;
                            const updateCoin = await UserMaster.update(
                                {
                                    TotalCoin: currentCoin + plusCoin,
                                },
                                {
                                    where: { ID: findUser.ID },
                                }
                            );
                            const walletHistory = await UserWallet.create({
                                UserReceive: findUser.ID,
                                DepartmentID: DepartmentID,
                                CoinNumber: plusCoin,
                                TransactionMethod: 3,
                                PointID: create.ID,
                                Message: `Get ${plusCoin} ${setting.CoinName} from ${findRuleDefinition.Name}`,
                                UserSend: null,
                            });
                        }
                    }
                }
            }

            if (storePointIntegrateData.length !== 0) {
                for await (let el of storePointIntegrateData) {
                    const create = await Point.create(el);
                    if (dataRule.length > 0 && create) {
                        for await (let ele of dataRule) {
                            const ruleIntegrate = await RuleDefinition.findOne({
                                where: { ID: ele },
                            });
                            const findUserIntegrate = await UserMaster.findOne({
                                where: { ID: el.UserMasterID },
                            });

                            if (findUserIntegrate) {
                                const setting = await Setting.findOne({
                                    where: { DepartmentID: ruleIntegrate.DepartmentID },
                                });

                                if (setting && setting.ConversionRatio) {
                                    if (el.PointOfRule < 0) {
                                        if (setting.AllowMinus === 1) {
                                            let currentCoin = findUserIntegrate.TotalCoin;
                                            if (findUserIntegrate.TotalCoin === null) currentCoin = 0;

                                            const plusCoin = el.PointOfRule * setting.ConversionRatio;
                                            const updateCoin = await UserMaster.update(
                                                {
                                                    TotalCoin: currentCoin + plusCoin,
                                                },
                                                {
                                                    where: { ID: findUserIntegrate.ID },
                                                }
                                            );

                                            const walletHistory = await UserWallet.create({
                                                UserReceive: findUserIntegrate.ID,
                                                DepartmentID: ruleIntegrate.DepartmentID,
                                                CoinNumber: plusCoin,
                                                TransactionMethod: 3,
                                                PointID: create.ID,
                                                Message: `Get ${plusCoin} ${setting.CoinName} from ${ruleIntegrate.Name}`,
                                                UserSend: null,
                                            });
                                        }
                                    } else {
                                        let currentCoin = findUserIntegrate.TotalCoin;
                                        if (findUserIntegrate.TotalCoin === null) currentCoin = 0;
                                        const plusCoin = el.PointOfRule * setting.ConversionRatio;
                                        const updateCoin = await UserMaster.update(
                                            {
                                                TotalCoin: currentCoin + plusCoin,
                                            },
                                            {
                                                where: { ID: findUserIntegrate.ID },
                                            }
                                        );
                                        const walletHistory = await UserWallet.create({
                                            UserReceive: findUserIntegrate.ID,
                                            DepartmentID: ruleIntegrate.DepartmentID,
                                            CoinNumber: plusCoin,
                                            TransactionMethod: 3,
                                            PointID: create.ID,
                                            Message: `Get ${plusCoin} ${setting.CoinName} from ${ruleIntegrate.Name}`,
                                            UserSend: null,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            await t.commit();
            // if (createBulkData && storeMailData.length !== 0) {
            //     storeMailData.forEach((element) => {
            //         MailService.fncSendMailToUser(req, undefined, element);
            //     });
            //     MailService.fncSendMailToBUL(req, undefined, undefined);
            // }
            // return new array data afer bulkCreate
            return [];
        } catch (err) {
            await t.rollback();

            return err.message;
        }
    }

    async fncFindAllRule(req, next) {
        const { DepartmentID, UserMasterID } = req.query;

        const validSortFields = ['PointOfRule', 'Times', 'CreatedDate'];

        const findDepartment = await Department.findOne({
            where: { ID: DepartmentID },
        });

        if (!findDepartment) return next(new ErrorResponse(404, 'Department not found'));

        const findAccount = await UserMaster.findOne({
            where: { ID: UserMasterID },
        });

        let where = {
            DepartmentID: DepartmentID,

            CreatedBy: findAccount.Account,
        };

        if (req.query.Confirmer) {
            where = {
                DepartmentID: DepartmentID,
            };

            where.Confirmer = req.query.Confirmer;
        }

        if (req.query.Approver) {
            where = { DepartmentID: DepartmentID };

            where.Approver = req.query.Approver;
        }

        if (req.query.Status) {
            where.Status = req.query.Status;
        }

        if (req.query.keyword) {
            if (req.query.Confirmer || req.query.Approver) {
                where[Op.and] = [
                    { [Op.or]: [{ Confirmer: findAccount.Account }, { Approver: findAccount.Account }] },

                    {
                        [Op.or]: [
                            { Note: { [Op.like]: `%${req.query.keyword}%` } },

                            { '$RuleDefinition.Name$': { [Op.like]: `%${req.query.keyword}%` } },

                            { '$Project.Key$': { [Op.like]: `%${req.query.keyword}%` } },

                            { Confirmer: { [Op.like]: `%${req.query.keyword}%` } },

                            { Approver: { [Op.like]: `%${req.query.keyword}%` } },

                            { '$UserMaster.Account$': { [Op.like]: `%${req.query.keyword}%` } },
                        ],
                    },
                ];
            } else {
                where = {
                    DepartmentID: DepartmentID,

                    CreatedBy: findAccount.Account,
                };

                where[Op.and] = [
                    {
                        [Op.or]: [
                            { Note: { [Op.like]: `%${req.query.keyword}%` } },

                            { '$RuleDefinition.Name$': { [Op.like]: `%${req.query.keyword}%` } },

                            { '$Project.Key$': { [Op.like]: `%${req.query.keyword}%` } },

                            { Confirmer: { [Op.like]: `%${req.query.keyword}%` } },

                            { Approver: { [Op.like]: `%${req.query.keyword}%` } },

                            { '$UserMaster.Account$': { [Op.like]: `%${req.query.keyword}%` } },
                        ],
                    },
                ];
            }
        }

        let order = [];

        if (req.query.sort && validSortFields.includes(req.query.sort.split(':')[0])) {
            order.push(req.query.sort.split(':'));
        }

        let limit, offset;

        if (req.query.page && req.query.row) {
            limit = parseInt(req.query.row);

            offset = (parseInt(req.query.page) - 1) * limit;
        }

        const result = await Point.findAndCountAll({
            include: [{ model: UserMaster }, { model: RuleDefinition }, { model: Project }, { model: Department }],

            where,

            order,

            limit,

            offset,
        });
        return result;
    }

    async fncFindAll(req) {
        // const queries = queryParams(
        //     req.query,
        //     Op,
        //     //
        //     ['Note', 'Confirmer', 'Approver', 'CreatedBy', 'RequestType', 'Times', 'Month', 'Year'],
        //     [
        //         'UserMasterID',
        //         'RuleDefinitionID',
        //         'DepartmentID',
        //         'ProjectID',
        //         'Confirmer',
        //         'isConfirmed',
        //         'Approver',
        //         'isApproved',
        //         'Effort',
        //         'KPer',
        //         'Mark',
        //         'Times',
        //         'RequestType',
        //         'Month',
        //         'Year',
        //         'UpdatedBy',
        //         'CreatedBy',
        //         'Status',
        //         'CreatedDate',
        //         'UpdatedDate',
        //     ]
        // );

        // const point = await Point.findAndCountAll({
        //     order: queries.order,
        //     where: queries.searchOr,
        //     include: [
        //         {
        //             model: UserMaster,
        //         },
        //         {
        //             model: RuleDefinition,
        //         },
        //         {
        //             model: Project,
        //         },
        //         {
        //             model: Department,
        //         },
        //         {
        //             model: Pic,
        //         },
        //     ],

        //     // where: {
        //     //     [Op.or]: [
        //     //         [queries.searchOr],
        //     //         {
        //     //             [Op.and]: [
        //     //                 { '$RuleDefinition.Name$': { [Op.like]: `%${req.query.keyword}%` } },
        //     //                 { '$Project.Code$': { [Op.like]: `%${req.query.keyword}%` } },
        //     //             ],
        //     //         },
        //     //     ],
        //     // },

        //     distinct: true,
        //     limit: queries.limit,
        //     offset: queries.offset,
        // });
        // return point;
        const { Year, Month } = req.query;

        let where = {};
        if (Month) {
            where = {
                DepartmentID: req.query.DepartmentID,
                UserMasterID: req.query.UserMasterID,
                Month: Month,
                Year: Year,
            };
        } else
            where = {
                DepartmentID: req.query.DepartmentID,
                UserMasterID: req.query.UserMasterID,

                Year: Year,
            };

        if (req.query.CreatedBy) {
            where = {
                DepartmentID: req.query.DepartmentID,
            };

            where.Confirmer = req.query.CreatedBy;
        }

        if (req.query.keyword) {
            where[Op.and] = [
                {
                    [Op.or]: [
                        { Note: { [Op.like]: `%${req.query.keyword}%` } },

                        { '$RuleDefinition.Name$': { [Op.like]: `%${req.query.keyword}%` } },

                        { '$Project.Code$': { [Op.like]: `%${req.query.keyword}%` } },

                        { CreatedBy: { [Op.like]: `%${req.query.keyword}%` } },
                    ],
                },
            ];
        }
        const validSortFields = ['PointOfRule', 'CreatedDate'];

        let order = [];
        if (req.query.sort && validSortFields.includes(req.query.sort.split(':')[0])) {
            order.push(req.query.sort.split(':'));
        }

        let limit, offset;

        if (req.query.page && req.query.row) {
            limit = parseInt(req.query.row);

            offset = (parseInt(req.query.page) - 1) * limit;
        }

        const result = await Point.findAndCountAll({
            include: [{ model: UserMaster }, { model: RuleDefinition }, { model: Project }, { model: Department }],

            where,

            order,

            limit,

            offset,
        });
        return result;
    }

    async fncRequestHistory(req, next) {
        const { DepartmentID, UserMasterID } = req.query;
        const validSortFields = ['PointOfRule', 'CreatedDate'];

        const findUser = await UserMaster.findOne({
            where: {
                ID: UserMasterID,
                DepartmentID: DepartmentID,
            },
        });

        let where = {
            DepartmentID: DepartmentID,
            UserMasterID: UserMasterID,
            [Op.or]: [{ Status: 2 }, { Status: 3 }, { Status: 4 }],
        };
        if (req.query.Confirmer) {
            where = {
                DepartmentID: DepartmentID,
                [Op.or]: [{ Status: 2 }, { Status: 3 }, { Status: 4 }],
                Confirmer: findUser.Account,
            };
        }
        if (req.query.Approver) {
            where = {
                DepartmentID: DepartmentID,
                [Op.or]: [{ Status: 3 }, { Status: 4 }],
                Approver: findUser.Account,
            };
        }
        if (req.query.Status) {
            where.Status = req.query.Status;
        }
        if (req.query.keyword) {
            if (req.query.Confirmer || req.query.Approver) {
                where[Op.and] = [
                    { [Op.or]: [{ Confirmer: findUser.Account }, { Approver: findUser.Account }] },
                    {
                        [Op.or]: [
                            { Note: { [Op.like]: `%${req.query.keyword}%` } },
                            { '$RuleDefinition.Name$': { [Op.like]: `%${req.query.keyword}%` } },
                            { '$Project.Key$': { [Op.like]: `%${req.query.keyword}%` } },
                            { Confirmer: { [Op.like]: `%${req.query.keyword}%` } },
                            { Approver: { [Op.like]: `%${req.query.keyword}%` } },
                            { '$UserMaster.Account$': { [Op.like]: `%${req.query.keyword}%` } },
                        ],
                    },
                ];
            } else {
                where = {
                    DepartmentID: DepartmentID,
                    CreatedBy: findUser.Account,
                };
                where[Op.and] = [
                    {
                        [Op.or]: [
                            { Note: { [Op.like]: `%${req.query.keyword}%` } },
                            { '$RuleDefinition.Name$': { [Op.like]: `%${req.query.keyword}%` } },
                            { '$Project.Key$': { [Op.like]: `%${req.query.keyword}%` } },
                            { Confirmer: { [Op.like]: `%${req.query.keyword}%` } },
                            { Approver: { [Op.like]: `%${req.query.keyword}%` } },
                            { '$UserMaster.Account$': { [Op.like]: `%${req.query.keyword}%` } },
                        ],
                    },
                ];
            }
        }

        let order = [];
        if (req.query.sort && validSortFields.includes(req.query.sort.split(':')[0])) {
            order.push(req.query.sort.split(':'));
        }

        let limit, offset;
        if (req.query.page && req.query.row) {
            limit = parseInt(req.query.row);
            offset = (parseInt(req.query.page) - 1) * limit;
        }
        const result = await Point.findAndCountAll({
            include: [{ model: UserMaster }, { model: RuleDefinition }, { model: Project }, { model: Department }],
            where,
            order,
            limit,
            offset,
        });
        return result;
    }

    async fncUpdateOne(req, res, next) {
        const { id } = req.params;
        const { RuleDefinitionID, ProjectID, Status, Approver, Times, Evidence, Month, Year } = req.body;
        const { DepartmentID } = req.query;
        const findOldPoint = await this.fncFindOne(req);
        if (!findOldPoint) return next(new ErrorResponse(404, 'Point not found'));
        const findRuleDefinition = await RuleDefinition.findOne({ where: { ID: RuleDefinitionID ?? findOldPoint.RuleDefinitionID } });

        const findPic = await Pic.findOne({ where: { RuleDefinitionID: RuleDefinitionID ?? findRuleDefinition.ID } });

        // if this rule has pic account to review point
        let findPicAccount;
        if (findPic) findPicAccount = await UserMaster.findOne({ where: { ID: findPic?.UserMasterID } });

        const findProject = await Project.findOne({
            where: { ID: ProjectID ?? findOldPoint.ProjectID },
            include: [
                {
                    model: UserMaster,
                    as: 'Manager',
                },
            ],
        });

        const today = new Date();
        if (today.getFullYear() < Year || (today.getFullYear() === Year && today.getMonth() + 1 < Month)) {
            return next(new ErrorResponse(404, `Input time not valid`));
        }
        const findSetting = await Setting.findOne({
            where: { DepartmentID: DepartmentID },
        });
        if (findSetting) {
            today.setDate(today.getDate() - findSetting.ValidDistantTime);
            if (today.getFullYear() > Year || (today.getFullYear() === Year && today.getMonth() + 1 > Month)) {
                return next(new ErrorResponse(404, `Time of request must after ${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`));
            }
        }
        const findApprover = await UserMaster.findOne({
            where: { ID: Approver ?? findOldPoint.Approver, DepartmentID: DepartmentID },
        });
        const findDefaultHead = await DefaultHead.findOne({
            where: { DepartmentID: DepartmentID },
        });
        const accountDefaultHead = await UserMaster.findOne({
            where: { ID: findDefaultHead?.HeadID },
        });
        const findPro = findProject.Manager?.Account ?? undefined;
        const point = await Point.update(
            {
                ...req.body,
                ProjectID: ProjectID ?? findOldPoint.ProjectID,
                Confirmer: ProjectID ? findProject.Manager?.Account ?? null : findOldPoint.Confirmer,
                Approver: findPicAccount?.Account ?? findApprover?.Account ?? findOldPoint.Approver ?? accountDefaultHead.Account,
                isConfirmed: Status == 2 ? true : false,
                Status: Status ? Status : findPro ? 1 : 2,
                Evidence: !req.file ? Evidence : `/public/images/${req.file.filename}`,
                // Times: Times ?? findOldPoint.Times,
                PointOfRule:
                    RuleDefinitionID !== null
                        ? Times
                            ? findRuleDefinition.PointNumber * Times
                            : findOldPoint.PointOfRule
                        : findRuleDefinition.PointNumber * (Times ?? findOldPoint.Times),
                UpdatedBy: getAccountFromToken(req),
            },
            { where: { ID: id } }
        );
        if (Status === 3) {
            if (point) {
                const findPoint = await Point.findOne({
                    where: { ID: id },
                });
                const data = [];

                const findUser = await UserMaster.findOne({
                    where: { ID: findPoint.UserMasterID },
                });

                data.push({
                    UserMasterID: findPoint.UserMasterID,
                    DepartmentID: findPoint.DepartmentID,
                    Month: findPoint.Month,
                    Year: findPoint.Year,
                    UserContractType: findUser.UserContractType,
                    UserStatus: findUser.UserStatus,

                    PointOfRule: findPoint.PointOfRule,
                });
                await this.fncUpdateRanking(data);
                const point = await Point.update(
                    {
                        UserContractType: findUser.ContractType,
                        UserStatus: findUser.Status,
                    },
                    { where: { ID: id } }
                );
                const setting = await Setting.findOne({
                    where: { DepartmentID: DepartmentID },
                });

                if (setting && setting.ConversionRatio) {
                    if (findPoint.PointOfRule <= 0) {
                        if (setting.AllowMinus === 1) {
                            let currentCoin = findUser.TotalCoin;
                            if (findUser.TotalCoin === null) currentCoin = 0;

                            const plusCoin = findPoint.PointOfRule * setting.ConversionRatio;
                            const updateCoin = await UserMaster.update(
                                {
                                    TotalCoin: currentCoin + plusCoin,
                                },
                                {
                                    where: { ID: findUser.ID },
                                }
                            );

                            const walletHistory = await UserWallet.create({
                                UserReceive: findUser.ID,
                                DepartmentID: DepartmentID,
                                CoinNumber: findPoint.PointOfRule,
                                TransactionMethod: 3,
                                UserStatus: findUser.Status,
                                UserContractType: findUser.ContractType,
                                PointID: point.ID,
                                Message: `Get ${plusCoin} ${setting.CoinName} from ${findRuleDefinition.Name}`,
                                UserSend: null,
                            });
                        } else {
                            const plusCoin = findPoint.PointOfRule * setting.ConversionRatio;
                            const walletHistory = await UserWallet.create({
                                UserReceive: findUser.ID,
                                DepartmentID: DepartmentID,
                                CoinNumber: findPoint.PointOfRule,
                                TransactionMethod: 3,
                                PointID: point.ID,
                                Message: `Get ${plusCoin} ${setting.CoinName} from ${findRuleDefinition.Name}`,
                                UserSend: null,
                            });
                        }
                    } else {
                        let currentCoin = findUser.TotalCoin;
                        if (findUser.TotalCoin === null) currentCoin = 0;

                        const plusCoin = findPoint.PointOfRule * setting.ConversionRatio;

                        const walletHistory = await UserWallet.create({
                            UserReceive: findUser.ID,
                            DepartmentID: DepartmentID,
                            CoinNumber: findPoint.PointOfRule,
                            TransactionMethod: 3,
                            PointID: point.ID,
                            Message: `Get ${plusCoin} ${setting.CoinName} from ${findRuleDefinition.Name}`,
                            UserSend: null,
                        });
                        const updateCoin = await UserMaster.update(
                            {
                                TotalCoin: currentCoin + plusCoin,
                            },
                            {
                                where: { ID: findUser.ID },
                            }
                        );
                    }
                }
                let storePointIntegrateData = [];
                let dataRule = [];

                async function processRuleIntegrate(ruleID) {
                    const checkIntegrate = await RuleDefinition.findAll({
                        where: { Integrate: ruleID },
                    });
                    const arrayDepartment = checkIntegrate.map((x) => x.ID);

                    if (arrayDepartment.length !== 0) {
                        dataRule.push(arrayDepartment);
                        for await (let el of arrayDepartment) {
                            const ruleIntegrate = await RuleDefinition.findOne({
                                where: { ID: el },
                            });
                            const findUserIntegrate = await UserMaster.findOne({
                                where: { Account: findUser.Account, DepartmentID: ruleIntegrate.DepartmentID },
                            });
                            const findPic = await Pic.findOne({ where: { RuleDefinitionID: RuleDefinitionID ?? findRuleDefinition.ID } });

                            // if this rule has pic account to review point
                            let findPicAccount;
                            if (findPic) findPicAccount = await UserMaster.findOne({ where: { ID: findPic?.UserMasterID } });

                            // if (findPicIntegrate) let findPicAccountIntegrate = await UserMaster.findOne({ where: { ID: findPicIntegrate?.UserMasterID } });
                            if (findUserIntegrate) {
                                storePointIntegrateData.push({
                                    UserMasterID: findUserIntegrate?.ID ?? null,
                                    RuleDefinitionID: ruleIntegrate?.ID ?? null,
                                    Note: 'Point from intergrate',
                                    ProjectID: findProject.ID,
                                    Approver: findPicAccount?.Account ?? findApprover?.Account ?? findOldPoint.Approver ?? accountDefaultHead.Account,
                                    isApproved: true,
                                    RequestType: 3,
                                    isConfirmed: true,
                                    Status: Status ? Status : findPro ? 1 : 2,
                                    Month: findPoint.Month,
                                    Year: findPoint.Year,
                                    Evidence: !req.file ? Evidence : `/public/images/${req.file.filename}`,
                                    UserContractType: findUserIntegrate.ContractType ?? null,
                                    UserStatus: findUserIntegrate.Status ?? null,
                                    // PointOfRule: isMonthlyPerformance ? inputData.Effort * inputData.KPer * findRuleDefinition.PointNumber : findRuleDefinition.PointNumber * inputData.Times,
                                    PointOfRule:
                                        RuleDefinitionID !== null
                                            ? Times
                                                ? ruleIntegrate.PointNumber * Times
                                                : ruleIntegrate.PointNumber
                                            : ruleIntegrate.PointNumber * (Times ?? ruleIntegrate.PointNumber),
                                    DepartmentID: ruleIntegrate.DepartmentID,
                                });
                            }
                            await processRuleIntegrate(el);
                        }
                    }
                }

                // Call the recursive function with the initial ruleIntegrate
                await processRuleIntegrate(findRuleDefinition.ID);
                if (storePointIntegrateData.length !== 0) {
                    await this.fncUpdateRanking(storePointIntegrateData);
                    for await (let el of storePointIntegrateData) {
                        const create = await Point.create(el);
                        if (dataRule.length > 0 && create) {
                            for await (let ele of dataRule) {
                                const ruleIntegrate = await RuleDefinition.findOne({
                                    where: { ID: ele },
                                });
                                const findUserIntegrate = await UserMaster.findOne({
                                    where: { ID: el.UserMasterID },
                                });

                                if (findUserIntegrate) {
                                    const setting = await Setting.findOne({
                                        where: { DepartmentID: ruleIntegrate.DepartmentID },
                                    });

                                    if (setting && setting.ConversionRatio) {
                                        if (el.PointOfRule < 0) {
                                            if (setting.AllowMinus === 1) {
                                                let currentCoin = findUserIntegrate.TotalCoin;
                                                if (findUserIntegrate.TotalCoin === null) currentCoin = 0;

                                                const plusCoin = el.PointOfRule * setting.ConversionRatio;
                                                const updateCoin = await UserMaster.update(
                                                    {
                                                        TotalCoin: currentCoin + plusCoin,
                                                    },
                                                    {
                                                        where: { ID: findUserIntegrate.ID },
                                                    }
                                                );

                                                const walletHistory = await UserWallet.create({
                                                    UserReceive: findUserIntegrate.ID,
                                                    DepartmentID: ruleIntegrate.DepartmentID,
                                                    CoinNumber: plusCoin,
                                                    TransactionMethod: 3,
                                                    PointID: create.ID,
                                                    Message: `Get ${plusCoin} ${setting.CoinName} from ${ruleIntegrate.Name}`,
                                                    UserSend: null,
                                                });
                                            }
                                        } else {
                                            let currentCoin = findUserIntegrate.TotalCoin;
                                            if (findUserIntegrate.TotalCoin === null) currentCoin = 0;
                                            const plusCoin = el.PointOfRule * setting.ConversionRatio;
                                            const updateCoin = await UserMaster.update(
                                                {
                                                    TotalCoin: currentCoin + plusCoin,
                                                },
                                                {
                                                    where: { ID: findUserIntegrate.ID },
                                                }
                                            );
                                            const walletHistory = await UserWallet.create({
                                                UserReceive: findUserIntegrate.ID,
                                                DepartmentID: ruleIntegrate.DepartmentID,
                                                CoinNumber: plusCoin,
                                                TransactionMethod: 3,
                                                PointID: create.ID,
                                                Message: `Get ${plusCoin} ${setting.CoinName} from ${ruleIntegrate.Name}`,
                                                UserSend: null,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // if (point) {
        //     switch (Status) {
        //         case 2:
        //             await MailService.fncPMAprroveSendMail(req);
        //             await MailService.fncSendMailToBUL(req, undefined, undefined, Approver);
        //             break;
        //         case 3:
        //             await MailService.fncBULAprroveSendMail(req);
        //             break;
        //         case 4:
        //             await MailService.fncRejectSendMail(req);
        //             break;
        //     }
        // }
        return point;
    }

    async fncUpdateMultipleStatus(req, res, next) {
        const { PointID, Status } = req.body;
        const { DepartmentID } = req.query;

        const found = await Point.findAndCountAll({
            // array include multiple Point ID
            where: { ID: PointID },
        });
        // compare array ID point in request with valid ID point in DB
        if (PointID.length !== found.count) {
            return next(new ErrorResponse(404, 'Some point cannot found'));
        } else {
            const point = await Point.update(
                { Status: Status },
                {
                    where: { ID: PointID },
                }
            );
            let storePointIntegrateData = [];
            if (Status == 3)
                if (point) {
                    // await MailService.fncSendMailToManyUser(req);
                    for await (let id of PointID) {
                        const findPoint = await Point.findOne({
                            where: { ID: id },
                        });

                        const findUser = await UserMaster.findOne({
                            where: { ID: findPoint.UserMasterID },
                        });

                        const setting = await Setting.findOne({
                            where: { DepartmentID: DepartmentID },
                        });
                        if (!setting) {
                            return next(new ErrorResponse(404, 'Setting not found'));
                        }
                        const findRuleDefinition = await RuleDefinition.findOne({
                            where: { ID: findPoint.RuleDefinitionID ?? findPoint.RuleDefinitionID },
                        });
                        if (setting && setting.ConversionRatio) {
                            if (findPoint.PointOfRule < 0) {
                                if (setting.AllowMinus === 1) {
                                    let currentCoin = findUser.TotalCoin;
                                    if (findUser.TotalCoin === null) currentCoin = 0;

                                    const plusCoin = findPoint.PointOfRule * setting.ConversionRatio;
                                    const updateCoin = await UserMaster.update(
                                        {
                                            TotalCoin: currentCoin + plusCoin,
                                        },
                                        {
                                            where: { ID: findUser.ID },
                                        }
                                    );

                                    const walletHistory = await UserWallet.create({
                                        UserReceive: findUser.ID,
                                        DepartmentID: DepartmentID,
                                        CoinNumber: findPoint.PointOfRule,
                                        TransactionMethod: 3,
                                        Message: `Get ${plusCoin} ${setting.CoinName} from ${findRuleDefinition.Name}`,
                                        UserSend: null,
                                        PointID: id,
                                    });
                                }
                            } else {
                                let currentCoin = findUser.TotalCoin;
                                if (findUser.TotalCoin === null) currentCoin = 0;

                                const plusCoin = findPoint.PointOfRule * setting.ConversionRatio;

                                const updateCoin = await UserMaster.update(
                                    {
                                        TotalCoin: currentCoin + plusCoin,
                                    },
                                    {
                                        where: { ID: findUser.ID },
                                    }
                                );

                                const walletHistory = await UserWallet.create({
                                    UserReceive: findUser.ID,
                                    DepartmentID: DepartmentID,
                                    CoinNumber: findPoint.PointOfRule,
                                    TransactionMethod: 3,
                                    Message: `Get ${plusCoin} ${setting.CoinName} from ${findRuleDefinition.Name}`,
                                    UserSend: null,
                                    PointID: id,
                                });
                            }
                        }
                        let dataRule = [];
                        async function processRuleIntegrate(ruleID) {
                            const checkIntegrate = await RuleDefinition.findAll({
                                where: { Integrate: ruleID },
                            });
                            const arrayRule = checkIntegrate.map((x) => x.ID);

                            if (arrayRule.length !== 0) {
                                dataRule.push(arrayRule);
                                for await (let el of arrayRule) {
                                    const ruleIntegrate = await RuleDefinition.findOne({
                                        where: { ID: el },
                                    });
                                    const findUserIntegrate = await UserMaster.findOne({
                                        where: { Account: findUser.Account, DepartmentID: ruleIntegrate.DepartmentID },
                                    });
                                    const findPic = await Pic.findOne({ where: { RuleDefinitionID: el } });

                                    // if this rule has pic account to review point
                                    let findPicAccount;
                                    if (findPic) findPicAccount = await UserMaster.findOne({ where: { ID: findPic?.UserMasterID } });

                                    // if (findPicIntegrate) let findPicAccountIntegrate = await UserMaster.findOne({ where: { ID: findPicIntegrate?.UserMasterID } });
                                    if (findUserIntegrate) {
                                        storePointIntegrateData.push({
                                            UserMasterID: findUserIntegrate?.ID ?? null,
                                            RuleDefinitionID: ruleIntegrate?.ID ?? null,
                                            Note: 'Point from intergrate',
                                            isApproved: true,
                                            RequestType: 3,
                                            isConfirmed: true,
                                            Status: 3,
                                            Month: findPoint.Month,
                                            Year: findPoint.Year,
                                            Times: findPoint.Times ? findPoint.Times : 1,
                                            UserContractType: findUserIntegrate.ContractType ?? null,
                                            UserStatus: findUserIntegrate.Status ?? null,
                                            // PointOfRule: isMonthlyPerformance ? inputData.Effort * inputData.KPer * findRuleDefinition.PointNumber : findRuleDefinition.PointNumber * inputData.Times,
                                            PointOfRule:
                                                ruleIntegrate !== null
                                                    ? findPoint.Times
                                                        ? ruleIntegrate.PointNumber * findPoint.Times
                                                        : ruleIntegrate.PointNumber
                                                    : ruleIntegrate.PointNumber * (findPoint.Times ?? ruleIntegrate.PointNumber),
                                            DepartmentID: ruleIntegrate.DepartmentID,
                                        });
                                    }
                                    await processRuleIntegrate(el);
                                }
                            }
                        }

                        // Call the recursive function with the initial ruleIntegrate
                        await processRuleIntegrate(findRuleDefinition.ID);
                        if (storePointIntegrateData.length !== 0) {
                            for await (let el of storePointIntegrateData) {
                                const create = await Point.create(el);
                                if (dataRule.length > 0 && create) {
                                    for await (let ele of dataRule) {
                                        const ruleIntegrate = await RuleDefinition.findOne({
                                            where: { ID: ele },
                                        });
                                        const findUserIntegrate = await UserMaster.findOne({
                                            where: { ID: el.UserMasterID },
                                        });

                                        if (findUserIntegrate) {
                                            const setting = await Setting.findOne({
                                                where: { DepartmentID: ruleIntegrate.DepartmentID },
                                            });

                                            if (setting && setting.ConversionRatio) {
                                                if (el.PointOfRule < 0) {
                                                    if (setting.AllowMinus === 1) {
                                                        let currentCoin = findUserIntegrate.TotalCoin;
                                                        if (findUserIntegrate.TotalCoin === null) currentCoin = 0;

                                                        const plusCoin = el.PointOfRule * setting.ConversionRatio;
                                                        const updateCoin = await UserMaster.update(
                                                            {
                                                                TotalCoin: currentCoin + plusCoin,
                                                            },
                                                            {
                                                                where: { ID: findUserIntegrate.ID },
                                                            }
                                                        );

                                                        const walletHistory = await UserWallet.create({
                                                            UserReceive: findUserIntegrate.ID,
                                                            DepartmentID: ruleIntegrate.DepartmentID,
                                                            CoinNumber: plusCoin,
                                                            TransactionMethod: 3,
                                                            PointID: create.ID,
                                                            Message: `Get ${plusCoin} ${setting.CoinName} from ${ruleIntegrate.Name}`,
                                                            UserSend: null,
                                                        });
                                                    }
                                                } else {
                                                    let currentCoin = findUserIntegrate.TotalCoin;
                                                    if (findUserIntegrate.TotalCoin === null) currentCoin = 0;
                                                    const plusCoin = el.PointOfRule * setting.ConversionRatio;
                                                    const updateCoin = await UserMaster.update(
                                                        {
                                                            TotalCoin: currentCoin + plusCoin,
                                                        },
                                                        {
                                                            where: { ID: findUserIntegrate.ID },
                                                        }
                                                    );
                                                    const walletHistory = await UserWallet.create({
                                                        UserReceive: findUserIntegrate.ID,
                                                        DepartmentID: ruleIntegrate.DepartmentID,
                                                        CoinNumber: plusCoin,
                                                        TransactionMethod: 3,
                                                        PointID: create.ID,
                                                        Message: `Get ${plusCoin} ${setting.CoinName} from ${ruleIntegrate.Name}`,
                                                        UserSend: null,
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            return point;
        }
    }

    async fncGetYearOfAllPoint(req) {
        const { DepartmentID } = req.params;
        const listPoint = await Point.findAll({
            order: [['Year', 'ASC']],
            where: { DepartmentID: DepartmentID },
            raw: true,
        });
        const today = new Date();

        let unique = [...new Set(listPoint.map((item) => item.Year))];

        const exist = unique.some((year) => year === today.getFullYear());
        if (!exist) {
            unique.push(today.getFullYear());
        }

        unique = unique.filter((item) => item !== null);
        return unique;
    }

    async fncDeleteOne(req, res, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Point not found'));

        return Point.update(
            // 5 is deleted
            { Status: 5 },
            {
                where: { ID: +id },
            }
        );
    }
    async fncUpdateRanking(Point) {
        if (Point.length !== 0) {
            for await (let element of Point) {
                const check = await Ranking.findOne({ where: { UserMasterID: element.UserMasterID, Month: element.Month, Year: element.Year } });
                if (check) {
                    if (element.PointOfRule > 0) {
                        await Ranking.update(
                            {
                                total_point: check.total_point + element.PointOfRule,
                                point_plus: check.point_plus + element.PointOfRule,
                            },
                            { where: { UserMasterID: element.UserMasterID, Month: element.Month, Year: element.Year } }
                        );
                        const checkYear = await Ranking.findOne({ where: { UserMasterID: element.UserMasterID, Month: 13, Year: element.Year } });
                        await Ranking.update(
                            {
                                total_point: checkYear.total_point + element.PointOfRule,
                                point_plus: checkYear.point_plus + element.PointOfRule,
                            },
                            { where: { UserMasterID: element.UserMasterID, Month: 13, Year: element.Year } }
                        );
                    } else {
                        await Ranking.update(
                            {
                                total_point: check.total_point + element.PointOfRule,
                                point_minus: check.point_minus + element.PointOfRule,
                            },
                            { where: { UserMasterID: element.UserMasterID, Month: element.Month, Year: element.Year } }
                        );
                        const checkYear = await Ranking.findOne({ where: { UserMasterID: element.UserMasterID, Month: 13, Year: element.Year } });
                        await Ranking.update(
                            {
                                total_point: checkYear.total_point + element.PointOfRule,
                                point_minus: checkYear.point_minus + element.PointOfRule,
                            },
                            { where: { UserMasterID: element.UserMasterID, Month: 13, Year: element.Year } }
                        );
                    }
                } else {
                    if (element.PointOfRule > 0) {
                        await Ranking.create({
                            UserMasterID: element.UserMasterID,
                            DepartmentID: element.DepartmentID,
                            Month: element.Month,
                            Year: element.Year,
                            UserContractType: element.UserContractType,
                            UserStatus: element.UserStatus,
                            total_point: element.PointOfRule,
                            point_plus: element.PointOfRule,
                        });
                        const checkYear = await Ranking.findOne({ where: { UserMasterID: element.UserMasterID, Month: 13, Year: element.Year } });
                        if (!checkYear)
                            await Ranking.create({
                                UserMasterID: element.UserMasterID,
                                DepartmentID: element.DepartmentID,
                                Month: 13,
                                Year: element.Year,
                                UserContractType: element.UserContractType,
                                UserStatus: element.UserStatus,
                                total_point: element.PointOfRule,
                                point_plus: element.PointOfRule,
                            });
                        else
                            await Ranking.update(
                                {
                                    total_point: checkYear.total_point + element.PointOfRule,
                                    point_plus: checkYear.point_plus + element.PointOfRule,
                                },
                                { where: { UserMasterID: element.UserMasterID, Month: 13, Year: element.Year } }
                            );
                    } else {
                        await Ranking.create({
                            UserMasterID: element.UserMasterID,
                            DepartmentID: element.DepartmentID,
                            Month: element.Month,
                            Year: element.Year,
                            UserContractType: element.UserContractType,
                            UserStatus: element.UserStatus,
                            total_point: element.PointOfRule,
                            point_minus: element.PointOfRule,
                        });
                        const checkYear = await Ranking.findOne({ where: { UserMasterID: element.UserMasterID, Month: 13, Year: element.Year } });
                        if (!checkYear)
                            await Ranking.create({
                                UserMasterID: element.UserMasterID,
                                DepartmentID: element.DepartmentID,
                                Month: 13,
                                Year: element.Year,
                                UserContractType: element.UserContractType,
                                UserStatus: element.UserStatus,
                                total_point: element.PointOfRule,
                                point_minus: element.PointOfRule,
                            });
                        else
                            await Ranking.update(
                                {
                                    total_point: checkYear.total_point + element.PointOfRule,
                                    point_minus: checkYear.point_minus + element.PointOfRule,
                                },
                                { where: { UserMasterID: element.UserMasterID, Month: 13, Year: element.Year } }
                            );
                    }
                }
            }
        }
    }
}

module.exports = new PointService();
