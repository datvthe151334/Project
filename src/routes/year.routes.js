const router = require('express').Router();
const GroupController = require('../controllers/year.controller');
const { validatePOST, validatePUT } = require('../validations/group');

router.post('/', validatePOST, GroupController.createYear);
router.get('/:id', GroupController.findYear);
router.get('/', GroupController.findYears);
router.put('/:id', validatePUT, GroupController.updateYear);
router.delete('/:id', GroupController.deleteYear);

module.exports = router;
