/**
 * Created by Administrator on 2016/11/17 0017.
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
var cache = require(cwd + '/utils/cache');
var redis = cache.redis;
/**
 * Book类，代表一个书本.
 * @function 学院第一次登录
 * @param {string} code - 验证码.
 * @param {string} phone - 手机号..
 * @param {string} openId - 微信单应用唯一标识.
 * @param {string} unionId - 微信多应用唯一标识.
 * @param {string} nickName - 昵称.
 * @param {string} gender - 性别.
 * @param {string} city - 城市.
 * @param {string} province - 省份.
 * @param {string} country - 国家.
 * @param {string} avatarUrl - 头像..
 */
router.post('/', function (req, res) {
    var body = req.body;
    //判断参数是否正确
    var boolean = body.phone
        && body.validate
        && body.name
        && body.openId;
    if (!boolean) {
        return response.ApiError(res, {}, '参数错误');
    }
    //获取微信session_key
    /*wx.get_session_key(body.code, function (err, result) {
        if (err) {
            return response.ApiError(res, {}, '网络错误');
        }
        result = JSON.parse(result);
        if (!result.session_key) {
            return response.ApiError(res, {}, '验证码错误:' + result.errmsg);
        }
        body.openId = result.openid;

        var info = new wx.crypt_openid(result.session_key).decryptData(body.encryptedData, body.iv);
        if (!info) {
            return response.ApiError(res, {}, '用户信息验证失败');
        }
        */

        co(function *() {
            try {
                // 908217
                // 判断验证码是否正确
                var redis_set_name = 'sms_wx_login_' + body.phone;
                var code = yield redis.getAsync(redis_set_name);
                if (!code || (code != body.validate)) {
                    return response.ApiError(res, {}, '验证码错误');
                }
                // 存储逻辑开始
                var staff = yield models.Members.findOrCreate({
                    where: {
                        m_phone: body.phone
                    },
                    defaults: {
                        m_name: body.name,//姓名
                        m_card: body.card,//身份证
                        m_m_pics: body.avatarUrl,//头像
                        m_type: 0//身份
                    },
                    raw: true
                });
                if(!staff){
                    return response.ApiError(res, {}, '用户登录失败');
                }else {
                    if(staff[1]){
                        //已经有的用户
                    }else {
                        //新建用户
                    }
                    body.userId = staff[0].mid;
                }
                models.WX.findOrCreate({
                    where: {
                        openId: body.openId,
                        userId: body.userId
                    },
                    defaults: body,
                    raw: true
                }).then(function (result) {
                    if (result[1]) {
                        result = result[0].dataValues
                    } else {
                        result = result[0]
                    }
                    return response.ApiSuccess(res, {data: {
                        uid: result.userId
                    }}, '登录成功')
                }, function (error) {
                    console.log(error);
                    return response.ApiError(res, {}, '用户登录失败');
                });
            } catch (e) {
                console.log(e);
            }
        });
    /* });*/
});
module.exports = router;