const { Op, where, QueryTypes, Sequelize } = require('sequelize');
const cheerio = require('cheerio');
const queryParams = require('../utils/query-params');
// @ts-ignore
const { Department, UserMaster, FSU, DefaultHead, GroupChild, Setting, sequelize, Badge } = require('../models');
const ErrorResponse = require('../libs/error-response');
const FetchDepartment = require('../helpers/fetch-department');
const { map, forEach } = require('lodash');
const { successResponse } = require('../libs/response');
const { DB_DATABASE } = process.env;
const getAccountFromToken = require('../utils/account-token');
class DepartmentService {
    async fncFindOne(req) {
        const { id } = req.params;

        return Department.findOne({
            where: { ID: id },
            include: [
                // {
                //     model: UserMaster,
                //     as: 'Head',
                // },
                {
                    model: UserMaster,
                },
                {
                    model: Setting,
                },
            ],
        });
    }

    async fncFindSubDepartment(req) {
        const { id } = req.params;
        const { fsu } = req.query;

        const departments = await Department.findAll({
            where: {
                Code: {
                    [Op.like]: `%${fsu}%`,
                },
            },
            raw: true,
        });
        let listDepartment = [];
        if (departments.length !== 0) {
            for await (let ele of departments) {
                const check = await GroupChild.findOne({ where: { DepartmentID: ele.ID } });
                if (!check) listDepartment.push(ele);
            }
        }

        return listDepartment;
    }
    async fncFindSubDepartmentOfFSU(req) {
        const { DepartmentID } = req.body;

        const departmentFsu = await FSU.findOne({
            where: { DepartmentID: DepartmentID },
        });

        if (!departmentFsu) return next(new ErrorResponse(400, 'Department not is FSU'));

        const groupchild = await GroupChild.findAll({
            where: {
                FSUID: departmentFsu.ID,
            },
            raw: true,
        });

        return groupchild;
    }

    async fncFindFsu(req, res, next) {
        const queries = queryParams(
            req.query,
            Op,
            //
            ['Code', 'Name'],
            ['Code', 'Name', 'Status', 'CreatedDate', 'UpdatedDate']
        );
        const { DepartmentID } = req.query;
        const newArr = [];
        const findFSU = await FSU.findAll({
            order: queries.order,
            where: {
                [Op.and]: [queries.searchOr, { DepartmentID: DepartmentID }],
            },
            distinct: true,
            limit: queries.limit,
            offset: queries.offset,
        });
        if (!findFSU) return newArr;
        return findFSU;
    }

    async fncFindGroupChildOfFSU(req) {
        const { DepartmentID } = req.query;
        const newArr = [];
        const findDepartment = await FSU.findOne({
            where: { DepartmentID: DepartmentID },
        });

        if (!findDepartment) {
            return newArr;
        }

        const groupchild = await GroupChild.findAll({
            where: {
                FSUID: findDepartment.ID,
            },
            include: [
                {
                    model: FSU,
                },
                {
                    model: Department,
                },
            ],
        });

        return groupchild;
    }

    async fncFindDepartmentNotBelongToFsu(req) {
        const { DepartmentID } = req.query;
        const findDepartment = await GroupChild.findAll({ Attributes: ['DepartmentID'] });
        const findParent = await GroupChild.findOne({
            where: { DepartmentID: DepartmentID },
        });

        let allID = findDepartment.map((x) => x.DepartmentID);
        if (findParent) {
            const findIDparent = await FSU.findOne({ where: { ID: findParent.FSUID } });
            if (findIDparent) allID.push(findIDparent.DepartmentID);
        }
        const allDepartmentValid = await Department.findAll({
            where: {
                ID: {
                    [Op.notIn]: allID,
                },
            },
        });
        return allDepartmentValid;
    }

    async fncCreateOne(req, next) {
        const { Code, Name, DepartmentID } = req.body;

        if (Code) {
            const checkCode = await Department.findOne({
                where: { Code: Code },
            });
            if (checkCode) return next(new ErrorResponse(400, 'Code is used for another department'));
        }

        if (Name) {
            const checkCode = await Department.findOne({
                where: { Name: Name },
            });
            if (checkCode) return next(new ErrorResponse(400, 'Name is used for another department'));
        }

        const create = await Department.create({
            Code: Code,
            Name: Name,
            Status: 2,
        });
        if (create) {
            const createNewBadge = Badge.create({
                Name: 'New User',
                ImageURL: '/public/badge/star-flower.png',
                Description: 'Badge award when member join department',
                DepartmentID: create.ID,
            });
        }
        return create;
    }

    async fncCreateFsu(req, next) {
        const { DepartmentID, ListGroupChild, Name, Description } = req.body;

        const check = await FSU.findOne({
            where: { DepartmentID: DepartmentID },
        });

        if (check) return next(new ErrorResponse(400, 'Department is FSU already'));

        const fsu = await FSU.create({ DepartmentID: DepartmentID, Name: Name ?? null, Description: Description ?? null });

        if (fsu) await Department.update({ IsFsu: 1 }, { where: { ID: DepartmentID } });
        const t = await sequelize.transaction();

        try {
            let listgroupchild = [];
            if (fsu && ListGroupChild.count !== 0) {
                for await (let row of ListGroupChild) {
                    const department = await Department.findOne(
                        {
                            where: { ID: row },
                        },
                        { transaction: t }
                    );
                    const head = await DefaultHead.findOne(
                        {
                            where: { DepartmentID: row },
                        },
                        { transaction: t }
                    );
                    let userHead = null;
                    let headInFsu = null;
                    head ? (userHead = await UserMaster.findOne({ where: { ID: head?.HeadID } })) : (userHead = null);
                    userHead
                        ? (headInFsu = await UserMaster.findOne({ where: { Account: userHead.Account, DepartmentID: DepartmentID } }))
                        : (headInFsu = null);

                    // if (!head) return next(new ErrorResponse(400, `Department ${department.Code} don't `));
                    listgroupchild.push({
                        UserMasterID: headInFsu?.ID ?? null,
                        DepartmentID: row,
                        Account: headInFsu?.Account ?? null,
                        FSUID: fsu.ID,
                    });
                }
                await GroupChild.bulkCreate(listgroupchild, { transaction: t });
            }
            await t.commit();
            return fsu;
        } catch (err) {
            t.rollback();
            console.log(err);
        }
    }

    async fncUpdateFsu(req, next) {
        const { DepartmentID, ListGroupChild, Status } = req.body;

        const check = await FSU.findOne({
            where: { DepartmentID: DepartmentID },
        });

        if (!check) return next(new ErrorResponse(400, 'FSU not found'));
        let update;
        const t = await sequelize.transaction();
        try {
            if (Status === 1) {
                await Department.update({ IsFsu: 1 }, { where: { ID: DepartmentID } });
                update = await FSU.update({ Status: 1 }, { where: { DepartmentID: DepartmentID } });
                let listgroupchild = [];
                if (ListGroupChild.count !== 0) {
                    for await (let row of ListGroupChild) {
                        const department = await Department.findOne(
                            {
                                where: { ID: row },
                            },
                            { transaction: t }
                        );
                        const head = await DefaultHead.findOne(
                            {
                                where: { DepartmentID: row },
                            },
                            { transaction: t }
                        );
                        let userHead = null;
                        let headInFsu = null;
                        head ? (userHead = await UserMaster.findOne({ where: { ID: head?.HeadID } })) : (userHead = null);
                        userHead
                            ? (headInFsu = await UserMaster.findOne({ where: { Account: userHead.Account, DepartmentID: DepartmentID } }))
                            : (headInFsu = null);

                        // if (!head) return next(new ErrorResponse(400, `Department ${department.Code} don't `));
                        listgroupchild.push({
                            UserMasterID: headInFsu?.ID ?? null,
                            DepartmentID: row,
                            Account: headInFsu?.Account ?? null,
                            FSUID: check.ID,
                        });
                    }
                }
                await GroupChild.destroy({
                    where: { FSUID: check.ID },
                });
                update = await GroupChild.bulkCreate(listgroupchild, { transaction: t });
            } else {
                await Department.update({ IsFsu: 1 }, { where: { ID: DepartmentID } });
                update = await FSU.update({ Status: 0 }, { where: { DepartmentID: DepartmentID } });
            }

            await t.commit();
            return update;
        } catch (err) {
            t.rollback();
            console.log(err);
        }
    }
    async fncUpdateFsuToBu(req, next) {
        const { DepartmentID } = req.query;

        const check = await FSU.findOne({
            where: { DepartmentID: DepartmentID },
        });
        if (!check) return next(new ErrorResponse(400, 'FSU not found'));
        try {
            if (check.Status == 1) {
                await FSU.update({ Status: 0 }, { where: { DepartmentID: DepartmentID } });
                await Department.update({ IsFsu: 0 }, { where: { ID: DepartmentID } });
                await GroupChild.destroy({ where: { FSUID: check.ID } });
            }
            return res.status(200).json(successResponse(200));
        } catch (err) {
            return err;
        }
    }

    async fncSyncDataWithJira() {
        let department = {};
        let storeDepartments = [];

        FetchDepartment.downloadString({
            url: '',
            done: async function (msg) {
                const $ = cheerio.load(msg);
                // console.log($("select[id='fil_group_id']").html());
                $("select[id='fil_group_id']")
                    .find('option')
                    .each((index, opt) => {
                        // append each department into an object
                        // console.log($(opt).attr('class'));
                        if ($(opt).attr('class') !== 'ui-inactive-item') {
                            let depCode = $(opt)
                                .text()
                                .replace(/[\r\n\t]/g, '')
                                .trim();
                            department = {
                                Code: depCode,
                                // @ts-ignore
                                JIRAID: parseInt($(opt).attr('value')),
                            };

                            if (!storeDepartments.find((value) => value.Code == depCode)) {
                                // push objects into array store
                                storeDepartments.push(department);
                            }
                        }
                    });

                const departments = await Department.findAll();

                if (!departments.length) {
                    await Department.bulkCreate(storeDepartments);
                }

                return departments;
            },
            error: function (obj) {
                return obj;
            },
        });
    }

    async fncFindAllByUserID(req) {
        const { isOnlyMember } = req.query;
        const Account = getAccountFromToken(req);
        const findUser = await UserMaster.findAll({ where: { Account: Account } });
        if (!findUser) return next(new ErrorResponse(404, 'User not found'));

        let defaultHeadArr = [];
        let userid = [];
        const pl = 'Public';

        // const getAllDepartmentForUser = await Department.findAll({
        //     attributes: ['ID', 'Code', 'Name', 'JIRAID', 'Slogan', 'Description', 'IsFsu', 'Status', 'CreatedDate', 'UpdatedDate'],
        //     include: [
        //         {
        //             model: UserMaster,
        //             attributes: [],
        //             where: { Account: Account },
        //         },
        //         {
        //             model: Setting,
        //             attributes: ['Logo'],
        //         },
        //     ],
        //     where: { Status: 2 },
        // });
        // console.log(Account);

        const getAllDepartmentForUser = await sequelize.query(
            `select d.ID,d.Code,d.Name,d.JIRAID,d.Slogan,d.Description,d.IsFsu,d.Status,d.CreatedDate,d.UpdatedDate,u2.Logo from ${DB_DATABASE}.Department d
            inner join ${DB_DATABASE}.UserMaster u on u.DepartmentID =d.ID
            inner join ${DB_DATABASE}.Setting u2 on d.ID = u2.DepartmentID
            where u.Account  = ? and d.Status=2`,
            { type: QueryTypes.SELECT, replacements: [`${Account}`] }
        );

        for (const e of findUser) {
            userid.push(e.ID);
            const getDefaultHead = await DefaultHead.findAll({ where: { HeadID: e.ID } });
            for (let i of getDefaultHead) {
                const getDetailDepartmentByDefaultHead = await Department.findOne({ where: { ID: i.DepartmentID }, raw: true });
                defaultHeadArr.push(getDetailDepartmentByDefaultHead);
            }
        }

        let condition = '';
        if (userid.length !== 0) {
            condition = `and d.ID not in (${userid.toString()})`;
        }

        const getAllhavePublic = await sequelize.query(
            `select d.ID,d.Code,d.Name,d.JIRAID,d.Slogan,d.Description,d.IsFsu,d.Status,d.CreatedDate,d.UpdatedDate,s.Logo from ${DB_DATABASE}.Department
             d inner join ${DB_DATABASE}.Setting s on s.DepartmentID =d.ID
            where s.ViewMode = ? and d.Status = 2 ${condition}`,
            { type: QueryTypes.SELECT, replacements: [`${pl}`] }
        );

        // const getAllhavePublic = await Department.findAll({
        //     attributes: [
        //         'ID',
        //         'Code',
        //         'Name',
        //         'JIRAID',
        //         'Slogan',
        //         'Description',
        //         'IsFsu',
        //         'Status',
        //         'CreatedDate',
        //         'UpdatedDate',
        //         [Sequelize.col('Setting.Logo'), 'Logo'], // include the Logo attribute from the Setting model
        //     ],
        //     where: {
        //         Status: 2,
        //     },
        //     include: [
        //         {
        //             model: Setting,
        //             where: {
        //                 ViewMode: pl,
        //             },
        //         },
        //         {
        //             model: UserMaster,
        //         },
        //     ],
        // });

        let department = [];

        if (getAllDepartmentForUser.length !== 0) {
            getAllDepartmentForUser.forEach((element) => {
                department.push(element);
            });
        }
        if (getAllhavePublic.length !== 0) {
            getAllhavePublic.forEach((element) => {
                department.push(element);
            });
        }

        if (defaultHeadArr.length !== 0) {
            defaultHeadArr.forEach((element) => {
                department.push(element);
            });
        }
        if (isOnlyMember === undefined) {
            const getAdminDepartment = await sequelize.query(
                `select d.ID,d.Code,d.Name,d.JIRAID,d.Slogan,d.Description,d.IsFsu,d.Status,d.CreatedDate,d.UpdatedDate from ${DB_DATABASE}.Department d
                where d.Code = "ADMIN"`,
                { type: QueryTypes.SELECT }
            );
            const findUser = await UserMaster.findOne({ where: { Account: Account, DepartmentID: getAdminDepartment[0].ID, RoleID: 1 } });
            if (getAdminDepartment.length !== 0 && findUser) department.push(getAdminDepartment[0]);
        }

        if (department.length !== 0) {
            for await (let element of department) {
                const find = await UserMaster.findOne({
                    where: { Account: Account, DepartmentID: element.ID },
                });
                if (find) element.isAuthorized = 1;
                else element.isAuthorized = 0;
                //
            }
        }

        for await (let element of department) {
            const findUser = await UserMaster.findOne({
                where: { Account: Account, DepartmentID: element.ID },
            });

            if (findUser) {
                element.UserMasters = [findUser];
            } else {
                element.UserMasters = [];
            }
        }
        // let uniqIds = {};
        // let filtered = department.filter((obj) => !uniqIds[obj.ID] && (uniqIds[obj.ID] = true));
        const filteredSource = department.filter((item, index) => {
            return index === department.findIndex((obj) => obj.ID === item.ID);
        });
        // console.log(filteredSource);
        return filteredSource;
    }

    async fncFindAll(req) {
        const queries = queryParams(
            req.query,
            Op,
            //
            ['Code', 'Name'],
            ['Code', 'Name', 'Status', 'CreatedDate', 'UpdatedDate']
        );

        const deparment = await Department.findAndCountAll({
            order: queries.order,
            where: {
                [Op.and]: [queries.searchOr],
            },
            include: [
                {
                    model: UserMaster,
                },
                {
                    model: Setting,
                },
            ],

            distinct: true,
            limit: queries.limit,
            offset: queries.offset,
        });

        return deparment;
    }

    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const { fsu, Code, Name } = req.body;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Department not found'));
        if (Code) {
            const checkCode = await Department.findOne({
                where: { Code: Code },
            });
            if (checkCode) return next(new ErrorResponse(400, 'Code is used for another department'));
        }

        if (Name) {
            const checkName = await Department.findOne({
                where: { Name: Name },
            });
            if (checkName) return next(new ErrorResponse(400, 'Name is used for another department'));
        }
        if (fsu === 0) {
            const update = await FSU.update({ Status: 2 }, { where: { DepartmentID: id } });
            if (update) {
                const groupchild = await GroupChild.destroy({ where: { DepartmentID: id } });
            }
        }

        return Department.update(
            { ...req.body, IsFsu: fsu === 1 ? 1 : 0 },
            {
                where: { ID: id },
            }
        );
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Department not found'));

        return Department.update(
            { Status: 2 },
            {
                where: { ID: id },
            }
        );
    }
}

module.exports = new DepartmentService();
