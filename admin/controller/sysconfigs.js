"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var response = require('../../utils/response');
var Logs=require("../controller/logs");

exports.list = function (req, res) {
  res.render('sysconfig/sysconfigs', {
    title: '参数配置'
  });
};
exports.list_ajax = function (req, res) {
  models.Config.findAll()
      .then(function(items){
        return response.onSuccess(res,{list:items})
      },function(err){
        console.log(err)
      })
};
exports.sysconfigs_save=function(req,res){
  var body=req.body;
  var id=body.id;
  if(id){
    var where={id:id};
    models.Config.findOne({
      where:where
    }).then(function(items){
      items.update(body).then(function(){
        Logs.logsSave({
          lg_content: "更新app参数【"+id+"】",
          lg_ip: req.ip,
          uid:req.session.user.uid
        });
        return response.onSuccess(res,{message:'操作成功'})
      },function(err){
        console.log(err)
      })
    },function(err){
      console.log(err)
    })
  }else{
    models.Config.create(body).then(function(items){
      Logs.logsSave({
          lg_content: "新建app参数【"+body.desc+"】",
          lg_ip: req.ip,
          uid:req.session.user.uid
        });
      return response.onSuccess(res,{message:'操作成功'})
    },function(err){
      console.log(err)
    })
  }
};
exports.sysconfigs_del=function(req,res){
  var id=req.query.id;
  var where={id:id};
  models.Config.destroy({
    where:where
  }).then(function(){
    Logs.logsSave({
      lg_content: "删除app参数【"+id+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res,{message:"操作成功"});
  },function(err){
    console.log(err)
    return response.onError(res,{message:"失败"});
  })
}