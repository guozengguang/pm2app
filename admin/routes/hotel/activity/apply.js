/**
 * Created by Administrator on 2017/3/25 0025.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.get('/', Filter.authorize,function (req, res) {
    var branch = req.session.user.user_branch;
    return res.render('hotel/apply_room', {
        title: '申请房间'
    });
});
module.exports = router;