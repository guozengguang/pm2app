/**
 * Created by Administrator on 2016/11/18 0018.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var models = require(cwd + '/models/index');
var moment = require('moment');
var response = require(cwd + '/utils/response');
var wx = require(cwd + '/middlerware/wx');
var _ = require('lodash');
var co = require('co');
router.get('/', function (req, res) {
    var query = req.query;
    var code = query.code;
    if (!code) {
        return response.ApiError(res, {}, '参数错误');
    }
    wx.get_session_key(code, function (err, result) {
        if (err) {
            return response.ApiError(res, {}, '网络错误');
        }
        result = JSON.parse(result);
        if (!result.session_key) {
            return response.ApiError(res, {}, '身份识别码错误:' + result.errmsg);
        }else {
            return response.ApiSuccess(res, {data: result.openid}, '获取成功');
        }
    });
});
module.exports = router;