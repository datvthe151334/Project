const router = require('express').Router();
const MoocCampaignController = require('../controllers/grade.controller');

router.post('/', MoocCampaignController.createGrade);
router.get('/', MoocCampaignController.findGrades);
router.get('/:id', MoocCampaignController.findGrade);
router.put('/:id', MoocCampaignController.updateGrade);
router.delete('/:id', MoocCampaignController.deleteGrade);

module.exports = router;
