var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var response = require('../../utils/response');
var str = require('../../utils/str');
var config=require('../../config/config');
var moment=require('moment');
var co = require('co');
var _ = require('lodash');
var StringBuilder = require('../../utils/StringBuilder');

module.exports={
  list:function (req,res) {
    var body=req.query;
    var options=utils.get_page_options(req);
    models.Activity.findAll({
      raw:true,
      where:{activity_status:0},
      order:[['activity_stime','DESC']],
      limit:options.pagesize,
      offset:options.offset,
      attributes:[['activity_id','id'],['activity_title','title'],['activity_img','img'],['activity_address','address'],['activity_official','official'],['activity_link','link'],['activity_stime','stime'],['activity_etime','etime'],['activity_content','content']]
    }).then(function (data) {
      data.forEach(function(node,index){
        "use strict";
        node.stime=str.getUnixToTime(node.stime)
        node.etime=str.getUnixToTime(node.etime)
        node.img=str.AbsolutePath(node.img)
        node.tag=1
        var newDate=str.getUnixToTime(moment())
        if(newDate>node.stime && newDate<node.etime){
          node.tag=2
        }else if(newDate>node.etime){
          node.tag=3
        }
      })
      return response.ApiSuccess(res,{list:data})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },detail:function (req,res) {
    var body=req.query;
    if(!body.id){
      return response.ApiError(res,{message:'缺少参数'})
    }
    models.Activity.findOne({
      raw:true,
      where:{activity_status:0,activity_id:body.id},
      attributes:[['activity_id','id'],['activity_title','title'],['activity_img','img'],['activity_address','address'],['activity_official','official'],['activity_link','link'],['activity_stime','stime'],['activity_etime','etime'],['activity_content','content']]
    }).then(function (data) {
      "use strict";
      data.stime=str.getUnixToTime(data.stime)
      data.etime=str.getUnixToTime(data.etime)
      data.img=str.AbsolutePath(data.img)
      data.tag=1
      var newDate=str.getUnixToTime(moment())
      if(newDate>data.stime && newDate<data.etime){
        data.tag=2
      }else if(newDate>data.etime){
        data.tag=3
      }
      return response.ApiSuccess(res,{data})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  }
};