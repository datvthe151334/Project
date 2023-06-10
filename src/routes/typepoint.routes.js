const router = require('express').Router();
const PermissionController = require('../controllers/typepoint.controller');
router.get('/', PermissionController.findTypePoints);
router.post('/', PermissionController.createTypePoint);
router.get('/:id', PermissionController.findTypePoint);
router.put('/:id', PermissionController.updateTypePoint);
router.delete('/:id', PermissionController.deleteTypePoint);

module.exports = router;
