const router = require('express').Router();
const NicknameController = require('../controllers/student.controller');

router.post('/', NicknameController.createStudentService);
router.get('/', NicknameController.findStudentServices);
router.put('/:id', NicknameController.updateStudentService);
router.delete('/:id', NicknameController.deleteStudentService);

module.exports = router;
