const router = require('express').Router();
const MoocCampaignController = require('../controllers/semester.controller');

router.post('/', MoocCampaignController.createSemesters);
router.get('/', MoocCampaignController.findSemesters);
router.get('/:id', MoocCampaignController.findManySemesters);
router.put('/:id', MoocCampaignController.updateSemesters);
router.delete('/:id', MoocCampaignController.deleteSemesters);

module.exports = router;
