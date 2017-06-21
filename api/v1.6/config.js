var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var response = require('../../utils/response');
var config=require('../../config/config');
var database=require('../../database.js');
var co = require('co');
var moment = require('moment');
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
      return response.ApiSuccess(res,{data:list});
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:err.message});
    })
  },get_vote:function(req,res,next){
    req.vote=100000;
    next()
    //models.Config.findOne({
    //  where:{key:'vote'},
    //  attributes:['key','val']
    //}).then(function(result){
    //  if (result){
    //    req.vote=JSON.parse(result.dataValues.val);
    //  }
    //  next()
    //},function(err){
    //  console.log(err);
    //  next();
    //})
  },get_version:function(){
    return "/v1.6";
  },get_diagram:function(req,res){
    var time=str.getUnix(moment())
    models.Diagram.findOne({
      where:{status:1,stime:{"$lte":time},etime:{"$gte":time}},
      attributes:[['pics','diagram']],
      raw:true
    }).then(function(item){
      console.log(item)
      if(item){
        item.diagram=str.AbsolutePath(item.diagram)
      }
      return response.ApiSuccess(res,{data:item?item.diagram:''});
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:err.message});
    })
  },picker_view:function (req,res) {
    return response.ApiSuccess(res,{
      education:database.education,
      trade:database.trade,
      lnasset:database.lnasset,
      city:database.city
    })
  },get_images:function (req,res) {
    var body=req.query;
    var arr=[]
    console.log(body)
    if(body.type=="Android"){
      arr=['/public/Android/userbg_01.png','/public/Android/userbg_02.png','/public/Android/userbg_03.png','/public/Android/userbg_04.png','/public/Android/userbg_05.png','/public/Android/userbg_06.png','/public/Android/userbg_07.png','/public/Android/userbg_08.png','/public/Android/userbg_09.png']
    }
    if(body.type=="IOS"){
      arr=['/public/IOS/one.jpg','/public/IOS/two.jpg','/public/IOS/three.jpg','/public/IOS/four.jpg','/public/IOS/five.jpg','/public/IOS/six.jpg','/public/IOS/seven.jpg','/public/IOS/eight.jpg','/public/IOS/nine.jpg']
    }
    return response.ApiSuccess(res,{
      url:'http://files.cdn.geju.com',
      arr:arr
    })
  },
  article_style:function (req,res,next) {
    models.Config.findOne({
      where:{key:'style'},
      attributes:['val'],
      raw:true
    }).then(function (item) {
      req.articleStyle=item.val;
      next()
    }).catch(function (err) {
      req.articleStyle='';
      next()
    })
  }
};
module.exports=Config;