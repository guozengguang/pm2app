/**
 * Created by Administrator on 2016/11/17 0017.
 */
var express = require('express');
var co = require('co');
var router = express.Router();
var cwd = process.cwd();
var models = require(cwd + '/models/index');
var response = require(cwd + '/utils/response');
var sms = require(cwd + '/utils/sms');
var cache = require(cwd + '/utils/cache');
var redis = cache.redis;

router.post('/', function (req, res) {
    var phone = req.body.phone;
    if(!phone){
        return response.ApiError(res,{},'参数错误');
    }
    co(function *() {
        try{
            var redis_set_name = 'sms_wx_login_' + phone;
            var result = yield redis.getAsync(redis_set_name);
            if (result) {
                return response.ApiError(res, {code: 401}, "验证码60秒内只发送一次");
            }
            // 产生验证码
            var code=parseInt((Math.random()*9+1)*100000)+'';
            // 发送验证码
            sms.get_code({mpno:phone,code:code},function(err,result){
                result=JSON.parse(result);
                if (result.statusCode=="000000"){//发送成功
                    models.Smscode.create({
                        phoneno:phone,
                        smscode:code
                    });
                    redis.setAsync(redis_set_name, code);
                    redis.expire(redis_set_name, 59);//TODO 59
                    return response.ApiSuccess(res,{data:'验证码发送成功'});
                }else {
                    console.log('服务商',result);
                    return response.ApiError(res, {}, "验证码发送失败(服务商)");
                }
            });
        }catch (e){
            console.log('验证码 try',e);
            return response.ApiError(res, {}, "验证码发送失败");
        }
    });
});
module.exports = router;