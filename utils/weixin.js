/**
 * Created by trlgml on 2017/5/4.
 */

var WXPay = require('weixin-pay');
var fs=require('fs')
var WechatAPI = require('wechat-api');
var config=require('../config/config');

var api = new WechatAPI(config.pay.weixin.appid, config.pay.weixin.secret);

var wxpay = WXPay({
    appid: config.pay.weixin.appid,
    mch_id: config.pay.weixin.mch_id,
    partner_key: config.pay.weixin.partner_key, //微信商户平台API密钥
    pfx: fs.readFileSync(config.pay.weixin.pfx), //微信商户平台证书
});

var Payment = require('wechat-pay').Payment;
var Middleware = require('wechat-pay').middleware;
var initConfig = {
    partnerKey: config.pay.weixin.partner_key,
    appId: config.pay.weixin.appid,
    mchId: config.pay.weixin.mch_id,
    notifyUrl:config.pay.weixin.notify ,
    pfx: fs.readFileSync(config.pay.weixin.pfx)
};
var payment = new Payment(initConfig);
var middleware = Middleware(initConfig);

module.exports = {
    wxpay:wxpay,
    api:api,
    payment:payment,
    middleware:middleware
};


