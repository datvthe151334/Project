const router = require('express').Router();
const MoocCampaignController = require('../controllers/role.controller');

router.post('/', MoocCampaignController.createrole);
router.get('/', MoocCampaignController.findroles);
router.get('/:id', MoocCampaignController.findrole);
router.put('/:id', MoocCampaignController.updaterole);
router.put('/', MoocCampaignController.updaterole);
router.delete('/:id', MoocCampaignController.deleterole);

module.exports = router;
