/**
 * Created by trlgml on 2017/3/28.
 * 公用工具
 */
var utils = {};
var config = require('../config/config');
var url = require('url');
var path =require('path');
var moment = require('moment');
var _ = require('lodash');
var crypto = require('crypto');

/**
 * 参数验证
 * @param arr 参数数组
 * @param body 值
 * @returns {boolean}
 */
utils.ParameterControl = (arr,body) => {
    "use strict";
    var auth=0
    arr.map(function (node,index) {
        for (var key in body) {
            if(key==node && body[key]){
                auth+=1
            }
        }
    })
    return auth!=arr.length;
};
/**
 * 路径转换
 * @param path 路径
 * @param baseUrl 域名
 * @returns {*}
 * @constructor
 */
utils.AbsolutePath = (path,baseUrl) => {
    if(!path){
        return ''
    }
    if (path!=="" && path.indexOf("http://") < 0 && path.indexOf("https://") < 0) {
        path = url.resolve(baseUrl, path);
    }
    return path
}
/**
 * 图片路径
 * @param path
 * @returns {*}
 * @constructor
 */
utils.ImagePath = (path) => {
    return utils.AbsolutePath(path,config.aly)
}
/**
 * 视频路径
 * @param path
 * @returns {*}
 * @constructor
 */
utils.VideoPath = (path) => {
    return utils.AbsolutePath(path,config.aly_video)
}
/**
 * md5加密
 * @param str 加密字符串
 * @returns {*}
 */
utils.md5= (str) => {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}
/**
 * 字符串加密
 * @param path 路径
 * @returns {*}
 */
utils.createUpt = (path) => {
    var time=parseInt(new Date().getTime()/1000);
    var endTime=time+600;
    // var path=req.originalUrl;
    var secret='geju';
    var upt=utils.md5(secret+'&'+endTime+'&'+path).substr(12,8);
    return upt+endTime;
}
/**
 * 字符串解密
 * @param upt 加密后的字符串
 * @param path 路径
 * @returns {boolean}
 */
utils.authUpt = (upt,path) => {
    "use strict";
    var time=parseInt(new Date().getTime()/1000);
    var secret='geju';
    var endTime=upt.substr(8)
    console.log(endTime)
    if(endTime>time){
        console.log('未过期')
        var authUpt=utils.md5(secret+'&'+endTime+'&'+path).substr(12,8);
        if(authUpt+endTime==upt){
            console.log('验证过了')
            return true
        }else {
            console.log('验证失败了')
            return false
        }
    }else {
        console.log('超时了')
        return false
    }
}
module.exports = utils;

