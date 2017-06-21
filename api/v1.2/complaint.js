var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config=require('../../config/config');
var co = require('co');

var Complaint={
  set_complaint:function(req,res){
    var body=req.body;
    if (!body.userid || !body.content) {
      return response.ApiError(res,{message:"userid or content empty"});
    }
     models.Feedback.create({
      feedback_content:body.content,
      feedback_fromuser:body.userid,
      feedback_type:10,//投诉
      feedback_touser:body.touserid
    }).then(function(){
      return response.onDataSuccess(res,{data:''})
    }, function(err){
      return response.ApiError(res,{message:"add complaint error"});
    })
  }
};
module.exports=Complaint;