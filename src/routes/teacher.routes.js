const router = require('express').Router();
const NotificationController = require('../controllers/teacher.controller');

router.post('/', NotificationController.createTeacher);
router.get('/', NotificationController.findTeachers);
router.get('/:id', NotificationController.findTeacher);
router.put('/:id', NotificationController.updateTeacher);
router.delete('/:id', NotificationController.deleteTeacher);

module.exports = router;
