
/**
 * Created by Administrator on 2016/11/29 0029.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.all(Filter.authorize);

router.get('/manage',function (req, res) {
    return res.render('advertisement/config', {
        title: '宣传页',
    });
});
router.get('/value',function (req, res) {
    return res.render('advertisement/config_value', {
        title: '宣传页',
    });
});


module.exports = router;