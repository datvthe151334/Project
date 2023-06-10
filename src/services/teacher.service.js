const { Op, QueryTypes } = require('sequelize');
const getAccountFromToken = require('../utils/account-token');
// @ts-ignore
const { Nickname, UserMaster, UserNickname } = require('../models');
const ErrorResponse = require('../libs/error-response');
const queryParams = require('../utils/query-params');
const { sequelize } = require('../models');
const { DB_DATABASE } = process.env;
class NickNameService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Nickname.findOne({
            where: { ID: id },

            include: [
                {
                    model: UserMaster,
                },
            ],
        });
    }

    async fncCreateOne(req, next) {
        const { UserMasterID, Name } = req.body;

        if (!UserMasterID) {
            return next(new ErrorResponse(400, 'UserMasterID is require'));
        }
        const found = await Nickname.count({
            where: {
                Name,
                UserMasterID,
            },
        });

        if (found > 0) {
            return next(new ErrorResponse(400, 'Duplicate nickname'));
        }

        const count = await Nickname.count({
            where: { UserMasterID: UserMasterID },
        });

        if (count > 9) {
            return next(new ErrorResponse(400, 'Can not create more than 10 Nickname'));
        }
        if (Name.trim().length === 0) return next(new ErrorResponse(400, 'Invalid nickname'));
        return Nickname.create({
            CreatedBy: getAccountFromToken(req),
            ...req.body,
        });
    }

    async fncFindAll(req) {
        const { UserMasterID } = req.query;

        const findUser = await UserMaster.findOne({
            where: { ID: UserMasterID },
        });
        const account = getAccountFromToken(req);
        const findAccount = await UserMaster.findOne({
            where: { Account: account, DepartmentID: findUser.DepartmentID },
        });
        let nickname;
        if (!findAccount) {
            nickname = await sequelize.query(
                `
                select a.*
                from (
                    SELECT 
		                n.ID, 
		                n.Name, 
		                n.UserMasterID,
		                n.CreatedBy, 
		                n.UpdatedBy, 
		                SUM(u.Vote = 1) as total_vote
		            FROM 
                    ${DB_DATABASE}.UserNickname u 
		                RIGHT JOIN  ${DB_DATABASE}.Nickname n ON u.NicknameID = n.ID 
		            WHERE 
		                n.UserMasterID = ${UserMasterID}
		            GROUP BY 
		                u.NicknameID, 
		                n.Name 
		            ORDER BY 
		                SUM(u.Vote = 1) DESC
                ) a
                `,
                { type: QueryTypes.SELECT }
            );
        } else {
            const accountCheck = account;

            nickname = await sequelize.query(
                `
                SELECT 
                    n.ID, 
                    n.Name, 
                    n.CreatedBy, 
                    n.UpdatedBy, 
                COALESCE(SUM(u.Vote), 0) AS total_vote,
                CASE WHEN EXISTS (
                    SELECT 1 
                FROM  ${DB_DATABASE}.UserNickname un 
                    WHERE un.UserMasterID = ${findAccount.ID} 
                    AND un.NicknameID = n.ID 
                    AND un.Vote = 1
                ) THEN 1 ELSE 0 END AS voted
                FROM 
                ${DB_DATABASE}.Nickname n 
                LEFT JOIN  ${DB_DATABASE}.UserNickname u ON u.NicknameID = n.ID 
                WHERE 
                n.UserMasterID = ${UserMasterID}
                GROUP BY 
                    n.ID, 
                    n.Name
                    
                ORDER BY 
                total_vote DESC
                `,
                { type: QueryTypes.SELECT }
            );
            if (nickname.length > 0) {
                nickname.forEach((element) => {
                    if (element.CreatedBy.toLowerCase() === accountCheck.toLowerCase()) {
                        element.isAuthor = true;
                    } else element.isAuthor = false;
                });
            }
        }

        return nickname;
    }

    async fncFindVoted(req) {
        const { id } = req.params;

        const queries = queryParams(req.query, Op, [], []);

        return UserNickname.findAndCountAll({
            order: queries.order,
            where: {
                [Op.and]: [queries.searchOr, { NicknameID: id }],
            },
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

        if (!found) return next(new ErrorResponse(404, 'Nickname not found'));

        return Nickname.update(
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
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Nickname not found'));

        const account = getAccountFromToken(req);

        const nick = await Nickname.findOne({
            where: { ID: +req.params.id },
        });

        const department = await UserMaster.findOne({
            where: { ID: nick.UserMasterID },
        });

        const test = await UserMaster.findOne({
            where: { Account: account, DepartmentID: department.DepartmentID },
        });

        if (nick.CreatedBy.toLowerCase() !== test.Account.toLowerCase()) return next(new ErrorResponse(401, "You don't have permission"));

        return Nickname.destroy({
            where: {
                ID: +req.params.id,
            },
        });
    }
}

module.exports = new NickNameService();
