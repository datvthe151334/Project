const router = require('express').Router();

router.use('/hello', (req, res) => {
    console.log('Validated: ', req.authInfo);

    // Service relies on the name claim.
    res.status(200).json({
        // @ts-ignore
        name: req.authInfo['name'],
        // @ts-ignore
        'issued-by': req.authInfo['iss'],
        // @ts-ignore
        'issued-for': req.authInfo['aud'],
        // @ts-ignore
        scope: req.authInfo['scp'],
    });
});
router.use('/user', require('./user.routes'));
router.use('/class', require('./class.routes'));
router.use('/grade', require('./grade.routes'));
router.use('/hanhkiem', require('./HanhKiem.routes'));
router.use('/hocluc', require('./HocLuc.routes'));
router.use('/ketquacanam', require('./KetQuaCaNam.routes'));
// router.use('/ketquamonhoc', require('./KetQuaMonHoc.routes'));
router.use('/point', require('./point.routes'));
router.use('/role', require('./role.routes'));
router.use('/semester', require('./semester.routes'));
router.use('/student', require('./student.routes'));
router.use('/subject', require('./subject.routes'));
router.use('/teacher', require('./teacher.routes'));
router.use('/typepoint', require('./typepoint.routes'));
router.use('/year', require('./year.routes'));


module.exports = router;
