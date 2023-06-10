const { Op } = require('sequelize');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/response');
const successResponse = require('../libs/response');
// @ts-ignore
const { Teacher, User } = require('../models');
const getAccountFromToken = require('../utils/account-token');
class TeacherService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Teacher.findOne({
            where: { ID: id },
        });
    }

    async fncCreateOne(req) {
        return Teacher.create({
            ...req.body,
        });
    }

    async fncFindAll(req) {
        const queries = queryParams(
            req.query,
            Op,
            //
            ['Name',"Code", "PhoneNumber","Address","Email"],
            ['Name',"Code", "PhoneNumber","Address","Email"]
        );

        return Teacher.findAndCountAll({
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

        if (!found) return next(new ErrorResponse(404, 'Teacher not found'));

        return Teacher.update(
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

        if (!found) return next(new ErrorResponse(404, 'Teacher not found'));

        return Teacher.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }

  
}

module.exports = new TeacherService();
