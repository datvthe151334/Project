const { Op } = require('sequelize');
// @ts-ignore
const { Group, GroupMembers, UserMaster, GroupCampaign, sequelize } = require('../models');
const ErrorResponse = require('../libs/error-response');
const queryParams = require('../utils/query-params');
const getAccountFromToken = require('../utils/account-token');
class GroupService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Group.findOne({
            where: { ID: id },
            include: [
                {
                    model: UserMaster,
                },
            ],
        });
    }

    async fncCreateOne(req, next) {
        const { DepartmentID } = req.query;
        const { GroupData, GroupMemberData } = req.body;

        const t = await sequelize.transaction();

        try {
            const found = await Group.findOne({
                where: { Name: GroupData.Name },
            });
            if (found) return next(new ErrorResponse(400, `${GroupData.Name} is used for another group`));
            const createGroup = await Group.create(
                {
                    ...GroupData,
                    DepartmentID: DepartmentID,
                    CreatedBy: getAccountFromToken(req),
                },
                { transaction: t }
            );
            if (GroupMemberData) {
                const groupMembers = [];
                for await (let element of GroupMemberData) {
                    const findUser = await UserMaster.findOne({ where: { ID: element } }, { transaction: t });
                    if (!findUser) {
                        return next(new ErrorResponse(404, `UserID ${element} not found`));
                    } else {
                        const groupMember = {
                            GroupID: createGroup.ID,
                            MemberID: findUser.ID,
                        };
                        groupMembers.push(groupMember);
                    }
                }
                const createGroupMember = await GroupMembers.bulkCreate(groupMembers, { transaction: t });
            }
            await t.commit();
            return Group.findOne({
                where: { ID: createGroup.ID },
            });
        } catch (err) {
            await t.rollback();
        }
    }

    async fncFindAll(req) {
        const { DepartmentID } = req.query;

        const queries = queryParams(
            req.query,
            Op,
            //
            ['Name', 'ShortDescription'],
            ['Name', 'ShortDescription', 'DepartmentID', 'DetailDescription', 'CreatedDate', 'UpdatedDate', 'ID']
        );

        return Group.findAndCountAll({
            order: queries.order,
            where: { [Op.and]: [queries.searchOr, { DepartmentID: DepartmentID }] },
            include: {
                model: UserMaster,
            },
            distinct: true,
            limit: queries.limit,
            offset: queries.offset,
        });
    }

    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        const t = await sequelize.transaction();

        const { GroupData, GroupMemberData } = req.body;

        try {
            if (!found) {
                return next(new ErrorResponse(404, 'Group not found'));
            } else {
                if (GroupMemberData) {
                    const allMember = await GroupMembers.findAll({
                        attributes: ['MemberID'],
                        where: {
                            GroupID: id,
                        },
                        raw: true,
                    });
                    let listGroupMember = allMember.map((x) => x.MemberID);

                    listGroupMember.forEach((element) => {
                        GroupMembers.destroy({ where: { MemberID: element, GroupID: id } }, { transaction: t });
                    });
                    const groupMembers = [];

                    for await (let element of GroupMemberData) {
                        const findUser = await UserMaster.findOne({ where: { ID: element } });

                        if (!findUser) {
                            return next(new ErrorResponse(404, `UserID ${element} not found`));
                        } else {
                            const groupMember = {
                                GroupID: id,
                                MemberID: findUser.ID,
                            };
                            groupMembers.push(groupMember);
                        }
                    }

                    const createGroupMember = await GroupMembers.bulkCreate(groupMembers, { transaction: t });
                }
                if (GroupData.Status === 2) {
                    const change = await GroupCampaign.findOne({
                        where: { GroupID: id },
                    });

                    if (change) {
                        return next(new ErrorResponse(400, 'This group is in campaign, can not inactive'));
                    }
                }
                await t.commit();
                return Group.update(
                    {
                        ...GroupData,
                        UpdatedBy: getAccountFromToken(req),
                    },
                    { where: { ID: id } }
                );
            }
        } catch (err) {
            await t.rollback();
        }
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;
        const found = await Group.findOne({ where: { ID: id } });

        if (!found) {
            return next(new ErrorResponse(404, 'Group not found'));
        } else {
            return Group.update(
                {
                    Status: 2,
                    UpdatedBy: getAccountFromToken(req),
                },
                { where: { ID: id } }
            );
        }
    }
}

module.exports = new GroupService();
