/**
 * Created by Administrator on 2016/12/19 0019.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');

router.get( '/branch',Filter.authorize ,function (req, res) {
    return res.render('blessings/branch', {
        title: '学院祝福管理'
    });
});
router.get( '/student',Filter.authorize ,function (req, res) {
    return res.render('blessings/student', {
        title: '学员祝福管理'
    });
});
module.exports = router;