"use strict";
var models  = require('../../models');
var config=require('../../config/config');
var response = require('../../utils/response');
var Logs=require("../controller/logs");


exports.role_render = function (req, res) {
  return res.render('role/role', {
    title: '角色管理',
  });
};
exports.role_list = function (req,res){
  models.Role.findAll({
    where:{r_branch:req.Branch,r_parent:req.Uid}
  }).then(function(items){
    if(items){
      return response.onSuccess(res,{list:items})
    }else{
      response.onError(res,'不存在角色')
    }
  },function(err){
    console.log(err)
  })
};
exports.role_add_render=function(req,res){
  return res.render("role/role_add",{
    title:'新建角色',
  })
};
exports.role_create = function(req,res){
  var body=req.body;
  body.r_branch=req.Branch;
  body.r_parent=req.Uid;
  models.Role.create(body).then(function() {
    Logs.logsSave({
      lg_content: "新建角色【"+body.r_name+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  })
};
exports.role_edit_render=function(req,res){
  var rid=req.query.rid;
  models.Role.findOne({
    where:{rid:rid,r_branch:req.Branch,r_parent:req.Uid}
  }).then(function(items) {
    if(items){
      return res.render("role/role_edit",{
        title:'修改角色',
        list:items?items:[],
      })
    }else {
      res.send('异常操作')
    }
  },function(err){
    console.log(err)
  })
};
exports.role_update = function(req,res){
  var body=req.body;
  var rid=body.rid;
  models.Role.findOne({
    where:{rid:rid,r_branch:req.Branch}
  }).then(function(items) {
    items.update(body).then(function(){
      Logs.logsSave({
        lg_content: "修改角色【"+body.r_name+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res,{message:"操作成功"});
    },function(err){
      console.log(err)
    });
  },function(err){
    console.log(err)
  })
};
exports.role_del=function(req,res){
  var where=req.query;
  models.Role.destroy({
    where:where
  }).then(function(){
    Logs.logsSave({
      lg_content: "删除角色 id【"+where.rid+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res,{message:"操作成功"});
  },function(err){
    console.log(err)
  });
};
exports.role_update_status=function(req,res){
  var body=req.body;
  models.Role.findOne({
    where:{rid:body.rid,r_branch:req.Branch}
  }).then(function(items) {
    items.update(body).then(function(){
      Logs.logsSave({
        lg_content: "修改角色 id【"+body.rid+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res,{message:"操作成功"});
    },function(err){
      console.log(err)
    });
  },function(err){
    console.log(err)
  })
};