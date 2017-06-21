var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var utils = require('../../utils/page');
var Str = require('../../utils/str');
var co = require('co');
var _ = require('lodash');
var Logs=require("../controller/logs");

exports.activity_render = function (req, res) {
  return res.render('activity/list', {
    title: '活动列表',
  });
};
exports.activity_list = function (req, res) {
  var body=req.query;
  var options=utils.cms_get_page_options(req);
  var where={}
  models.Activity.findAndCountAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
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
exports.activity_add_render = function (req, res) {
  return res.render('activity/add', {
    title: '新建活动'
  });
};
exports.activity_create = function (req, res) {
  var body=req.body;
  models.Activity.create(body).then(function(item){
    Logs.logsSave({
      lg_content: "新增活动【"+body.activity_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err);
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.activity_edit_render = function (req, res) {
  var body=req.query;
  models.Activity.findOne({
    where:{activity_id:body.id},raw:true
  }).then(function(item){
    if (item) {
      item.activity_etime=Str.getUnixToTime(item.activity_etime)
      item.activity_stime=Str.getUnixToTime(item.activity_stime)
      return res.render('activity/edit', {
        title: '活动修改',
        item:item,
        aly:config.aly
      });
    }
  },function(err){
    console.log(err);
    return res.render(err);
  })
};
exports.activity_update = function (req, res) {
  var body=req.body;
  models.Activity.update(body,{
    where:{activity_id:body.activity_id}
  }).then(function(items) {
    Logs.logsSave({
      lg_content: "更改活动【"+body.activity_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res,{message:"操作成功"});
  },function(err){
    console.log(err)
    return response.onError(res, {message:err.errors[0].message});
  })
};