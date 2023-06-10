const { Op, ENUM } = require('sequelize');
const cheerio = require('cheerio');
const queryParams = require('../utils/query-params');
// @ts-ignore
const { UserMaster, Department, Api, Template, Synchronize, RuleDefinition } = require('../models');
const ErrorResponse = require('../libs/error-response');

class GradeService {
    async fncCreateOne(req, next) {
        const { DepartmentID } = req.body;
        const create = req.body;

        const UserMasterAcc = `${req.authInfo?.preferred_username.split('@')[0]}` ?? 'TruongPH1';
        // const UserMasterAcc = "TruongPH1"
        const department = await Department.findOne({
            where: {
                ID: DepartmentID,
            },
        });
        if (!department) return next(new ErrorResponse(404, 'Department not exist'));

        const usermaster = await UserMaster.findOne({
            where: { Account: UserMasterAcc },
        });
        if (!usermaster) {
            return next(new ErrorResponse(404, 'UserMaster not found '));
        }

        // if (Type == 3) {
        //     const usermasterbook = await UserMaster.findOne({
        //         where: { ID: UserMasterBookID },
        //     });

        //     if (usermasterbook.RoleID == 1 || usermasterbook.RoleID == 4) {
        //         return next(new ErrorResponse(404, 'Usermasterbook role not valid '));
        //     }

        //     if (!usermasterbook) {
        //         return next(new ErrorResponse(404, 'UserMasterBook not found '));
        //     }
        // }

        return Api.create({
            ...create,
            // CreatedBy: `${req.authInfo?.preferred_username.split('@')[0]}`
        });
    }
    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const foundApi = await this.fncFindOne(req);

        const update = req.body;

        if (!foundApi) return next(new ErrorResponse(404, 'Api not found'));
        return Api.update(
            {
                ...update,
            },
            {
                where: { ID: id },
            }
        );
    }
    async fncFindAll(req) {
        const { DepartmentID } = req.query;
        return Api.findAndCountAll({
            where: {
                DepartmentID: DepartmentID,
            },
            order: [['CreatedDate', 'DESC']],
            distinct: true,
        });
    }

    async fncFindOne(req) {
        const { id } = req.params;

        return Api.findOne({
            where: { ID: id },
            include: [
                {
                    model: Template,
                    as: 'Template',
                },
            ],
        });
    }
    async fncDeleteOne(req, next) {
        const { id } = req.params;
        const foundApi = await this.fncFindOne(req);

        if (!foundApi) return next(new ErrorResponse(404, 'Api not found'));

        return Api.destroy({
            where: { ID: id },
        });
    }
    async fncConfigApiTemplate(req, next) {
        const {
            Header,
            SampleData,
            DepartmentID,
            ApiID,
            Condition,
            FormulaCaculator,
            AccountPropertyRefer,
            ProjectIDPropertyRefer,
            NotePropertyRefer,
            MappingData,
            RuleDefinitionID,
            TimeRun,
        } = req.body;
        const foundApi = await Api.findOne({
            where: {
                ID: ApiID,
            },
        });
        if (!foundApi) return next(new ErrorResponse(404, 'Api not found'));
        const foundRule = await RuleDefinition.findOne({
            where: {
                ID: RuleDefinitionID,
                DepartmentID: DepartmentID,
            },
        });
        if (!foundRule) return next(new ErrorResponse(404, 'Rule not found'));
        const foundSynchonize = await Synchronize.findOne({
            where: {
                ApiID: ApiID,
                RuleDefinitionID: RuleDefinitionID,
                Type: 2,
            },
        });
        if (!foundSynchonize) {
            await Synchronize.create({
                RuleDefinitionID: RuleDefinitionID,
                ApiID: ApiID,
                ProjectID: ProjectIDPropertyRefer ? ProjectIDPropertyRefer : null,
                Note: NotePropertyRefer ? NotePropertyRefer : null,
                Condition: Condition,
                CaculationFormula: FormulaCaculator,
                ApplyFor: AccountPropertyRefer,
                DepartmentID: DepartmentID,
                Type: 2,
                TimeRun: TimeRun,
                // CreatedBy: `${req.authInfo?.preferred_username.split('@')[0]}`
            });
        } else {
            await Synchronize.update(
                {
                    ProjectID: ProjectIDPropertyRefer ? ProjectIDPropertyRefer : null,
                    Note: NotePropertyRefer ? NotePropertyRefer : null,
                    Condition: Condition,
                    CaculationFormula: FormulaCaculator,
                    ApplyFor: AccountPropertyRefer,
                    DepartmentID: DepartmentID,
                    Type: 2,
                    TimeRun: TimeRun,
                    // CreatedBy: `${req.authInfo?.preferred_username.split('@')[0]}`
                },
                {
                    where: { ApiID: ApiID, RuleDefinitionID: RuleDefinitionID, Type: 2 },
                }
            );
        }
        const updateRule = await RuleDefinition.update(
            {
                ApiID: foundApi.ID,
                // CreatedBy: `${req.authInfo?.preferred_username.split('@')[0]}`
            },
            {
                where: { ID: RuleDefinitionID, DepartmentID: DepartmentID },
            }
        );
        const ApiUpdate = await Api.update(
            {
                DataMapping: MappingData,
                Header: Header,
                SampleData: SampleData,
                DepartmentID: DepartmentID,
            },
            {
                where: { ID: ApiID },
            }
        );
        if (ApiUpdate) SynchronusController.scheduleAutoSyncApiByStart();

        return ApiUpdate;
    }
}

module.exports = new GradeService();
