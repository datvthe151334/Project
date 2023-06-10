const { Op } = require('sequelize');
// @ts-ignore
const { Class } = require('../models');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/error-response');
const getAccountFromToken = require('../utils/account-token');
class ClassService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Class.findOne({
            where: { ID: id },
        });
    }

    async fncCreateOne(req) {
        const newData = req.body;
        return Class.create(newData);
    }

    async fncFindAll(req) {
        const queries = queryParams(
            req.query,
            Op,
            //
            ['Code', 'Name'],
            ['Code', 'Name']
        );

        return Class.findAndCountAll({
            order: queries.order,
            where: queries.searchOr,
            distinct: true,
            limit: queries.limit,
            offset: queries.offset,
        });
    }

    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const newData = req.body;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Class not found'));

        return Class.update(newData, {
            where: { ID: +id },
        });
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Class not found'));

        return Class.update(
            { Status: 2 },
            {
                where: { ID: +id },
            }
        );
    }
}

module.exports = new ClassService();
