const router = require('express').Router();
const MoocCampaignController = require('../controllers/KetQuaMonHoc.controller');

router.post('/', MoocCampaignController.createKetQuaMonHoc);
router.get('/', MoocCampaignController.findKetQuaMonHocs);
router.get('/:id', MoocCampaignController.findKetQuaMonHoc);
router.put('/:id', MoocCampaignController.updateKetQuaMonHoc);
router.delete('/:id', MoocCampaignController.deleteKetQuaMonHoc);

module.exports = router;
