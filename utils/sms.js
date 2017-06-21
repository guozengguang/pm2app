var sms={};
var config=require('../config/config.js');
var moment=require('moment');
var str=require('./str');
var https = require('https');
var _ = require('lodash');
/**
 * 发送验证码 高级
 * @param config - 服务商配置项目
 * @param option - 参数选项
 * @param option.phone - 手机号
 * @param option.code - 验证码
 * @returns {Promise} - 成功返回code码 失败返回失败状态
 */
sms.putCode= (config,option) =>{
    var phone=option.phone;//必须传递参数
    var code=option.code || parseInt((Math.random()*9+1)*100000); //验证码 不传递自己生成6为随机数
    var data={
        "to":phone,
        "appId":config.appId,
        "templateId":config.templateId,
        "datas":[code,config.lostdata]
    };

    data = JSON.stringify(data);
    var getTime = moment(new Date()).format('YYYYMMDDhhmmss');

    var Authorization = new Buffer(config.accountSid+":"+getTime).toString("base64");
    var SigParameter = str.md5(config.accountSid +config.authtoken + getTime).toUpperCase();

    var opt = {
        method: "POST",
        host: config.host,
        port: config.port,
        path: '/2013-12-26/Accounts/'+config.accountSid+'/SMS/TemplateSMS?sig='+SigParameter,
        headers: {
            "Accept": 'application/json',
            "Content-Type": 'application/json;charset=utf-8',
            "Content-Length": data.length,
            "Authorization":Authorization
        }
    };
    return new Promise(function (resolve,reject) {
        "use strict";
        var req = https.request(opt, function (res) {
            var body = "";
            res.setEncoding('utf8');
            res.on('data', function (data) {
                body += data;
                if (res.statusCode == 200) {
                    return resolve({code: res.statusCode, data: code});
                } else {
                    return reject({code: res.statusCode, data: data});
                }
            })
        });
        req.on('error', function (e) {
            return reject({code: 500, data: e});
        });
        req.write(data + "\n");
        req.end()
    })
}

sms.putInform= (config,option) =>{
    var phone=option.phone;//必须传递参数
    var data={
        "to":phone,
        "appId":config.appId,
        "templateId":config.templateId,
        "datas":option.data
    };

    data = JSON.stringify(data);
    var getTime = moment(new Date()).format('YYYYMMDDhhmmss');

    var Authorization = new Buffer(config.accountSid+":"+getTime).toString("base64");
    var SigParameter = str.md5(config.accountSid +config.authtoken + getTime).toUpperCase();

    var opt = {
        method: "POST",
        host: config.host,
        port: config.port,
        path: '/2013-12-26/Accounts/'+config.accountSid+'/SMS/TemplateSMS?sig='+SigParameter,
        headers: {
            "Accept": 'application/json',
            "Content-Type": 'application/json;charset=utf-8',
            "Content-Length":Buffer.byteLength(data, 'utf8'),
            "Authorization":Authorization
        }
    };
    return new Promise(function (resolve,reject) {
        "use strict";
        var req = https.request(opt, function (res) {
            var body = "";
            res.setEncoding('utf8');
            res.on('data', function (data) {
                body += data;
                // console.log(res)
                if (res.statusCode == 200) {
                    return resolve({code: res.statusCode,data:data});
                } else {
                    return reject({code: res.statusCode, data: data});
                }
            })
        });
        req.on('error', function (e) {
            return reject({code: 500, data: e});
        });
        req.write(data + "\n");
        req.end()
    })
}

sms.get_code=function(option,callback){
    var mpno=option.mpno;
    var code=option.code;
    var data={
        "to":mpno,
        "appId":config.rlsms.appId,
        "templateId":config.rlsms.templateId,
        "datas":[code,config.rlsms.lostdata]
    };

    data = JSON.stringify(data);
    var gettime = moment(new Date()).format('YYYYMMDDhhmmss');

    var Authorization = new Buffer(config.rlsms.accountSid+":"+gettime).toString("base64");
    var SigParameter = str.md5(config.rlsms.accountSid +config.rlsms.authtoken + gettime).toUpperCase();

    var opt = {
        method: "POST",
        host: config.rlsms.host,
        port: config.rlsms.port,
        path: '/2013-12-26/Accounts/'+config.rlsms.accountSid+'/SMS/TemplateSMS?sig='+SigParameter,
        headers: {
            "Accept": 'application/json',
            "Content-Type": 'application/json;charset=utf-8',
            "Content-Length": data.length,
            "Authorization":Authorization
        }
    };
    var req = https.request(opt, function (res) {
        if (res.statusCode==200){
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                return callback(null,chunk);
            });
        }else {
            var e=new Error('服务商故障');
            return callback(e.message);
        }
    });
    req.on('error', function(e) {
        console.log(e.message);
        return callback(err);
    });
    req.write(data + "\n");
    req.end();
};
sms.send_smsbytemplate=function(option,callback){
    var mpnos=option.mpnos;
    var templateId=option.templateId;
    var parameters=option.parameters;
    var data={
        "to":mpnos,
        "appId":config.rlsms.appId,
        "templateId":templateId,
        "datas":parameters
    };

    data = JSON.stringify(data);
    var gettime = moment(new Date()).format('YYYYMMDDhhmmss');

    var Authorization = new Buffer(config.rlsms.accountSid+":"+gettime).toString("base64");
    var SigParameter = str.md5(config.rlsms.accountSid +config.rlsms.authtoken + gettime).toUpperCase();

    var opt = {
        method: "POST",
        host: config.rlsms.host,
        port: config.rlsms.port,
        path: '/2013-12-26/Accounts/'+config.rlsms.accountSid+'/SMS/TemplateSMS?sig='+SigParameter,
        headers: {
            "Accept": 'application/json',
            "Content-Type": 'application/json;charset=utf-8',
            "Content-Length": data.length,
            "Authorization":Authorization
        }
    };
    var req = https.request(opt, function (res) {
        if (res.statusCode==200){
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                return callback(null,chunk);
            });
        }else {
            var e=new Error('服务商故障');
            return callback(e.message);
        }
    });
    req.on('error', function(e) {
        console.log(e.message);
        return callback(err);
    });
    req.write(data + "\n");
    req.end();
};
var sms_options = {
    "templateId":config.rlsms.templateId,
    "appId":config.rlsms.appId,
    "datas":[]
};
/**
 * @public
 * @function [send_template] 短信发送 默认为config模板
 * @description 发送短信
 * @param {object} options -
 * @param {string[]} options.to
 * @param {string[]} options.datas  -短信模板数据数组
 * @param {string} options.templateId  -短信模板ID
 * @param {requestCallback} callback - The callback that handles the response.
 **/
sms.send_by_template_id =function send_template(options,callback){
    var accountSid = config.rlsms.accountSid;
    var authtoken = config.rlsms.authtoken;
    if(options.to.length === 0 || options.to.length > 50){
        throw new Error('手机号不允许超过50个');
    }
    options.to = options.to.join(',');
    var data = JSON.stringify(_.merge(sms_options,options));
    var gettime = moment(new Date()).format('YYYYMMDDhhmmss');
    var Authorization = new Buffer(config.rlsms.accountSid + ":"+gettime).toString("base64");
    var SigParameter = str.md5(accountSid + authtoken + gettime).toUpperCase();
    var opt = {
        method: "POST",
        host: config.rlsms.host,
        port: config.rlsms.port,
        path: '/2013-12-26/Accounts/'+accountSid+'/SMS/TemplateSMS?sig='+SigParameter,
        headers: {
            "Accept": 'application/json',
            "Content-Type": 'application/json;charset=utf-8',
            "Content-Length": data.length,
            "Authorization":Authorization
        }
    };
    var req = https.request(opt, function (res) {
        if (res.statusCode==200){
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                chunk = JSON.parse(chunk);
                if(chunk.statusCode === "000000"){
                    return callback(null,chunk);
                }else {
                    return callback('容联错误码:' + chunk.statusCode + ',' + chunk.statusMsg);
                }
            });
        }else {
            var e=new Error('服务商故障');
            return callback(e.message);
        }
    });
    req.on('error', function(e) {
        return callback(e);
    });
    req.write(data + "\n");
    req.end();
}
/**
 * @callback requestCallback(error_code,result)
 * @param {number} error_code
 * @param {object} result
 **/
module.exports=sms;