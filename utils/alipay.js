/**
 * Created by trlgml on 2017/5/4.
 */

var config=require('../config/config');
var fs=require('fs'),
crypto = require('crypto'),
qs = require('querystring'),
_ = require('lodash'),
request = require('request'),
signUtil = {},
alipay={},

alipay = function(baseConfig) {
    var self;
    self = this;
    self.mechant_api_url = 'https://openapi.alipay.com/gateway.do';
    self.alipay_config = {
        app_id: config.pay.alipay.app_id,//appid
        format: 'JSON',
        sign_type: 'RSA2',
        version: '1.0',
        charset: 'utf-8',
        direct_notify_url: config.pay.alipay.direct_notify_url,//支付异步通知地址
        direct_return_url: config.pay.alipay.direct_return_url,//支付同步通知地址
        rsa_private_key: config.pay.alipay.rsa_private_key,//私钥存储路径
        alipay_public_key: config.pay.alipay.alipay_public_key,//私钥存储路径
    };
    self.alipay_config = _.extend(self.alipay_config, baseConfig);
    self.request = function(data, callback) {
        var options, sign,biz_content;
        data = signUtil.sortObject(data);
        data = signUtil.objectFilter(data);
        if (data.biz_content) {
            data.biz_content = signUtil.sortObject(data.biz_content);
            data.biz_content = signUtil.objectFilter(data.biz_content);
            data.biz_content = JSON.stringify(data.biz_content);
        }
        sign = signUtil.stringify(data);
        sign = signUtil.sign(sign, self.alipay_config.rsa_private_key);
        data.sign = sign;
        options = {
            method: 'POST',
            url: self.mechant_api_url,
            form: data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }
        };
        return request(options, callback);
    };
    self.verify = function(data, sign) {
        var prestr;
        data = signUtil.sortObject(data);
        delete data.sign_type;
        delete data.sign;
        data = signUtil.objectFilter(data);
        prestr = signUtil.stringify(data);
        return signUtil.verify(prestr, sign, self.alipay_config.alipay_public_key);
    };
    self.alipay_trade_wap_pay = function(data, callback) {
        param = {
            app_id:self.alipay_config.app_id,
            method: 'alipay.trade.wap.pay',
            return_url: self.alipay_config.direct_return_url,
            charset: self.alipay_config.charset,
            sign_type: self.alipay_config.sign_type,
            version: self.alipay_config.version,
            timestamp: data.timestamp,
            notify_url: self.alipay_config.direct_notify_url,
            biz_content:{
                out_trade_no: data.out_trade_no,
                total_amount: data.total_amount,
                body: data.body,
                subject: data.subject,
                product_code:'2016606',
                timeout_express:'90m'
            }
        };
        return self.request(param, function(error, result) {
            if (result.statusCode === 200 || result.statusCode === 302) {
                if(callback){
                    callback(null, {url: "https://" + result.request.host + result.request.path + "?" + result.request.body});
                }
            } else {
                console.log('支付宝接口出错');
                if(callback){
                    callback({error: '支付宝接口出错'});
                }
            }
        });
    };
    return self;
};


module.exports = {
    alipay:alipay
};

//sing部分
/**
 * 把对象所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
 * @param params 需要拼接的对象
 * @param
 * return 拼接完成以后的字符串
 */

signUtil.stringify = function(params, quotes) {
    var k, ls;
    quotes = quotes || false;
    ls = '';
    for (k in params) {
        if (typeof params[k] === 'object') {
            ls += k + '=' + JSON.stringify(params[k]) + '&';
        } else {
            ls += k + '=' + params[k] + '&';
        }
    }
    return ls.substring(0, ls.length - 1);
};


/**
 * 移除参数对象中的空值和不参与签名的参数
 * @param {JSON} object 接收到的参数对象
 * @param {Array} excepts 不参与签名的属性字符串数组, 默认为[]
 * @param {Boolean} allowempty 是否允许空值(即是否不过滤空值)，默认为false
 * @return {JSON} 处理后的新签名参对象
 */

signUtil.objectFilter = function(object, excepts, allowempty) {
    var k, param_filter;
    excepts = excepts || [];
    allowempty = allowempty || false;
    param_filter = {};
    for (k in object) {
        if (!allowempty && object[k] === '' || ~excepts.indexOf(k)) {
            continue;
        } else {
            param_filter[k] = object[k];
        }
    }
    return param_filter;
};


/**
 * 对对象排序
 * @param {JSON} param 排序前的对象
 * @return {JSON} 排序后的对象
 */

signUtil.sortObject = function(object) {
    var index, key, keys, sortedObj;
    sortedObj = {};
    keys = Object.keys(object);
    keys.sort(function(key1, key2) {
        key1 = key1.toLowerCase();
        key2 = key2.toLowerCase();
        if (key1 < key2) {
            return -1;
        }
        if (key1 > key2) {
            return 1;
        }
        return 0;
    });
    for (index in keys) {
        key = keys[index];
        sortedObj[key] = object[key];
    }
    return sortedObj;
};


/**
 * 生成签名
 * @param {String} prestr 待签名的源字符串
 * @param {String} key_file 私钥文件所在路径
 * @return {String} 签名值
 */

signUtil.sign = function(prestr, key_file) {
    var pem, prikey, signob, signstr;
    pem = fs.readFileSync(key_file);
    prikey = pem.toString('ascii');
    signob = crypto.createSign('RSA-SHA256');
    signob.update(prestr, 'utf8');
    signstr = signob.sign(prikey, 'base64');
    return signstr;
};

/**
 * 验证签名
 * @param {String} prestr 需要签名的字符串
 * @param {String} sign 签名结果
 * @param {String} cert_file 支付宝公钥文件路径
 * @return {Boolean} 是否通过验证
 */

signUtil.verify = function(prestr, sign, cert_file) {
    var publicKey, publicPem, verifyob;
    publicPem = fs.readFileSync(cert_file);
    publicKey = publicPem.toString('ascii');
    verifyob = crypto.createVerify('RSA-SHA256');
    verifyob.update(prestr, 'utf8');
    return verifyob.verify(publicKey, sign, 'base64');
};


