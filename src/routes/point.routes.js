const router = require('express').Router();
const MoocCampaignController = require('../controllers/point.controller');

router.post('/', MoocCampaignController.createPoint);
router.get('/', MoocCampaignController.findPoints);
router.get('/:id', MoocCampaignController.findPoint);
router.put('/:id', MoocCampaignController.updatePoint);
router.put('/', MoocCampaignController.updatePoint);
router.delete('/:id', MoocCampaignController.deletePoint);

module.exports = router;
