const router = require('express').Router();
const MoocCampaignController = require('../controllers/class.controller');

router.post('/', MoocCampaignController.createClass);
router.get('/', MoocCampaignController.findClasss);
router.get('/:id', MoocCampaignController.findClass);
router.put('/:id', MoocCampaignController.updateClass);
router.delete('/:id', MoocCampaignController.deleteClass);

module.exports = router;
