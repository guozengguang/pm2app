/**
 * Created by Administrator on 2016/11/2 0002.
 */
var express = require('express');
var router = express.Router();
var WORK_PATH = process.cwd();
var request = require('request');
var _ = require('lodash');
var models = require(WORK_PATH + '/models/index');
var sms = require(WORK_PATH + '/utils/sms');
var dingTalk = require(WORK_PATH + '/middlerware/ding_talk');
var hx = require(WORK_PATH + '/utils/hxchat');
var py = require(WORK_PATH + '/utils/strChineseFirstPY');
var Filter = require(WORK_PATH + '/utils/filter');
var response = require(WORK_PATH + '/utils/response');
var Logs=require(WORK_PATH + "/admin/controller/logs");

router.all(Filter.authorize);
function proxy(res, state) {//事件代理函数
    console.log(state);
    var success = true;
    var result_info = ['用户写入成功'];
    var boolean2 = state.ding !==undefined && state.hx !==undefined ;
    if(!boolean2){
        return false;
    }
    if(state.ding === false && state.sms === undefined){
        return false;
    }
    if(state.ding){//用户写入失败
        success = false;
        result_info.push('钉钉用户创建失败，'+ state.ding);
    }else {
        result_info.push('钉钉用户创建成功');
        if(state.sms){
            success = false;
            result_info.push('短信发送失败,错误码：' + state.sms);
        }else {
            result_info.push('短信发送成功');
        }
    }
    if(state.hx){
        success = false;
        result_info.push('环信用户创建失败,' + state.hx);
    }else {
        result_info.push('环信用户创建成功');
    }
    if(success){
        response.ApiSuccess(res, {} , result_info.join(','));
    }else {
        response.ApiError(res, {} , result_info.join(','));
    }
}
router.post('/', function (req, res) {
    var body = req.body,state = {
        ding: undefined,
        sms: undefined,
        hx: undefined
    };
    if (!body.m_phone) {
        return response.onError(res, {message: '错误操作'})
    }
    if (body.m_badge && body.m_badge instanceof Array) {
        body.m_badge = body.m_badge.join(",")
    }
    if (body.m_name) {
        body.m_firstabv = py.makePy(body.m_name);
    }
    models.Members.findOrCreate({
        where: {
            m_phone: body.m_phone
        },
        defaults: body,
        raw: true,
        plain: true
    }).then(function (result) {
        var item = result[0];
        /* 新建用户日志 */
        Logs.logsSave({
            lg_content: "新建用户【" + body.m_phone + "】",
            lg_ip: req.ip,
            uid: req.session.user.uid
        });
        /* 这里是钉钉注册 */
        dingTalk.create_user(item, function (err, result) {
            console.log('########### dingding ');
            if(err){
                state.ding = err;
            }else {
                state.ding = false;
                /* 这里是短信发送 */
                sms.send_by_template_id({
                    to: [body.m_phone],
                    templateId: '128939'
                }, function (err_code, result) {
                    console.log('########### SMS ');
                    if (err_code) {
                        state.sms = err_code;
                    } else {
                        state.sms = false;
                    }
                    return proxy(res, state);
                });
            }
            return proxy(res, state);
        });
        /* 这里是环信注册 */
        hx.reghxuser({username: item.mid}, function (err, result) {
            console.log('########### HX ');
            if(err){
                state.hx = err;
            }else {
                state.hx = false;
            }
            return proxy(res, state);
        });
    },function (err) {
        return response.ApiError(res, err ,'用户写入失败');
    });
});
module.exports = router;