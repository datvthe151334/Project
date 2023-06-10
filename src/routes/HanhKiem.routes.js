const router = require('express').Router();
const MoocCampaignController = require('../controllers/HanhKiem.controller');

router.post('/', MoocCampaignController.createHanhKiem);
router.get('/', MoocCampaignController.findBadgesLevel);
router.get('/:id', MoocCampaignController.findHanhKiem);
router.put('/:id', MoocCampaignController.updateHanhKiem);
router.delete('/:id', MoocCampaignController.deleteHanhKiem);

module.exports = router;
