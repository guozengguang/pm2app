/**
 * Created by Administrator on 2017/3/15 0015.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var models = require(cwd + '/models/index');
var response = require(cwd + '/utils/response');
var UM = require(cwd + '/middlerware/um');
var UMeng = require(cwd + '/middlerware/umeng');

router.get('/', function (req, res) {
    var phone = [15522222221, 18601148972, 15522222229, 18515063525];
    new UM('ios').alias(phone, {
        describe: '描述',
        title: '主标题',
        subtitle: '副标题',
        content: '内容',
        custom: {classid: 1},
        type: 31
    }).then(function (result) {
        return response.ApiSuccess(res, result);
    }, function (err) {
        console.log(err);
        return response.ApiError(res, err);
    })
});
router.get('/u', function (req, res) {
    var phone = [15522222221, 18601148972, 15522222229, 18515063525];
    UMeng.android_content(phone, {title: '1234'});
    return response.ApiSuccess(res, {});
});
module.exports = router;
