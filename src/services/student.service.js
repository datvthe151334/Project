const { Op } = require('sequelize');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/response');
const successResponse = require('../libs/response');
// @ts-ignore
const { Student } = require('../models');
const getAccountFromToken = require('../utils/account-token');
class StudentService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Student.findOne({
            where: { ID: id },
        });
    }

    async fncCreateOne(req) {
        return Student.create({
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

        return Student.findAndCountAll({
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

        if (!found) return next(new ErrorResponse(404, 'Student not found'));

        return Student.update(
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

        if (!found) return next(new ErrorResponse(404, 'Student not found'));

        return Student.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }

  
}

module.exports = new StudentService();
