var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var algorithm = require('ape-algorithm');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config=require('../../config/config');
var co = require('co');
var moment = require('moment');

var  Pay={
  get_weixinpayurl:function(req,res){
    var product_id=req.body.productid;
     if(!product_id){
      return response.ApiError(res,{message:"productid empty"});
    }
    var nonce_str=""; 
    for(var i=0;i<24;i++) 
    { 
      nonce_str += Math.floor(Math.random()*10); 
    } 
    var time_stamp = date.parse(new date())/1000;
    stringA='appid='+config.weixin.appid+'&mch_id='+config.weixin.mch_id+'&nonce_str='+nonce_str+'&product_id='+product_id+'&time_stamp='+time_stamp;
    stringSignTemp=stringA+"&key=192006250b4c09247ec02edce69f6a2d" ;
    sign=str.md5(stringSignTemp).toUpperCase();
    var url = 'weixin：//wxpay/bizpayurl?sign='+sign+'&appid='+config.weixin.appid+'&mch_id='+config.weixin.mch_id+'&nonce_str='+nonce_str+'&product_id='+product_id+'&time_stamp='+time_stamp;
    return response.onDataSuccess(res,{data:url})
  }
}
module.exports=Pay;