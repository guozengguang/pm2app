/**
 * Created by Administrator on 2016/10/21 0021.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;

router.all('/*',Filter.authorize);

router.get('/',function (req, res) {
    return res.render('media/online', {
        title: '媒资上下架',
    });
});

module.exports = router;