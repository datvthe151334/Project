const { Op } = require('sequelize');
const queryParams = require('../utils/query-params');
const ErrorResponse = require('../libs/response');
const successResponse = require('../libs/response');
// @ts-ignore
const { Notification, User } = require('../models');
const getAccountFromToken = require('../utils/account-token');
class UserService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Notification.findOne({
            where: { ID: id },
            include: [
                {
                    model: UserMaster,
                },
            ],
        });
    }

    async fncCreateOne(req) {
        return Notification.create({
            ...req.body,
        });
    }

    async fncFindAll(req) {
        const queries = queryParams(
            req.query,
            Op,
            //
            ['Description'],
            ['Status', 'CreatedDate', 'UserMasterID', 'UpdatedDate']
        );

        return Notification.findAndCountAll({
            order: [['CreatedDate', 'DESC']],
            where: queries.searchOr,
            include: [
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

        if (!found) return next(new ErrorResponse(404, 'Notification not found'));

        return Notification.update(
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

        if (!found) return next(new ErrorResponse(404, 'Notification not found'));

        return Notification.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }

    async fncLogin(req,res, next) {
        const { account, password } = req.body;
        
        const found = User.findOne({
            where:{Account: account, Password: password}
        })
        
        if (!found) return next(new ErrorResponse(404, 'Account or password is not correct'));
        else return found;
        
    }
}

module.exports = new UserService();
