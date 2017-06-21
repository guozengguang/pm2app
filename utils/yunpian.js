var https = require('https');
var qs = require('querystring');

var apikey = "bf998e410e2887a908ca78c4dc49edf7";

// 智能匹配模板发送https地址
var sms_host = 'sms.yunpian.com';
var voice_host = 'voice.yunpian.com';

// 查询账户信息https地址
var get_user_info_uri = '/v2/user/get.json';
// 智能匹配模板发送接口https地址
var send_sms_uri = '/v2/sms/single_send.json';
// 指定模板发送接口https地址(单发)
var send_tpl_sms_uri = '/v2/sms/tpl_single_send.json';
// 发送语音验证码接口https地址
var send_voice_uri = '/v2/voice/send.json';
// 获取模板接口
var get_tpl = '/v2/tpl/get.json';
// 添加模板接口
var add_tpl = '/v2/tpl/add.json';
// 删除模板接口
var del_tpl = '/v2/tpl/del.json';
//单发接口
var single_send= '/v2/sms/single_send.json';
//批量发送接口
var batch_send= '/v2/sms/batch_send.json';
// 批量个性化发送接口
var multi_send= '/v2/sms/multi_send.json';

var Yun={}
/**
 * 信息查询（与发送短信无关）
 */
Yun.query_user_info = () =>{
    var post_data = {
        'apikey': apikey,
    };//这是需要提交的数据
    var content = qs.stringify(post_data);
    return post(get_user_info_uri,content,sms_host);
}
/**
 * 智能匹配发送
 * @param option
 * @param option.mobile
 * @param option.text
 */
Yun.send_sms = (option) =>{
    var post_data = {
        'apikey': apikey,
        'mobile':option.mobile,
        'text':option.text,
    };//这是需要提交的数据  
    var content = qs.stringify(post_data);
    return post(send_sms_uri,content,sms_host);
}
/**
 * 模板id发送
 * @param option
 * @param option.mobile
 * @param option.tpl_id
 * @param option.tpl_value
 */
Yun.send_tpl_sms = (option) =>{
    var post_data = {
        'apikey': apikey,
        'mobile':option.mobile,
        'tpl_id':option.tpl_id,
        'tpl_value':qs.stringify(option.tpl_value),
    };//这是需要提交的数据  
    var content = qs.stringify(post_data);
    return post(send_tpl_sms_uri,content,sms_host);
}
/**
 * 语音验证码调用
 * @param option
 * @param option.mobile
 * @param option.code
 */
Yun.send_voice_sms = (option) =>{
    var post_data = {
        'apikey': apikey,
        'mobile':option.mobile,
        'code':option.code,
    };//这是需要提交的数据  
    var content = qs.stringify(post_data);
    return post(send_voice_uri,content,voice_host);
}
/**
 * 获取模板接口
 * @param option
 * @param option.id  模板id可以为空
 * @returns {Promise}
 */
Yun.get_tpl = (option) =>{
    var post_data = {
        'apikey': apikey,
        'tpl_id':option.id
    };//这是需要提交的数据
    var content = qs.stringify(post_data);
    return post(get_tpl,content,sms_host);
}
/**
 * 添加模板接口
 * @param option
 * @param option.content 接口内容
 * @returns {Promise}
 */
Yun.add_tpl = (option) =>{
    var post_data = {
        'apikey': apikey,
        'tpl_content':"【格局商学】"+option.content,
        'notify_type':3,
    };//这是需要提交的数据
    var content = qs.stringify(post_data);
    return post(add_tpl,content,sms_host);
}
/**
 * 添加模板接口
 * @param option
 * @param option.id 模板id
 * @returns {Promise}
 */
Yun.del_tpl = (option) =>{
    var post_data = {
        'apikey': apikey,
        'tpl_id':option.id
    };//这是需要提交的数据
    var content = qs.stringify(post_data);
    return post(del_tpl,content,sms_host);
}
/**
 * 单发接口
 * @param option
 * @param option.mobile
 * @param option.text
 */
Yun.single_send = (option) =>{
    var post_data = {
        'apikey': apikey,
        'mobile':option.mobile,
        'text':option.text
    };//这是需要提交的数据
    var content = qs.stringify(post_data);
    return post(single_send,content,sms_host);
}
/**
 * 批量发送接口
 * @param option
 * @param option.mobile 手机号码数组 1000以内
 * @param option.text
 */
Yun.batch_send = (option) =>{
    var post_data = {
        'apikey': apikey,
        'mobile':option.mobile.join(','),
        'text':option.text
    };//这是需要提交的数据
    var content = qs.stringify(post_data);
    return post(batch_send,content,sms_host);
}
/**
 * 批量个性化发送接口
 * @param option
 * @param option.mobile  手机号数组
 * @param option.text 模板数组
 */
Yun.multi_send = (option) =>{
    var text=option.text;
    text.forEach(function (node,index) {
        text[index]=encodeURI(node)
    })
    var post_data = {
        'apikey': apikey,
        'mobile':option.mobile.join(','),
        'text':text.join(',')
    };//这是需要提交的数据
    var content = qs.stringify(post_data);
    return post(multi_send,content,sms_host);
}
/**
 * 公用请求方式Promise调用
 * @param uri 请求路径
 * @param content 需要提交的数据
 * @param host 请求域名地址
 * @returns {Promise}
 */
function post(uri,content,host){
    var options = {
        hostname: host,
        port: 443,
        path: uri,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    };
    return new Promise(function (resolve,reject) {
        "use strict";
        var req = https.request(options, function (res) {
            // console.log('STATUS: ' + res.statusCode);
            // console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                return resolve((typeof chunk === 'string')?JSON.parse(chunk):chunk);
            });
            req.on('error', function (e) {
                return reject(e);
            });
        });
        req.write(content);
        req.end();
    })
}
module.exports = Yun;