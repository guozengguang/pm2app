var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var response = require('../../utils/response');
var str = require('../../utils/str');
var config=require('../../config/config');
var thunkify = require('thunkify');
var request = require('request');
var get = thunkify(request.get);
var co = require('co');


var Felog={
  set_log:function(req,res){
    var body = req.body;
    //alipay.create_direct_pay_by_user_notify(req,res);
    // var l_userid = req.body.l_userid;
    // var l_username = req.body.l_username;
    // var l_page = req.body.l_page;

    // var l_buttonevent = req.body.l_buttonevent;
    // var l_mtype = req.body.l_mtype;
    // var l_version = req.body.l_version;
    // var l_pdata = req.body.l_pdata;
    // var l_clicktime = req.body.l_clicktime;

    models.Felog.create({
      l_userid:body.l_userid,
      l_username:body.l_username,
      l_userinfo:body.l_userinfo,
      l_page:body.l_page,
      l_buttonevent:body.l_buttonevent,
      l_mtype:body.l_mtype,
      l_version:body.l_version,
      l_pdata:body.l_pdata,
      l_clicktime:body.l_clicktime
    }).then(function(item){
      return response.ApiSuccess(res,{})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"set_log error"});
    })
  }
};
module.exports=Felog;