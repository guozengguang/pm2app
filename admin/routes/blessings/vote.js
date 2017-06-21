/**
 * Created by Administrator on 2016/12/19 0019.
 */

var express = require('express');
var router = express.Router();
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

var end_time = 1483891199999; //结束时间 2017.1.8 23:59:59:999


router.post('/', function (req, res) {
    var body = req.body,
        id = body.id;//id
    if(Date.now() > end_time){
        return response.ApiError(res, { code: 201 }, '投票已经结束');
    }
    if(!id){
        return response.ApiError(res, {}, '参数错误');
    }
    models.Blessings.findById(id).then(function(result){
        if(!result){
            return response.ApiError(res, {}, '没有此数据');
        }
        result.increment('vote').then(function(){
            return response.ApiSuccess(res, {}, '投票成功');
        },function (err) {
            return response.ApiError(res, err, '投票失败');
        })
    },function (err) {
        return response.ApiError(res, err, '投票失败');
    })
});
module.exports = router;
