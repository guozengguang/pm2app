/**
 * Created by Administrator on 2017/3/17 0017.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.get('/', Filter.authorize,function (req, res) {
    return res.render('hotel/room', {
        title: '酒店管理'
    });
});
module.exports = router;