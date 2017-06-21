"use strict";
var Umeng = require('UmengNode');
var _ = require('lodash');
var co = require('co');

var timestamp = Date.now();
var config = require('../config/config').umeng;
var production = config.production;
var sequelize = require('../models/index').sequelize;
var Message = {
    title: '您的课程即将开始',
    text: '您的课程即将开始',
    content: '您在格局商学院的课程马上就要开课啦'
};
var info = {
    timestamp: timestamp,
    payload: {
        aps: {"alert": '您的课程即将开始'},// 苹果必填字段
        display_type: 'notification',
        body: {
            "after_open": 'go_app'
        }
    },
    policy: {},//定时任务
    description: '您在格局商学院的课程马上就要开课啦',
    thirdparty_id: '1'//消息标识ID
};
var umeng = {
    android_content: function (arr, message1) {
        var message = _.cloneDeep(message1);
        timestamp = Date.now();
        info.timestamp = Date.now();
        var file = new Umeng();
        file.initialize({
            platform: 'android',
            appKey: config.android.key,
            appMasterSecret: config.android.secret,
            production_mode: production,
            content: arr
        });
        file.fileupload({
            timestamp: timestamp
        }, function (err, httpResponse, result) {
            result = JSON.parse(result);
            if (result.ret === 'SUCCESS') {
                umeng.filecast('android', message, result.data.file_id);
            } else {
                umeng._err(err, httpResponse, result);
            }
        });
    },
    ios_content: function (arr, message, cb) {
        timestamp = Date.now();
        info.timestamp = Date.now();
        var file = new Umeng();
        file.initialize({
            platform: 'ios',
            appKey: config.ios.key,
            appMasterSecret: config.ios.secret,
            production_mode: production,
            content: arr
        });
        file.fileupload({
            timestamp: timestamp
        }, function (err, httpResponse, result) {
            result = JSON.parse(result);
            if (result.ret === 'SUCCESS') {
                umeng.filecast('ios', message, result.data.file_id, cb);
            } else {
                umeng._err(err, httpResponse, result, cb);
            }
        });
    },
    _ios: function () {
        timestamp = Date.now();
        info.timestamp = Date.now();
        var ios = new Umeng();
        ios.initialize({
            platform: 'ios',
            appKey: config.ios.key,
            appMasterSecret: config.ios.secret,
            production_mode: production
        });
        return ios;
    },//创建ios对象
    _android: function () {
        timestamp = Date.now();
        info.timestamp = Date.now();
        var android = new Umeng();
        android.initialize({
            platform: 'android',
            appKey: config.android.key,
            appMasterSecret: config.android.secret,
            production_mode: production
        });
        return android;
    },//创建android对象
    auto: function () {
        // WHERE class_start > now() AND DATE_SUB(now(),INTERVAL -30 MINUTE) > class_start
        sequelize.query('SELECT uc_userphone, classid,class_name FROM gj_userclass AS uc RIGHT JOIN gj_class AS c ON c.classid = uc.uc_goodsid WHERE class_start > DATE_SUB(now(),INTERVAL -30 MINUTE) AND DATE_SUB(now(),INTERVAL -31 MINUTE) > class_start ORDER BY class_start; ',
            {type: sequelize.QueryTypes.SELECT})
            .then(function (result) {
                if (result.length) {
                    var obj = {};
                    result.forEach(function (v) {
                        if (!obj[v.classid]) {
                            obj[v.classid] = [];
                        }
                        obj[v.classid].push(v.uc_userphone);
                    });
                    umeng._distribute(obj, result[0].class_name);
                }
            });
    },//自动发送
    _distribute: function (obj, name) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var message = umeng._format_data(Message);
                var a_m = _.cloneDeep(message);
                a_m.payload.body.after_open = 'go_custom';
                a_m.payload.display_type = 'notification';
                a_m.payload.body.custom = 31;
                a_m.payload.extra = {
                    classid: +key//课程ID
                };
                umeng.android_content(obj[key], a_m);
                var i_m = _.cloneDeep(message);
                i_m.payload.body.after_open = 'go_app';
                i_m.payload.display_type = 'notification';
                i_m.payload.type = 31;
                i_m.payload.classid = +key;//课程ID
                umeng.ios_content(obj[key], message);
            }
        }
    },//分发
    _format_data: function (message_source, users) {
        message_source = message_source || {};
        (typeof users === 'string') && (users = [users]);
        var go_type = '';
        if (message_source.type > 30) {
            go_type = 'go_custom';
        } else if (message_source.type == 10) {
            go_type = 'go_app';
        } else {
            go_type = '';
        }
        var message = _.assign(info, {
            payload: {
                aps: {
                    "alert": {
                        "title": message_source.title || Message.title,
                        "subtitle": message_source.title || Message.title,
                        "body": message_source.content || Message.content
                    }
                },// 苹果必填字段
                body: {
                    "ticker": message_source.title || Message.title,
                    "title": message_source.title || Message.title,
                    "text": message_source.content || Message.content,
                    "after_open": go_type
                }
            },
            alias_type: config.alias_type,
            alias: users && users.join(','),
            description: message_source.desc || Message.content,
        });
        if (message_source.type) {
            message.payload.body.custom = message_source.type;
            message.payload.type = message_source.type;
            message.payload.classid = message_source.key;
            message.payload.extra = {
                classid: message_source.key//课程ID
            };
            message.payload.type = message_source.type;
            message.payload.classid = +message_source.key;//课程ID
        }
        if (message_source.type == 0) {
            message.payload.display_type = 'message';
        }
        if (message_source.time) {
            message.policy.expire_time = message.time;//定时任务
        }
        console.log('166', message);
        return message
    },//格式化info
    _err: function (err, httpResponse, result, cb) {
        if (err) {
            console.log(err);
            console.log('error:友盟推送失败');
            return false;
        } else {
            if (result.ret === "FAIL") {
                console.log('友盟推送失败', result.data.error_code);
            } else {
                //TODO
            }
        }
        cb && cb(result.data);
    },//错误回调
    filecast: function (device, message, id, cb) {
        message = umeng._format_data(message, []);
        message.type = 'customizedcast';
        message.file_id = id;
        delete message.alias;
        umeng['_' + device]().filecast(message, function (err, httpResponse, result) {
            umeng._err(err, httpResponse, result, cb);
        });
    },
    send_all: function (message, cb) {
        message = umeng._format_data(message);
        umeng._android().broadcast(message, function (err, httpResponse, result) {
            umeng._err(err, httpResponse, result, cb);
        });
        message.payload.body.after_open = 'go_app';
        umeng._ios().broadcast(message, function (err, httpResponse, result) {
            umeng._err(err, httpResponse, result, cb);
        });
    },
    send_double: function (users, message, cb) {
        umeng.ios_content(users, message, cb);
        umeng.android_content(users, message);
    },
    android: function (users, message, cb) {
        umeng.send('android', users, message);
    },
    ios: function (users, message, cb) {
        umeng.send('ios', users, message, cb);
    }
};
module.exports = umeng;
