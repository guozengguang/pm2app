/**
 * 以色列付费报名提交接口
 * Created by guozengguang on 2017/6/12.
 */
var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var config = require(cwd + '/config/config');
var sms = require(process.cwd() + '/utils/sms');

var informConfig = config.rlsms;

router.post('/', function (req, res) {
    var body = req.body;
    var enrollUserName = body.name;
    var flag = body.flag;
    var enrollMoney = "88,000";
    if(flag == "0"){//非学员/亲友报名
        body.student_status = "1";
    }
    console.log('*************')
    console.log(body.is_need_single_room,'body.is_need_single_room')
    if(body.is_need_single_room){
        console.log('1')
        enrollMoney = "94,600";
    }
    models.IsraelPayEnroll.create(
        body
    ).then(function (result) {
        if(flag == "1"){//学员/亲友报名需要发送报名成功短信
            informConfig.templateId = 182631;
            sms.putInform(informConfig, {phone: body.phone + '', data: [enrollUserName + '']});
        }
        return response.ApiSuccess(res, {enrollMoney:enrollMoney}, '报名成功');
    }, function (err) {
        return response.ApiError(res, err);
    });
});
module.exports = router;