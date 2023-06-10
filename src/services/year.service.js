const { Op } = require('sequelize');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/response');
const successResponse = require('../libs/response');
// @ts-ignore
const { Year } = require('../models');
class YearService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Year.findOne({
            where: { ID: id },
        });
    }

    async fncCreateOne(req) {
        return Year.create({
            ...req.body,
        });
    }

    async fncFindAll(req) {
        const queries = queryParams(
            req.query,
            Op,
            //
            ['Name',"Code"],
            ['Name',"Code"]
        );

        return Year.findAndCountAll({
            order: [['CreatedDate', 'DESC']],
            where: queries.searchOr,
         
            distinct: true,
            limit: queries.limit,
            offset: queries.offset,
        });
    }

    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Year not found'));

        return Year.update(
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

        if (!found) return next(new ErrorResponse(404, 'Year not found'));

        return Year.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }

  
}

module.exports = new YearService();
