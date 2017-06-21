var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var response = require('../../utils/response');
var config=require('../../config/config');
var co = require('co');
var Config={
  get_init_config:function(req,res){
    var list={};
    models.Config.findAll({
      attributes:['key','val']
    }).then(function(items){
      items.forEach(function(node,index){
        if(node.key=='shield'){
          list[node.key]=Number(node.val)
        }else if(/\/page\//g.test(node.val)){
          list[node.key]=config.website+Config.get_version()+node.val;
        }else{
          list[node.key]=node.val;
        }
      });
      return response.onDataSuccess(res,{data:list});
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:"get_init_config error"});
    })
  },get_vote:function(req,res,next){
    models.Config.findOne({
      where:{key:'vote'},
      attributes:['key','val']
    }).then(function(result){
      if (result){
        req.vote=JSON.parse(result.dataValues.val);
      }
      next()
    },function(err){
      console.log(err);
      next();
    })
  },get_version:function(){
    return "/v1.0";
  }
};
module.exports=Config;