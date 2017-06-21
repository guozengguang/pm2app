/**
 * Created by Administrator on 2016/10/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.all(Filter.authorize);

router.get('/',function (req, res) {
    return res.render('enroll/branch_info', {
        title: '分院信息',
    });
});

module.exports = router;