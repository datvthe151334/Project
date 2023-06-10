const { Op } = require('sequelize');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/response');
const successResponse = require('../libs/response');
// @ts-ignore
const { HanhKiem } = require('../models');
class HanhKiemService {
    async fncFindOne(req) {
        const { id } = req.params;

        return HanhKiem.findOne({
            where: { ID: id },
        });
    }

    async fncCreateOne(req) {
        return HanhKiem.create({
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

        return HanhKiem.findAndCountAll({
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

        if (!found) return next(new ErrorResponse(404, 'HanhKiem not found'));

        return HanhKiem.update(
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

        if (!found) return next(new ErrorResponse(404, 'HanhKiem not found'));

        return HanhKiem.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }

  
}

module.exports = new HanhKiemService();
