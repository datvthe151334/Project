const { Op, ENUM } = require('sequelize');
const cheerio = require('cheerio');
const queryParams = require('../utils/query-params');
// @ts-ignore
const { Product, UserMaster, Department } = require('../models');
const ErrorResponse = require('../libs/error-response');
const MultipleMulter = require('../helpers/mutiple-multer');
const getAccountFromToken = require('../utils/account-token');
class ProductService {
    async fncFindOne(req, next) {
        const { id } = req.params;

        const product = await Product.findOne({
            where: { ID: id },
            include: [
                {
                    model: UserMaster,
                    as: 'UserMaster',
                },
                {
                    model: UserMaster,
                    as: 'UsermasterBook',
                },
            ],
        });
        if (!product) return next(new ErrorResponse(404, 'Product not found'));

        let arrImg = [];
        if (product.Image) {
            arrImg = product.Image.substring(0, product.Image.length).split(',');
        }

        product.setDataValue('product_imgs', arrImg);
        
        return product;
    }

    async fncCreateOne(req, next) {
        const { Name, Type, Coin, Quantity, Contact, UserMasterBookID, Description, DepartmentID } = req.body;
        const files = req.files;
        const UserMasterAcc = getAccountFromToken(req);

        const department = await Department.findOne({
            where: {
                ID: DepartmentID,
            },
        });

        if (!department) return next(new ErrorResponse(404, 'Department not exist'));

        const usermaster = await UserMaster.findOne({
            where: { Account: UserMasterAcc, DepartmentID: DepartmentID },
        });

        if (!usermaster) {
            return next(new ErrorResponse(404, 'UserMaster not found '));
        }

        // if (Type == 3) {
        //     const usermasterbook = await UserMaster.findOne({
        //         where: { ID: UserMasterBookID },
        //     });

        //     if (usermasterbook.RoleID == 1 || usermasterbook.RoleID == 4) {
        //         return next(new ErrorResponse(404, 'Usermasterbook role not valid '));
        //     }

        //     if (!usermasterbook) {
        //         return next(new ErrorResponse(404, 'UserMasterBook not found '));
        //     }
        // }

        return Product.create({
            Name: Name,
            Type: 1,
            Coin: Coin,
            Quantity: Quantity,
            UserMasterID: usermaster.ID,
            DepartmentID: DepartmentID,
            Contact: Contact,
            Image: MultipleMulter.mutipleImage(files),
            UsermasterBookID: UserMasterBookID,
            Description: Description,
        });
    }

    async fncFindAll(req) {
        const { DepartmentID } = req.query;
        const sort = 'CreatedDate:DESC';
        let where = {
            DepartmentID: DepartmentID,
            Status: 1,
        };
        if (req.query.UserMasterID) {
            where = {
                DepartmentID: DepartmentID,
                UserMasterID: req.query.UserMasterID,
            };
        }
        if (req.query.keyword) {
            if (req.query.UserMasterID) {
                where[Op.and] = [
                    {
                        DepartmentID: DepartmentID,
                        UserMasterID: req.query.UserMasterID,
                        Status: 1,
                    },
                    {
                        [Op.or]: [
                            { Name: { [Op.like]: `%${req.query.keyword}%` } },
                            { '$UserMaster.Account$': { [Op.like]: `%${req.query.keyword}%` } },
                        ],
                    },
                ];
            } else {
                where[Op.and] = [
                    { Status: 1 },
                    {
                        [Op.or]: [
                            { Name: { [Op.like]: `%${req.query.keyword}%` } },
                            { '$UserMaster.Account$': { [Op.like]: `%${req.query.keyword}%` } },
                        ],
                    },
                ];
            }
        }
        let order = [];
        order.push(sort.split(':'));

        let limit, offset;
        if (req.query.page && req.query.row) {
            limit = parseInt(req.query.row);
            offset = (parseInt(req.query.page) - 1) * limit;
        }
        const result = await Product.findAndCountAll({
            include: [{ model: UserMaster, as: 'UserMaster' }],
            where,
            order,
            limit,
            offset,
        });
        result.rows.forEach((element) => {
            let arrImg = [];

            if (element.Image) {
                arrImg = element.Image.split(',');
            }
            element.setDataValue('product_imgs', arrImg);
        });
        return result;
    }

    async fncUpdateOne(req, next) {
        const { id } = req.params;
        const { Name, Coin, Quantity, Description, Contact, Status, UsermasterBookID, DepartmentID } = req.body;
        const files = req.files;
        const found = await Product.findOne({
            where: { ID: id },
        });
        const update = req.body;
        if (files != null && files[0] != null) {
            update.Image = MultipleMulter.mutipleImage(files);
            if(update.currentImage)
            update.Image = update.Image + "," + update.currentImage
        }
        if (!found) return next(new ErrorResponse(404, 'Product not found'));
        return Product.update(
            {
                ...update,
            },
            {
                where: { ID: id },
            }
        );
    }

    async fncDeleteOne(req, next) {
        const { id } = req.params;
        const found = await this.fncFindOne(req);

        if (!found) return next(new ErrorResponse(404, 'Product not found'));

        return Product.destroy({
            where: { ID: id },
        });
    }
    async fncSoldOut(req, next) {
        const { id } = req.params;
        const found = await Product.findOne({
            where: { ID: id },
        });

        if (!found) return next(new ErrorResponse(404, 'Product not found'));
        if (found.Status === 1) {
            const check = await Product.update(
                { Status: 2 },
                {
                    where: { ID: id },
                }
            );

            return check;
        }
        if (found.Status === 2) {
            return Product.update(
                { Status: 1 },
                {
                    where: { ID: id },
                }
            );
        }
    }
}

module.exports = new ProductService();
