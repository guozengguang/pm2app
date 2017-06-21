/**
 * Created by Administrator on 2017/3/6 0006.
 */
var express = require('express');
var co = require('co');
var router = express.Router();
var cwd = process.cwd();
var models = require(cwd + '/models/index');
var response = require(cwd + '/utils/response');
var sms = require(cwd + '/middlerware/sms');
var cache = require(cwd + '/utils/cache');
var redis = cache.redis;


router.post('/', function (req, res) {
    var body = req.body,
        phone = body.phone,
        template = body.template,
        data = body.data || [];
    if(!phone || !template){
        return response.ApiError(res,{},'参数错误');
    }
    co(function *() {
        try{
            var redis_set_name = 'sms_' + phone + '_' + template;
            var result = yield redis.getAsync(redis_set_name);
            if (result) {
                return response.ApiError(res, {code: 401}, "短信60秒内只发送一次");
            }
            sms.template({
                templateId: template,
                datas: data,
                to: [phone]
            }).then(function (result) {
                console.log(result);
                redis.setAsync(redis_set_name, '1');
                redis.expire(redis_set_name, 59);//TODO 59
                return response.ApiSuccess(res, result, '短信发送成功');
            },function (err) {
                console.log('admin/sms 服务商',err);
                return response.ApiError(res, err, "验证码发送失败(服务商)");
            });
        }catch (e){
            console.log('短信 admin/sms try',e);
            return response.ApiError(res, {}, "短信发送失败");
        }
    });
});
module.exports = router;