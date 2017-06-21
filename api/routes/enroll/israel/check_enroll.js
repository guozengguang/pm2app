/**
 * 以色列付费报名提交接口
 * Created by guozengguang on 2017/6/12.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');

router.get('/', function (req, res) {
    var body = req.query;
    models.IsraelPayEnroll.findOne(
        {where: {phone: body.phone}, raw: true}
    ).then(function (result) {
        if (result) {
            return response.ApiSuccess(res, result, '该用户已经报名,获取信息成功');
        } else {
            return response.ApiError(res, {code: 404, message: '该用户未报名'});
        }
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;