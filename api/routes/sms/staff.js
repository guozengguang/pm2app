/**
 * Created by Administrator on 2016/11/17 0017.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var sms = require(process.cwd() + '/utils/sms');
var co = require('co');
router.post('/', function (req, res) {
    var phone = req.body.phone;
    if(!phone){
        return response.ApiError(res,{},'参数错误');
    }
    models.Members.findOne({
        where:{
            m_phone:phone,
            m_type: 9
        },
        attributes:['mid'],
        plain: true,
        raw: true
    }).then(function(item){
        if (item){
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
                    return response.ApiSuccess(res,{data:'验证码发送成功'});
                }else {
                    return response.ApiError(res, {}, "验证码发送失败");
                }
            });
        }else {
            return response.ApiError(res,{message:"您不是内部员工!"});
        }
    }, function(err){
        console.log(err)
        return response.ApiError(res,{message:"验证码发送失败..."});
    });
});
module.exports = router;