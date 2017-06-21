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
// return response.ApiError(res,{message:"send_sms error"});
// return response.onDataSuccess(res,{data:list});
// return response.onListSuccess(res,{list:list});
var Media={
  get_mediasbycolumnid:function(req,res){
    var columnid=req.query.columnid;
   
    if (!columnid) {
      columnid=0;
    }
    models.Media.findAll({
      where:{media_columnid:columnid}
    }).then(function(item){
      if (item) {
        return response.ApiSuccess(res,{list:item});
      }else {
        return response.ApiSuccess(res,{list:null});
      }
    }, function(err){
        return response.ApiError(res,{message:"get columns error"});
    });
  },get_mediabyid:function(req,res){
    var mediaid=req.query.mediaid;
   
    if (!mediaid) {
      return response.ApiError(res,{message:"mediaid empty"});
    }
    models.Media.findOne({
      where:{mediaid:mediaid}
    }).then(function(item){
      if (item) {
        return response.ApiSuccess(res,{data:item});
      }else {
        return response.ApiSuccess(res,{data:null});
      }
    }, function(err){
        return response.ApiError(res,{message:"get media error"});
    });
  },get_video:function(req,res){
    //models.Attach.destroy({where:{attach_type:1}})
    var body=req.query;
    var where={};
    where.attach_type=1
    models.Attach.findOne({
      where:where
    }).then(function(item){
      if (item) {
        item.dataValues.attach_path = str.AbsoluteVideoPath(item.dataValues.attach_path);
        return response.ApiSuccess(res,{data:item})
      }else {
        return response.onError(res,'没有数据')
      }
    }, function(err){
      console.log(err)
    });
  }
};
module.exports=Media;