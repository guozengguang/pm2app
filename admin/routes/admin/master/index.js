/**
 * Created by Administrator on 2016/12/29 0029.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.get('/enroll', Filter.authorize, function (req, res) {
    return res.render('master/enroll', {
        title: '达人报名',
    });
});
router.get('/winning', Filter.authorize, function (req, res) {
    return res.render('master/winning', {
        title: '达人中奖',
    });
});


module.exports = router;