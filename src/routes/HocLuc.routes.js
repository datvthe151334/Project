const router = require('express').Router();
const MoocCampaignController = require('../controllers/HocLuc.controller');

router.post('/', MoocCampaignController.createHocLuc);
router.get('/', MoocCampaignController.findHocLucs);
router.get('/:id', MoocCampaignController.findHocLuc);
router.put('/:id', MoocCampaignController.updateHocLuc);
router.delete('/:id', MoocCampaignController.deleteHocLuc);

module.exports = router;
