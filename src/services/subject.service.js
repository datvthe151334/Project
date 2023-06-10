const { Op } = require('sequelize');
// @ts-ignore
const { GroupMembers, UserMaster, Group } = require('../models');
const ErrorResponse = require('../libs/error-response');
const queryParams = require('../utils/query-params');
const getAccountFromToken = require('../utils/account-token');
class GroupMembersService {
    async fncFindOne(req) {
        const { id } = req.params;

        return GroupMembers.findOne({
            where: { ID: id },
            include: [
                {
                    model: UserMaster,
                },
            ],
        });
    }

    async fncCreateOne(req) {
        return GroupMembers.create({
            ...req.body,
            CreatedBy: getAccountFromToken(req),
        });
    }

    async fncFindMany(req, next) {
        const queries = queryParams(req.query, Op, [], ['GroupID', 'MemberID', 'Status', 'CreatedDate']);

        return GroupMembers.findAndCountAll({
            order: queries.order,
            where: queries.searchOr,
            include: [
                {
                    model: Group,
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
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'GroupMembers not found'));

        return GroupMembers.update(
            {
                UpdatedBy: getAccountFromToken(req),
                ...req.body,
            },
            {
                where: {
                    ID: +req.params.id,
                },
            }
        );
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;

        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'GroupMembers not found'));

        return GroupMembers.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }
}

module.exports = new GroupMembersService();
