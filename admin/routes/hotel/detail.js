/**
 * Created by Administrator on 2017/3/17 0017.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.get('/', Filter.authorize,function (req, res) {
    var branch = req.session.user.user_branch;
    return res.render('hotel/hotel_intro_list', {
        title: '酒店介绍'
    });
});
module.exports = router;