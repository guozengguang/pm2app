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
var Column={
  get_columnsbyid:function(req,res){
    var columnid=req.query.columnid;
   
    if (!columnid) {
      columnid=0;
    }
    models.Column.findAll({
      where:{column_path:columnid}
    }).then(function(item){
      if (item) {
        return response.ApiSuccess(res,{list:item});
      }else {
        return response.ApiSuccess(res,{list:[]});
      }
    }, function(err){
        return response.ApiError(res,{message:err.message});
    });
  }
};
module.exports=Column;