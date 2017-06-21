var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var response = require('../../utils/response');
var str = require('../../utils/str');
var config=require('../../config/config');
//var cache=require('../../utils/cache');
var moment=require('moment');
var Places={
  get_places:function(req,res){
    models.PlacesItem.findAll({
      where:{pi_status:0,pi_stime:{'$lt': moment()},pi_etime:{'$gt': moment()}},
      attributes:['pi_img','pi_stime','pi_type','pi_name','pi_etime','pi_val','p_id'],
      order:[['pi_sort','desc']],
      raw:true
    }).then(function(result){
      result.forEach(function(node,index){
        if(node.dataValues)node=node.dataValues;
        if(node.pi_img)node.pi_img=str.AbsolutePath(node.pi_img);
        if(node.pi_stime)node.pi_stime=str.getUnixToTime(node.pi_stime);
        if(node.pi_etime)node.pi_etime=str.getUnixToTime(node.pi_etime);
      });
      //cache.set(key, Places.format(result), config.redis.time*0);
      return response.ApiSuccess(res,{list:result});
    }).catch(function(err){
      console.log(err);
      return response.onError(res,"get_places error");
    })
    //var key='get_places';
    //cache.get(key, function (err, item) {
    //  if (!item) {
    //    models.PlacesItem.findAll({
    //      where:{p_id:req.query.p_id || 0,pi_status:0},
    //      attributes:['pi_img','pi_stime','pi_type','pi_name','pi_etime','pi_val'],
    //      order:[['pi_sort','asc']]
    //    }).then(function(result){
    //      cache.set(key, Places.format(result), config.redis.time*0);
    //      return response.onListSuccess(res,{list:Places.format(result)});
    //    }).catch(function(err){
    //      console.log(err);
    //      return response.onError(res,"get_places error");
    //    })
    //  }else {
    //    return response.onListSuccess(res,{list:item});
    //  }
    //});
  },format:function(items){
    items.forEach(function(node,index){
      if(node.dataValues)node=node.dataValues;
      if(node.pi_img)node.pi_img=str.AbsolutePath(node.pi_img);
      if(node.pi_stime)node.pi_stime=str.getUnixToTime(node.pi_stime);
      if(node.pi_etime)node.pi_etime=str.getUnixToTime(node.pi_etime);
    });
    return items;
  }
};
module.exports=Places;