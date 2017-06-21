var config = require('../config/config');
var url = require('url');
var path =require('path');
var moment = require('moment');
var validator = require('validator');
var fs = require('fs');
var _ = require('lodash');
var crypto = require('crypto');
module.exports = {
  AbsolutePath:function (path) {
    if(!path){
      return ''
    }
    if (path!=="" && path.indexOf("http://") < 0 && path.indexOf("https://") < 0) {
      path = url.resolve(config.aly, path);
    }
    return path
  },AbsoluteVideoPath:function (path) {
    if (path!=="" && path.indexOf("http://") < 0 && path.indexOf("https://") < 0) {
      path = url.resolve(config.aly_video, path);
    }
    return path;
  },AbsoluteHtml5Path:function(path){
    return url.resolve(config.website, path);
  },AbsolutePdfPath:function(path){
    return url.resolve(config.pdf_web, path);
  },getTimeToUnix:function(time){
  	return parseInt(moment(time).format('X'));
  },getUnixToTime:function(time){
    return time?moment(time).format("YYYY-MM-DD HH:mm:ss"):''
  },getUnix:function(time){
    if(time){
      return time?moment(time).format("YYYY-MM-DD"):''
    }
  },getRewardNo:function(options){
    var s=options.prefix+parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10);
    //根据用户id可以做校验位
    return s;
  },getUid:function(){
    var s=moment().format("mmssSSS").toString()+parseInt(Math.random()*10);
    return s;
  },AlyPath:function (path) {
    if (path!=="" && path.indexOf("http://") < 0 && path.indexOf("https://") < 0) {
      path = url.resolve(config.aly, path);
    }
    return path;
  },md5:function (str) {
      var md5sum = crypto.createHash('md5');
      md5sum.update(str);
      str = md5sum.digest('hex');
      return str;
  },getImageInfo : function(path){
    return new Promise(function(resolve,reject){
      var request = require('request');
      request.get(path+'?x-oss-process=image/info',function(err,response,body){
        if(err){
          reject(err)
        }else {
          var data=JSON.parse(body)
          resolve({h:data.ImageHeight.value,w:data.ImageWidth.value})
        }
      })
    })
  },
  getMediaInfo : function (file){
    var request = require('request');
    var ALY = require('./aly/util');
    return new Promise(function(resolve,reject){
      request.post({url:ALY.url,form:ALY.mts.SubmitMediaInfoJob({file:file})},function(err,response, body){
        if(err){
          reject(err)
        }else {
          var info=JSON.parse(body);
          if(info.MediaInfoJob.State=="Success"){
            resolve(parseInt(info.MediaInfoJob.Properties.Duration))
          }else {
            resolve(0)
          }
        }
      })
    })
  },
  create: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }).toUpperCase();
  },  /**
   * 验证参数是否缺失
   * @param arr 需要验证字段的数组
   * @param body 传入的参数
   * @returns {boolean} false 缺失 true 不确
   */
  parameterControl : (arr,body) => {
    "use strict";
    var auth=0
    arr.map(function (node,index) {
      for (var key in body) {
        if(key==node){
          auth+=1
        }
      }
    })
    return auth!=arr.length;
  }
}
