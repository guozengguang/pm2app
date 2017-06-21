/**
 * Created by Administrator on 2016/11/22 0022.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var wx_public = require(process.cwd() + '/middlerware/wx_public');
var request = require('request');
var co = require('co');

router.get('/', function (req, res) {
    var url = req.query.url;
    if(!url){
        return response.ApiError(res, {}, '参数错误');
    }
    wx_public.signature(url).then(function (result) {
        return response.ApiSuccess(res, {data: result}, '获取成功')
    },function (err) {
        return response.ApiError(res, err, err.message);
    });
});
module.exports = router;



