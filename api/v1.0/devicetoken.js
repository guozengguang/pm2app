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

var  Devicetoken={
  add_devicetoken:function(req,res){
    var memberphone=req.body.memberphone;
    var devicetoken=req.body.devicetoken;
    if(!memberphone){
      return response.ApiError(res,{message:"member phone empty"});
    }
    if(!devicetoken){
      return response.ApiError(res,{message:"device token empty"});
    }

      models.Devicetoken.create({
      mdt_memberphone:memberphone,
      mdt_devicetoken:devicetoken
    }).then(function(){
      return response.onDataSuccess(res,{data:{}})
    }, function(err){
      return response.ApiError(res,{message:"create device error"});
    })
  }
}
module.exports=Devicetoken;