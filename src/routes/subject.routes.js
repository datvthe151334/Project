const router = require('express').Router();
const NotificationController = require('../controllers/subject.controller');

router.post('/', NotificationController.createSubjectService);
router.get('/', NotificationController.findSubjectServices);
router.get('/:id', NotificationController.findSubjectService);
router.put('/:id', NotificationController.updateSubjectService);
router.delete('/:id', NotificationController.deleteSubjectService);

module.exports = router;
