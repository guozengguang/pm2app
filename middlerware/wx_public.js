/**
 * Created by Administrator on 2016/11/21 0021.
 */

var cwd = process.cwd();

var request = require('request');
var co = require('co');
var rp = require('request-promise');
var crypto = require('crypto');

var utils = require(cwd + '/middlerware/utils');
var models = require(cwd + '/models/index');
var wx_config = require(cwd + '/config/config').weixin;
var cache = require(cwd + '/utils/cache');
var redis = cache.redis;

var weChat = {
    token: function () {
        return new Promise(function (res, rej) {
            co(function *() {
                try {
                    var result = undefined// yield redis.getAsync('access_token');
                    if (result) {
                        return res(result)
                    }
                    var body = yield rp({
                        url: 'https://api.weixin.qq.com/cgi-bin/token',
                        qs: {
                            grant_type: 'client_credential',
                            appid: wx_config.appid,
                            secret: wx_config.secret
                        },
                        json: true,
                    });
                    if (body && body.access_token) {
                        cache.set('access_token', body.access_token, body.expires_in - 100);
                        return res(body.access_token);
                    } else {
                        return rej({
                            message: body.errmsg,
                            code: body.errcode
                        });
                    }
                }
                catch (e) {
                    console.log(e);
                    return rej({
                        message:e
                    });
                }
            })
        })
    },
    ticket: function () {
        var that = weChat;
        return new Promise(function (res, rej) {
            co(function *() {
                try {
                    var result = yield redis.getAsync('ticket');
                    if (result) {
                        return res(result)
                    }
                    var token = yield that.token();
                    console.log(token);
                    var body = yield rp({
                        url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
                        qs: {
                            access_token: token,
                            type: 'jsapi'
                        },
                        json: true,
                    });
                    if (body && body.ticket) {
                        redis.setAsync('ticket', body.ticket);
                        redis.expire('ticket', body.expires_in - 100 || 7100);
                        return res(body.ticket)
                    } else {
                        return rej({
                            message: body.errmsg,
                            code: body.errcode
                        });
                    }
                } catch (e) {
                    console.log(e);
                    return rej({
                        message:e
                    });
                }
            });
        })
    },
    signature: function (url) {
        var that = weChat;
        return new Promise(function (res, rej) {
            co(function *() {
                try {
                    var result = yield redis.getAsync('signature');
                    if (result) {
                        return res(JSON.parse(result));
                    }
                    var jsapi_ticket = yield that.ticket();
                    if(!jsapi_ticket){
                        return rej({
                            message: 'ticket 不存在'
                        });
                    }
                    var noncestr = utils.random_string(16);
                    var timestamp = ((Date.now()/1000) | 0).toString();

                    var signature_source = 'jsapi_ticket=' + jsapi_ticket +
                        '&noncestr=' + noncestr +
                        '&timestamp=' + timestamp +
                        '&url=' + url;
                    var signature = crypto.createHash('sha1').update(signature_source,'utf8').digest('hex');
                    result = {
                        appId: wx_config.appid,
                        timestamp: timestamp,
                        nonceStr: noncestr,
                        signature: signature,
                        url: url
                    };
                    cache.set('signature', result, 1);
                    return res(result)
                } catch (e) {
                    console.log(e);
                    return rej({
                        message:e
                    });
                }
            });
        })
    }
};

module.exports = weChat;