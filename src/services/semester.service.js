const { Op } = require('sequelize');
// @ts-ignore
const { GroupCampaign, GroupMembers, Campaign, Group, UserCampaign } = require('../models');
const ErrorResponse = require('../libs/error-response');
const queryParams = require('../utils/query-params');
const e = require('express');
const getAccountFromToken = require('../utils/account-token');
class GroupCampaignService {
    async fncFindOne(req) {
        const { id } = req.params;

        return GroupCampaign.findOne({
            where: { ID: id },
            include: [
                {
                    model: Group,
                },
            ],
        });
    }

    async fncCreateOne(req, next) {
        const { GroupID, CampaignID } = req.body;
        let listGroupCampaign = [];

        const findCampaign = await Campaign.findOne({
            where: { ID: CampaignID },
        });
        if (!findCampaign) return next(new ErrorResponse(404, 'Campaign not found'));

        for await (let el of GroupID) {
            const found = await Group.findOne({
                where: { ID: el },
            });
            if (!found) return next(new ErrorResponse(404, 'Some group not found'));
            listGroupCampaign.push({
                GroupID: el,
                CampaignID: CampaignID,
            });
        }

        const create = await GroupCampaign.bulkCreate(listGroupCampaign);

        const camp = await Campaign.findOne({
            where: { ID: CampaignID },
        });

        for await (let el of GroupID) {
            const users = await GroupMembers.findAll({
                where: { GroupID: el },
            });

            const listuser = users.map((x) => x.MemberID);

            let user = [];

            for await (let element of listuser) {
                const exist = await UserCampaign.findOne({
                    where: { UserMasterID: element, CampaignID: CampaignID },
                });
                if (!exist)
                    user.push({
                        UserMasterID: element,
                        CampaignID: CampaignID,
                        Confirmer: camp.Confirmer,
                    });

                const createUser = await UserCampaign.bulkCreate(user);

                if (!createUser) return next(new ErrorResponse(400, 'Bad request '));
            }
        }
        return create;
    }

    async fncFindMany(req, next) {
        const { CampaignID } = req.query;

        return GroupCampaign.findAndCountAll({
            where: {
                CampaignID: CampaignID,
                Status: 1,
            },
            include: [{ model: Group }],
        });
    }

    async fncUpdateOne(req, next) {
        const { GroupID } = req.body;
        const { campaignid } = req.params;
        let listGroupCampaign = [];

        for await (let el of GroupID) {
            const found = await Group.findOne({
                where: { ID: el },
            });
            if (!found) return next(new ErrorResponse(404, 'Some group not found'));
            listGroupCampaign.push({
                GroupID: el,
                CampaignID: campaignid,
            });
        }

        const listGroup = await GroupCampaign.findAll({
            where: { CampaignID: campaignid },
            raw: true,
        });

        for await (let element of listGroup) {
            await GroupCampaign.destroy({
                where: { GroupID: element.GroupID, CampaignID: campaignid },
            });
        }

        const create = await GroupCampaign.bulkCreate(listGroupCampaign);

        if (create) {
            const camp = await Campaign.findOne({
                where: { ID: campaignid },
            });

            for await (let el of GroupID) {
                const users = await GroupMembers.findAll({
                    where: { GroupID: el },
                    raw: true,
                });

                const listuser = users.map((x) => x.MemberID);
                let user = [];

                for await (let element of listuser) {
                    const exist = await UserCampaign.findOne({
                        where: { UserMasterID: element, CampaignID: campaignid },
                    });
                    if (!exist)
                        user.push({
                            UserMasterID: element,
                            CampaignID: campaignid,
                            Confirmer: camp.Confirmer,
                        });
                }
                const createUser = await UserCampaign.bulkCreate(user);

                if (!createUser) return next(new ErrorResponse(400, 'Bad request '));
            }
        }

        return create;
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;

        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'GroupCampaign not found'));

        return GroupCampaign.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }
}

module.exports = new GroupCampaignService();
