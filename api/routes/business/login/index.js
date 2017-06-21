/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var moment = require('moment');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var sms = require(process.cwd() + '/utils/sms');
var token = require(process.cwd() + '/utils/token');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var co = require('co');

var loginConfig={//登陆短信配置
    appId: '8aaf07085a3c0ea1015a4ac65d4f0696',//应用id
    templateId: '155870',//短信模板id
    accountSid: '8a48b55153eae51101540dc38ef1365c',//主账户id
    authtoken: 'db6ea888164c485fb64fb6c0122a938d',//token
    lostdata: '30',//短信失效时间
    host: "app.cloopen.com",  //主域名
    port: 8883  //端口
}
var cookieConfig={
    domain: 'dev.geju.com',
    path: '/',
    secure: false,
    maxAge: 12*3600000,
    httpOnly: true
}
/**
 * 通过手机号码验证是否为招生老师并获取登陆密码
 * @param phone - 手机号码
 * @returns {*}
 */
var checkInfo = (phone) => {
    "use strict";
    var sql=new StringBuilder();
    // sql.AppendFormat("select m.m_name as name,sales.sales_password as password from gj_members as m " +
    //     "INNER JOIN gj_sales as sales ON m.mid=sales.sales_members where m.m_phone={0} AND m.m_status=0 AND m.m_type=3",phone);
    sql.AppendFormat("SELECT m.m_name AS name,sales.sales_password AS password,sales.sales_classroom AS classroom,");
    sql.AppendFormat("class.uc_calssroomname AS classroomname FROM gj_members AS m INNER JOIN gj_sales AS sales ON m.mid = sales.sales_members");
    sql.AppendFormat(" INNER JOIN gj_userclass class ON sales.sales_classroom=class.uc_calssroomid WHERE m.m_status = 0");
    sql.AppendFormat(" AND m.m_phone = {0} AND m.m_type = 3 GROUP BY sales.sales_classroom",phone);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
/**
 * 新增验证码记录
 * @param body
 * @returns {body}
 */
var setSms = (body) => {
    return models.Smscode.create(body);
}
/**
 * 验证有效性
 * @param option
 * @returns {*}
 */
var checkSms = (option) => {
    "use strict";
    var time=option.time || 30;//默认三十分钟
    var sql=new StringBuilder();
    sql.AppendFormat("select sms.smscode as code " +
        "from gj_smscode as sms " +
        "where phoneno={0} AND type={1} AND createdAt <= '{2}' " +
        "ORDER BY createdAt DESC " +
        "LIMIT 1",option.phone,option.type,moment().add(time,'minute').format());
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
//发送验证码
router.post('/get-code', function (req, res) {
    var body=req.body;
    if(!body.phone){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var check=yield checkInfo(body.phone)
            if(check.length==0){
                return response.ApiError(res,{message:'招生老师手机号码不存在'})
            }
            sms.putCode(loginConfig,{phone:body.phone}).then(function (data) {
                setSms({
                    phoneno:body.phone,
                    smscode:data.data,
                    type:1,//招生老师验证码标识
                });
                return response.ApiSuccess(res,{message:'ok'})
            }).catch(function (err) {
                console.log(err)
                return response.ApiError(res,{message:err.toString()})
            })
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
});
//验证码登陆
router.post('/code-login', function (req, res) {
    var body=req.body;
    if(!body.phone || !body.code){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var info=yield checkInfo(body.phone);
            if(info.length==0){
                return response.ApiError(res,{message:'招生老师手机号码不存在'})
            }
            var check=yield checkSms({phone:body.phone,type:1})
            if(check.length==1 && check[0].code==body.code){
                token.encode_token({key:body.phone},function(err,data){
                    res.cookie('business', data , cookieConfig );
                    return response.ApiSuccess(res,{message:'登陆成功',phone:body.phone,name:info[0].name})
                });
            }else {
                return response.ApiError(res,{message:'验证码错误'})
            }
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
});
//密码登陆
router.post('/password-login', function (req, res) {
    var body=req.body;
    if(!body.phone || !body.password){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var info=yield checkInfo(body.phone);
            if(info.length==0){
                return response.ApiError(res,{message:'招生老师手机号码不存在'})
            }
            if(info[0].password!=body.password){
                return response.ApiError(res,{message:'密码验证不通过'})
            }
            token.encode_token({key:body.phone},function(err,data){
                res.cookie('business', data , cookieConfig );
                return response.ApiSuccess(res,{message:'登陆成功',phone:body.phone,name:info[0].name,classroomid:info[0].classroom,classroomname:info[0].classroomname})
            });
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})

        }
    })
});
//退出登陆
router.post('/quit', function (req, res) {
   res.clearCookie('business', { path: '/' });
   return response.ApiSuccess(res,{message:'退出登陆'})
});
module.exports = router;
