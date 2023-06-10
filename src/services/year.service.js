const { Op } = require('sequelize');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/error-response');
// @ts-ignore
const { Pic, RuleDefinition, UserMaster } = require('../models');
const getAccountFromToken = require('../utils/account-token');
class PicService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Pic.findOne({
            where: { ID: id },
            include: [
                {
                    model: RuleDefinition,
                },
                {
                    model: UserMaster,
                },
            ],
        });
    }

    async fncCreateOne(req) {
        return Pic.create({
            ...req.body,
            CreatedBy: getAccountFromToken(req),
        });
    }

    async fncFindAll(req) {
        const queries = queryParams(req.query, Op, [], ['UserType', 'UpdatedBy', 'CreatedBy', 'Status', 'CreatedDate', 'UpdatedDate']);

        return Pic.findAndCountAll({
            order: queries.order,
            where: queries.searchOr,
            include: [
                {
                    model: RuleDefinition,
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

        if (!found) return next(new ErrorResponse(404, 'Pic not found'));

        return Pic.update(
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

        if (!found) return next(new ErrorResponse(404, 'Pic not found'));

        return Pic.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }
}

module.exports = new PicService();
