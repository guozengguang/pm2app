/**
 * Created by Administrator on 2017/3/20 0020.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');
var _ = require('lodash');

router.post('/', Filter.authorize,function (req, res) {
    var body = req.body,
        picture = body.picture,
        lessons = body.lessons,
        branches = body.branches;
    body.branch = req.session.user.user_branch;
    if(_.isArray(picture)){
        body.picture = picture.join(',')
    }
    if(_.isArray(branches)){
        body.branches = branches.join(',')
    }
    body.is_stay = Boolean(Number(body.is_stay));
    if(_.isArray(lessons)){
        body.lessons = body.lessons.join(',');
    }
    body.areas = body.areas.join(',');
    models.HotelActivity.create(body,{
        raw: true,
        plain: true
    }).then(function () {
        return response.ApiSuccess(res, {}, '添加成功');
    },function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;