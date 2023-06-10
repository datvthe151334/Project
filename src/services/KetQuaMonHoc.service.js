const { Op } = require('sequelize');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/error-response');
// @ts-ignore
const { DefaultHead, Department, UserMaster } = require('../models');
const getAccountFromToken = require('../utils/account-token');
class DefaultHeadService {
    async fncFindOne(req) {
        const { id } = req.params;

        return DefaultHead.findOne({
            where: { ID: id },
            include: [
                {
                    model: UserMaster,
                },
                {
                    model: Department,
                },
            ],
        });
    }

    async fncCreateOne(req) {
        const { HeadID, DepartmentID, Account } = req.body;

        let found = await UserMaster.findOne({
            where: { Account: Account, DepartmentID: DepartmentID },
        });

        if (!found) {
            const findUser = await UserMaster.findOne({
                where: { Account: Account },
                raw: true,
            });
            if (findUser !== null) {
                delete findUser.ID;
                delete findUser.DepartmentID;
                delete findUser.ContractType;
                delete findUser.TotalCoin;
                let createUser = await UserMaster.create({
                    ...findUser,
                    ContractType: 1,
                    RoleID: 2,
                    DepartmentID: DepartmentID,
                });
                if (createUser)
                    return DefaultHead.create({
                        DepartmentID,
                        HeadID: createUser.ID,
                    });
                else return next(new ErrorResponse(400, 'Create new default head fail'));
            } else {
                const createUser = await UserMaster.create({
                    Account: Account,
                    ContractType: 1,
                    RoleID: 2,
                    DepartmentID: DepartmentID,
                });
                if (createUser)
                    return DefaultHead.create({
                        DepartmentID,
                        HeadID: createUser.ID,
                    });
                else return next(new ErrorResponse(400, 'Create new default head fail'));
            }
        } else {
            const newUser = await UserMaster.findOne({
                where: { Account: Account, DepartmentID: DepartmentID },
            });

            const update = await UserMaster.update(
                {
                    RoleID: 2,
                },
                {
                    where: { ID: newUser.ID },
                }
            );
            return DefaultHead.create({
                DepartmentID,
                HeadID: newUser.ID,
            });
        }
    }
    async fncFindAll(req) {
        const queries = queryParams(req.query, Op, [], ['HeadID', 'DepartmentID', 'CreatedDate', 'UpdatedDate']);

        return DefaultHead.findAndCountAll({
            order: queries.order,
            where: queries.searchOr,
            include: [
                {
                    model: UserMaster,
                },
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
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Default head not found'));

        return DefaultHead.update(
            {
                ...req.body,
            },
            {
                where: { ID: id },
            }
        );
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Default head not found'));

        return DefaultHead.destroy({
            where: { ID: id },
        });
    }
}

module.exports = new DefaultHeadService();
