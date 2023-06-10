const router = require('express').Router();
const MoocCampaignController = require('../controllers/KetQuaCaNam.controller');

router.post('/', MoocCampaignController.createKetQuaCaNam);
router.get('/', MoocCampaignController.findKetQuaCaNams);
router.get('/:id', MoocCampaignController.findKetQuaCaNam);
router.put('/:id', MoocCampaignController.updateKetQuaCaNam);
router.delete('/:id', MoocCampaignController.deleteKetQuaCaNam);

module.exports = router;
