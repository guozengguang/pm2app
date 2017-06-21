"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');;
var co = require('co');
var Logs=require("../controller/logs");

exports.list = function (req, res) {
  return res.render('notifics/list', {
    title: '消息列表',
  });
};
exports.list_ajax = function (req, res) {
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  models.Notifics.findAndCountAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.createdAt = str.getUnixToTime(node.dataValues.createdAt);
        node.dataValues.updatedAt = str.getUnixToTime(node.dataValues.updatedAt);
        node.dataValues.index = options.offset + index + 1
      });
      return response.onSuccess(res, {
        list:list,
        pagecount: Math.ceil(item.count / options.pagesize)
      })
    }else {
      return response.onError(res,'没有数据')
    }
  }, function(err){
    console.log(err)
  });
};
exports.notifics_add=function(req,res){
  return res.render('notifics/notifics_add',{
    title:'新增推送内容'
  })
};
exports.notifics_edit=function(req,res){
  var body=req.query;
  var where={};
  where.notid=body.notid;
  models.Notifics.findOne({
    where:where,
    raw:true
  }).then(function(item){
    item.not_stime=item.not_stime=='Invalid Date'?'':str.getUnixToTime(item.not_stime);
    item.not_etime=item.not_etime=='Invalid Date'?'':str.getUnixToTime(item.not_etime);
    if (item){
      return res.render('notifics/notifics_edit',{
        title:'修改推送信息',
        item:item,
        aly:config.aly
      })
    }
  },function(err){
    console.log(err)
  })
};
exports.notifics_del=function(req,res){
  var body=req.body;
  var where={};
  console.log(body)
  where.notid=body.notid;
  models.Notifics.destroy({
    where:where
  }).then(function(item){
    return response.onSuccess(res, {})
  },function(err){
    console.log(err)
  })
};
exports.notifics_create = function (req, res) {
  var body=req.body;
  models.Notifics.create(body).then(function(){
    Logs.logsSave({
      lg_content: "新建通知【"+body.not_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'创建成功'})
  },function(err){
    console.log(err)
  })
};
exports.notifics_update = function (req,res) {
  var body=req.body;
  var notid=body.notid;
  console.log(body)
  delete body.notid;
  models.Notifics.update(body,{where:{notid:notid}}).then(function(){
    Logs.logsSave({
      lg_content: "修改通知【"+body.not_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err)
  });
};
exports.notifics_push =function (req,res){
  var body=req.body;
  co(function* (){
    try{
      var ts=yield models.Config.findOne({
        where:{key:'tips'},
        attributes:['val']
      });
      var notifics= yield models.Notifics.findOne({
        where:{notid:body.notid}
      });
      notifics.update({not_type:1});
      var member=yield models.Members.findOne({
        where:{mid:ts.dataValues.val},
        attributes:['m_name','m_pics']
      });
      if(member){
        //获取所有学生
        var allmember=yield models.Members.findAll({
          where:{m_type:{'$in':[0,4,10]}},
          attributes:['mid']
        });
        var allarr=[];
        //数组长度应该有限制  环信规定20人左右   TODO
        for(var index=0,len=allmember.length;len>index;index++){
          allarr.push(allmember[index].dataValues.mid);
        }
        member.dataValues.m_pics=str.AbsolutePath(member.dataValues.m_pics);
        var hx = require('../../utils/hxchat');
        var option={
          fromuser:ts.dataValues.val,
          msg:notifics.dataValues.not_title,
          users:allarr,
          avatarURLPath:member.dataValues.m_pics,
          nickName:member.dataValues.m_name
        }
        hx.sendmessages(option,function(err,result){
          console.log(result);
          console.log(err)
        })
        return response.onSuccess(res, {message:'操作成功'});
      }else {
        return response.ApiError(res,{message:'系统用户'})
      }
    }catch (err){
      console.log(err);
      return response.ApiError(res,{message:'err'})
    }
  })
}