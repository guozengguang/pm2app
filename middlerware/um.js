/**
 * Created by Administrator on 2017/3/13 0013.
 */
"use strict";
var _ = require('lodash');
var rp = require('request-promise');
var crypto = require('crypto');
var config = require('../config/config').umeng;
var production = config.production.toString();

class UMConfig {
    /**
     * @param {object} config
     * @param {string} config.alias_type - 别名类型
     * @param {boolean} config.production - 是否为生产环境
     * @param {object} config.ios - ios配置信息
     * @param {string} config.ios.key - ios key
     * @param {string} config.ios.secret - ios secret
     * @param {object} config.android - android配置信息
     * @param {string} config.android.key - android key
     * @param {string} config.android.secret - android secret
     */
    constructor(config) {
        this.uri = 'http://msg.umeng.com/api/send';
        this.upload_uri = 'http://msg.umeng.com/upload';
        this.https = 'https://msgapi.umeng.com';

        this.alias_type = config.alias_type;
        this.production = config.production.toString() || 'false';
        this.android = config.android;
        this.ios = config.ios;
    }

    /**
     * @returns {string} 格式化后的数据
     */
    toAscii(data) {
        var str = JSON.stringify(data || this.data), ascii = '', charAscii;
        for (var i = 0; i != str.length; i++) {
            var code = Number(str[i].charCodeAt(0));
            if (code > 127) {
                charAscii = code.toString(16);
                charAscii = "0000".substring(charAscii.length, 4) + charAscii;
                ascii += "\\u" + charAscii;
            } else {
                ascii += str[i]
            }
        }
        return ascii;
    }

    /**
     * @param {string} data - 格式化后的数据
     * @param {string} uri - 地址
     * @returns {string} - 签名
     */
    sign(data, uri) {
        data = 'POST' + uri + data + this[this.device].secret;
        return crypto.createHash('md5').update(data).digest('hex');
    }

    /**
     * @function send - 发送请求
     * @returns {promise} -
     */
    send() {
        var json = this.toAscii(),
            sign = this.sign(json, this.uri);
        return rp({
            method: 'POST',
            uri: this.uri,
            //form
            headers: {
                "content-type": "application/json",
                "Content-Length": Buffer.byteLength(json)
            },
            qs: {
                sign: sign
            },
            body: json
        })
    }

    /**
     * @returns {promise} -
     */
    file(alias) {
        var data = {
            "appkey": this.data.appkey,
            "timestamp": this.data.timestamp,
            "content": alias.join('\n')
        };
        var json = JSON.stringify(data);
        var sign = this.sign(json, this.upload_uri);
        return rp({
            method: 'POST',
            uri: this.upload_uri,
            //form
            headers: {
                "content-type": "application/json",
                "Content-Length": Buffer.byteLength(json)
            },
            qs: {
                sign: sign
            },
            body: data,
            json: true
        });
    }

    format() {
        var timestamp = Date.now();
        return {
            appkey: this[this.device].key,
            timestamp: timestamp,
            production_mode: this.production,
            thirdparty_id: timestamp
        }
    }
}
class UM extends UMConfig {
    constructor(device) {
        super(config);
        this.device = device.toLowerCase();
    }

    /**
     * @function UM.alias - 文件推
     * @param {Array} alias - 别名数组
     * @param {object} options - 数据
     * @param {string} options.describe - 描述
     * @param {string} options.title - 主标题
     * @param {string} options.subtitle - 副标题
     * @param {string} options.content - 内容
     * @param {string} options.custom - 自定义参数
     * @param {number} options.type - 跳转位置 10 首页 31 课程详情 32 问题及投票
     */
    alias(alias, options) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var source = self.format(),
                key;
            source.type = 'customizedcast';
            source.description = options.describe;
            if (self.device === 'android') {
                source.alias_type = "GEJU";
                source.payload = {
                    "extra": {},
                    "display_type": "notification",
                    "body": {
                        "title": options.title,
                        "ticker": options.subtitle,
                        "text": options.content,
                        "custom": options.type,
                        "after_open": options.type > 10 ? "go_custom" : "go_app",
                    }
                };
                for (key in options.custom) {
                    if (options.custom.hasOwnProperty(key)) {
                        source.payload.extra[key] = options.custom[key];
                    }
                }
            } else {
                source.alias_type = "格局";
                source.payload = {
                    "aps": {
                        "sound": "default",
                        "alert": {
                            "body": options.content,
                            "title": options.title,
                            "subtitle": options.subtitle
                        }
                    }
                };
                options.type && (source.payload.type = options.type);
                for (key in options.custom) {
                    if (options.custom.hasOwnProperty(key)) {
                        source.payload[key] = options.custom[key];
                    }
                }
            }
            self.data = source;
            self.file(alias).then(function (result) {
                if (result.ret === 'SUCCESS') {
                    source.file_id = result.data.file_id;
                    self.data = source;
                    self.send().then(function (send_result) {
                        if (send_result.ret === 'SUCCESS') {
                            resolve(send_result);
                        } else {
                            reject(send_result);
                        }
                    }, function (err) {
                        reject(err);
                    })
                } else {
                    reject(result);
                }
            }, function (err) {
                reject(err);
            })
        })
    }

    /**
     * 详细参数见 http://dev.umeng.com/push/ios/api-doc#2_1
     * 备注 appkey timestamp  production_mode thirdparty_id 可不填写
     * @function UM.custom - 自定义推送
     * @param {object} data - 数据
     */
    custom(data) {
        this.data = _.assign(this.format(), data);
        return new Promise(function (resolve, reject) {
            this.send().then(function (send_result) {
                if (send_result.ret === 'SUCCESS') {
                    resolve(send_result);
                } else {
                    reject(send_result);
                }
            }, function (err) {
                reject(err);
            })
        })
    }
}

module.exports = UM;
