/**
 * Created by Administrator on 2017/3/9 0009.
 */
var moment = require('moment');
var rq = require('request-promise');
var _ = require('lodash');
var cwd = process.cwd();
var config = require(cwd + '/config/config.js');
var str = require(cwd + '/utils/str');
var source_options = {
    "templateId": config.rlsms.templateId,
    "appId": config.rlsms.appId,
    "datas": []
};
/**
 * @public
 * @function [template] 短信发送
 * @description 通过模板发送短信
 * @param {object} options -
 * @param {string[]} options.to
 * @param {string[]} options.datas  -短信模板数据数组
 * @param {string} options.templateId  -短信模板ID
 * @returns {promise} Promise
 **/
exports.template = function template(options) {
    var accountSid = config.rlsms.accountSid;
    var authtoken = config.rlsms.authtoken;
    if (options.to.length === 0 || options.to.length > 50) {
        throw new Error('手机号不允许超过50个');
    }
    options.to = options.to.join(',');
    var data = JSON.stringify(_.merge(source_options, options)),
        gettime = moment(new Date()).format('YYYYMMDDhhmmss'),
        Authorization = new Buffer(config.rlsms.accountSid + ":" + gettime).toString("base64"),
        SigParameter = str.md5(accountSid + authtoken + gettime).toUpperCase(),
        opt = {
            method: 'POST',
            uri: 'https://' + config.rlsms.host + (config.rlsms.port ? ':' + config.rlsms.port : '') + '/2013-12-26/Accounts/' + accountSid + '/SMS/TemplateSMS',
            qs: {
                sig: SigParameter
            },
            headers: {
                "Accept": 'application/json',
                "Content-Type": 'application/json;charset=utf-8',
                "Content-Length": Buffer.byteLength(data),
                "Authorization": Authorization
            },
            body: data
        };
    return rq(opt);
};