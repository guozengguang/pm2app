var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var utils = require('../../utils/page');
var Str = require('../../utils/str');
var co = require('co');
var _ = require('lodash');
var Logs=require("../controller/logs");

exports.international_render = function (req, res) {
  return res.render('international/list', {
    title: '国际化列表',
  });
};
exports.international_subset_render = function (req, res) {
  var body=req.query;
  models.International.findOne({
    where:{international_id:body.id},raw:true
  }).then(function(item){
    if (item) {
      return res.render('international/subset/list', {
        title: '子国际化列表',
        item:item
      })
    }
  },function(err){
    console.log(err);
    return res.render(err);
  })

};
exports.international_list = function (req, res) {
  var body=req.query;
  var options=utils.cms_get_page_options(req);
  var where={international_parent:0};
  var order=[['createdAt', 'DESC']]
  if(body.international_parent){
    where.international_parent=body.international_parent;
    order=[['createdAt']]
  }
  models.International.findAndCountAll({
    where:where,
    order:order,
    limit:options.pagesize,
    offset:options.offset
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.index = options.offset + index + 1
        node.dataValues.createdAt = Str.getUnixToTime(node.dataValues.createdAt)
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
exports.international_add_render = function (req, res) {
  return res.render('international/add', {
    title: '新建国际化',
  });
};
exports.international_subset_add_render = function (req, res) {
  var body=req.query
  return res.render('international/subset/add', {
    title: '新增子国际化',
    id:body.id
  });
};
exports.international_create = function (req, res) {
  var body=req.body;
  models.International.create(body).then(function(item){
    Logs.logsSave({
      lg_content: "新建国际化【"+body.international_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err);
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.international_edit_render = function (req, res) {
  var body=req.query;
  models.International.findOne({
    where:{international_id:body.id}
  }).then(function(item){
    if (item) {
      return res.render('international/edit', {
        title: '国际化维护',
        item:item,
        aly:config.aly
      });
    }
  },function(err){
    console.log(err);
    return res.render(err);
  })
};
exports.international_subset_edit_render = function (req, res) {
  var body=req.query;
  models.International.findOne({
    where:{international_id:body.id},
    raw:true
  }).then(function(item){
    if (item) {
      return res.render('international/subset/edit', {
        title: '子国际化维护',
        item:item,
        aly:config.aly
      });
    }
  },function(err){
    console.log(err);
    return res.render(err);
  })
};
exports.international_update = function (req, res) {
  var body=req.body;
  models.International.update(body,{
    where:{international_id:body.international_id}
  }).then(function(items) {
    Logs.logsSave({
      lg_content: "更改国际化【"+body.international_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res,{message:"操作成功"});
  },function(err){
    console.log(err)
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.international_video_render = function (req,res){
  var body=req.query;
  return res.render('international/subset/video', {
    title: '关联视频',
    aly:config.aly
  });
};