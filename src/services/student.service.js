const { Op } = require('sequelize');
// @ts-ignore
const { GroupChild, Department, UserMaster } = require('../models');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/error-response');
const getAccountFromToken = require('../utils/account-token');
class GroupChildService {
    async fncFindOne(req) {
        const { id } = req.params;

        return GroupChild.findOne({
            where: { ID: id },
        });
    }

    async fncCreateOne(req, next) {
        const { UserMasterID, Code, DepartmentID } = req.body;
        const listUser = [];
        const department = Department.findOne({
            where: { Code: Code },
        });

        for await (let el of UserMasterID) {
            const user = await UserMaster.findOne({
                where: { ID: el },
            });

            if (!user) return next(new ErrorResponse(400, `Some User not found`));
            else
                listUser.push({
                    UserMasterID: el,
                    DepartmentID: DepartmentID,
                    Account: user.Account,
                    Code: Code,
                    CreatedBy: getAccountFromToken(req),
                });
        }
        await GroupChild.destroy({
            where: { Code: Code, DepartmentID: DepartmentID },
        });
        const create = GroupChild.bulkCreate(listUser);
        return create;
    }

    async fncFindAll(req) {
        const { DepartmentID } = req.query;

        const queries = queryParams(
            req.query,
            Op,
            //
            ['Code', 'Status'],
            ['Code', 'Status', 'CreatedBy']
        );
        return GroupChild.findAndCountAll({
            order: queries.order,
            where: {
                [Op.and]: [
                    queries.searchOr,
                    {
                        DepartmentID: DepartmentID,
                    },
                ],
            },

            distinct: true,
            limit: queries.limit,
            offset: queries.offset,
        });
    }

    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const { Name, Description, DepartmentID, Status, ImageURL } = req.body;

        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'GroupChild not found'));

        return GroupChild.update(
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
        const { DepartmentID } = req.query;

        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'GroupChild not found'));

        return GroupChild.update(
            { Status: 2 },
            {
                where: {
                    ID: id,
                },
            }
        );
    }
}

module.exports = new GroupChildService();
