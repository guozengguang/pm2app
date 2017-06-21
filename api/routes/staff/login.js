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
    var boolean = body.phone && body.validate && body.code && body.signature && body.iv && body.encryptedData;
    if (!boolean) {
        return response.ApiError(res, {}, '参数错误');
    }
    wx.get_session_key(body.code, function (err, result) {
        if (err) {
            return response.ApiError(res, {}, '网络错误');
        }
        result = JSON.parse(result);
        if (!result.session_key) {
            return response.ApiError(res, {}, '身份识别码错误:' + result.errmsg);
        }
        body.openId = result.openid;
        // var info = new wx.crypt_openid(result.session_key).decryptData(body.encryptedData, body.iv);
        // if (!info) {
        //     return response.ApiError(res, {}, '用户信息验证失败');
        // }
        co(function *() {
            try {
                var code = yield models.Smscode.findOne({
                    where: {
                        smscode: body.validate,
                        phoneno: body.phone,
                        createdAt: {'$gt': moment().add('-30', 'minute').format()}
                    },
                    raw: true,
                    attributes:['smscode']
                });
                if (!code || (code.smscode != body.validate)) {
                    return response.ApiError(res, {}, '验证码错误');
                }
                //身份证 m_card 姓名 m_name 学院 classroom 身份 m_type=0
                var staff = yield models.Members.findOne({
                    where: {
                        m_phone: body.phone,
                        m_type: 9
                    },
                    raw: true,
                    plain: true
                });
                if (!staff) {
                    return response.ApiError(res, {}, '没有此员工');
                }
                //_.assign(body, info);
                body.userId = staff.mid;
                //console.log('info',info);
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
                        uid: result.userId,
                        oid: result.openId
                    }}, '登录成功')
                }, function (error) {
                    console.log('######################################');
                    console.log(error);
                    console.log('######################################');
                    return response.ApiError(res, {}, '用户登录失败');
                });
            } catch (e) {
                console.log(e);
            }
        });
    });
});
module.exports = router;