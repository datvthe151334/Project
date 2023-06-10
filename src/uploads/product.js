const multer = require('multer');
const fsExtra = require('fs-extra');
const appRootPath = require('app-root-path');
const asyncHandler = require('../utils/async-handler');
const ProductService = require('../services/product.service');
const { errorResponse, successResponse } = require('../libs/response');
const MultipleMulter = require('../helpers/mutiple-multer');
const fs = require('fs');
const { Product, UserMaster, Department } = require('../models');
module.exports = {
    uploadProductImage: multer({
        limits: {
            fileSize: 3 * 1024 * 1024, // limit 3MB
        },
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                const pathProduct = `/var/www/akarank_test/BE/public/product`;
                // const pathProduct = `${appRootPath}/public/product`;
                fs.mkdirSync(pathProduct, { recursive: true });
                cb(null, pathProduct);
            },
            filename: (req, file, cb) => {
                // @ts-ignore
                // get extention image
                let ext = file.mimetype.split('/')[1];
                if (ext === 'svg+xml') {
                    ext = 'svg';
                }
                if (ext != 'img' && ext != 'svg' && ext != 'png' && ext != 'jpg' && ext != 'jpeg') {
                    return cb(new Error('Invalid file type'));
                }

                cb(null, `product-${Date.now()}.${ext}`);
            },
        }),
    }),

    removeProductImage: asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const { currentImage } = req.body;
        const product = await Product.findOne({ where: { ID: id } });
        if (product) {
            if (product.Image !== '' && product.Image !== null) {
                const beforeUpdateFile = MultipleMulter.deleteUpdateImage(product.Image);

                const afterUpdateFile =
                    req.body.currentImage || req.body.Image
                        ? MultipleMulter.deleteUpdateImage(req.body.currentImage ? req.body.currentImage : req.body.Image)
                        : [];
                beforeUpdateFile.forEach((element) => {
                    if (!afterUpdateFile.includes(element)) {
                        fsExtra.remove(`/var/www/akarank_test/BE${element}`, (err) => {
                            if (err) return res.status(400).json(errorResponse(400, 'can not remove image'));
                        });
                        // fsExtra.remove(`${appRootPath}${element}`, (err) => {
                        //     if (err) return res.status(400).json(errorResponse(400, 'can not remove image'));
                        // });
                    }
                });
                let imgProduct = product.Image;
            }
        }

        return next();
    }),
};
