/**
 * Created by guozengguang on 2017/6/12.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.get('/', Filter.authorize,function (req, res) {
    return res.render('enroll/israel_pay_manage', {
        title: '以色列游学报名统计'
    });
});

module.exports = router;